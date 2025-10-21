import { NextResponse } from "next/server";
import { WORDS } from "@/server/words";
import crypto from "crypto";

/**
 * We base the daily index on the UTC date, HMAC’d with a secret,
 * so clients cannot predict future days without the secret.
 */
const START_UTC = Date.UTC(2025, 0, 1); // Jan 1, 2025 UTC
const SEED = process.env.WORDS_SEED ?? "dev-seed-only-change-in-prod";

function todayUTCKey() {
  // e.g. "2025-08-18"
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

export async function GET() {
  const puzzleId = todayUTCKey();
  const idx = idxForDateKey(puzzleId);
  const answer = WORDS[idx];
  return NextResponse.json(
    {
      puzzleId,      // "YYYY-MM-DD"
      length: answer.length,
    },
    {
      headers: {
        // cache a bit (tweak for your infra), CDN can revalidate frequently
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}
