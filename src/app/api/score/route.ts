import { NextResponse } from "next/server";
import { WORDS } from "@/server/words";
import type { Mark } from "@/types/mark";
import crypto from "crypto";

// Same helpers as /api/puzzle
const START_UTC = Date.UTC(2025, 0, 1);
const SEED = process.env.WORDS_SEED ?? "dev-seed-only-change-in-prod";

function todayUTCKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysSinceStartUTC(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00.000Z");
  const days = Math.floor((d.getTime() - START_UTC) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function idxForDateKey(dateKey: string) {
  const days = daysSinceStartUTC(dateKey);
  const h = crypto.createHmac("sha256", SEED).update(String(days)).digest();
  const num = h.readUInt32BE(0);
  return num % WORDS.length;
}

function normalizeWord(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function scoreGuess(guess: string, word: string): Mark[] {
  const n = word.length;
  if (guess.length !== n) {
    throw new Error(
      `scoreGuess: guess and word must have same length (${guess.length} vs ${n}).`
    );
  }
  const marks: Mark[] = Array(n).fill("absent");
  const counts: Record<string, number> = {};
  for (const ch of word) counts[ch] = (counts[ch] ?? 0) + 1;
  // exact matches
  for (let i = 0; i < n; i++) {
    if (guess[i] === word[i]) {
      marks[i] = "correct";
      counts[guess[i]]!--;
    }
  }
  // presents
  for (let i = 0; i < n; i++) {
    const ch = guess[i];
    if (marks[i] === "absent" && counts[ch] > 0) {
      marks[i] = "present";
      counts[ch]!--;
    }
  }
  return marks;
}

/**
 * Stateless progress token.
 * Format: "<count>.<base64url(HMAC(SEED, `${puzzleId}:${count}`))>"
 * Server verifies the signature to trust the count.
 */
function makeToken(puzzleId: string, count: number) {
  const sig = crypto
    .createHmac("sha256", SEED)
    .update(`${puzzleId}:${count}`)
    .digest("base64url");
  return `${count}.${sig}`;
}

function parseAndVerifyToken(puzzleId: string, token?: string | null): number {
  if (!token) return 0;
  const parts = String(token).split(".");
  if (parts.length !== 2) return 0;
  const count = Number(parts[0]);
  if (!Number.isInteger(count) || count < 0 || count > 6) return 0;
  const expected = crypto
    .createHmac("sha256", SEED)
    .update(`${puzzleId}:${count}`)
    .digest("base64url");
  if (expected !== parts[1]) return 0;
  return count;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    guess: string;
    puzzleId: string;
    progressToken?: string | null;
  };

  const { guess, puzzleId, progressToken } = body || {};
  if (!guess || !puzzleId) {
    return NextResponse.json(
      { error: "Missing guess or puzzleId" },
      { status: 400 }
    );
  }

  // Only allow scoring for today's puzzle (prevents farming future answers)
  const today = todayUTCKey();
  if (puzzleId !== today) {
    return NextResponse.json({ error: "Invalid puzzle id" }, { status: 400 });
  }

  // Verify previous progress
  const prevCount = parseAndVerifyToken(puzzleId, progressToken);
  // Increment, clamp to 6
  const newCount = Math.min(prevCount + 1, 6);

  const idx = idxForDateKey(puzzleId);
  const answerRaw = WORDS[idx];
  const wordNorm = normalizeWord(answerRaw);
  const guessNorm = normalizeWord(String(guess));

  if (guessNorm.length !== wordNorm.length) {
    return NextResponse.json({ error: "Bad guess length" }, { status: 400 });
  }

  const marks = scoreGuess(guessNorm, wordNorm);
  const won = guessNorm === wordNorm;

  const nextToken = makeToken(puzzleId, newCount);

  // Reveal ONLY when the 6th attempt is scored and it's not a win
  const reveal = !won && newCount === 6 ? answerRaw.toUpperCase() : undefined;

  return NextResponse.json({
    marks,
    won,
    length: wordNorm.length,
    progressToken: nextToken,
    answer: reveal, // present only when lost on 6th
  });
}
