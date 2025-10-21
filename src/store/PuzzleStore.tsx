import { makeAutoObservable } from "mobx";
import type { Mark } from "@/types/mark";

// Utility: normalize diacritics (client-side for keyboard state only)
function normalizeWord(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

class PuzzleStore {
  puzzleId = "";
  guesses: string[] = [];
  rowMarks: Mark[][] = [];
  lettersState: Record<string, Mark | undefined> = {};
  currentGuess = 0;
  reveal = false;
  bannerText: string | null = null;
  shakeRow = -1;
  private _targetLen = 0;
  private _progressToken: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get targetLength() {
    return this._targetLen || 0;
  }
  get won() {
    return (
      this.currentGuess > 0 &&
      this.rowMarks[this.currentGuess - 1]?.every((m) => m === "correct")
    );
  }
  get lost() {
    return this.currentGuess >= 6 && !this.won;
  }

  async init() {
    // reset UI
    this.bannerText = null;
    this.shakeRow = -1;
    this.guesses = Array(6).fill("");
    this.rowMarks = [];
    this.lettersState = {};
    this.currentGuess = 0;
    this.reveal = false;
    this._progressToken = null;

    // fetch today’s puzzle metadata
    const res = await fetch("/api/puzzle", { cache: "no-store" });
    if (!res.ok) {
      this.bannerText = "Failed to load puzzle";
      return;
    }
    const data = (await res.json()) as { puzzleId: string; length: number };
    this.puzzleId = data.puzzleId;
    this._targetLen = data.length;

    // init marks grid
    this.rowMarks = Array.from({ length: 6 }, () =>
      Array(this._targetLen).fill("absent")
    ) as Mark[][];
  }

  private toast(msg: string) {
    this.bannerText = msg;
    setTimeout(() => {
      if (this.bannerText === msg) this.bannerText = null;
    }, 1200);
  }
  private shake() {
    this.shakeRow = this.currentGuess;
    setTimeout(() => {
      if (this.shakeRow === this.currentGuess) this.shakeRow = -1;
    }, 500);
  }

  press(k: string) {
    if (this.won || this.lost) return;
    if (k === "Enter") return void this.submitGuess();
    if (k === "Backspace") return this.backspace();
    if (/^[A-Za-zÀ-ž]$/.test(k)) return this.typeLetter(k.toLowerCase());
  }

  handleKeyup = (e: KeyboardEvent) => {
    this.press(e.key);
  };

  private typeLetter(ch: string) {
    const row = this.guesses[this.currentGuess] ?? "";
    if (row.length < this.targetLength) {
      this.guesses[this.currentGuess] = row + ch;
    }
  }

  private backspace() {
    const row = this.guesses[this.currentGuess] ?? "";
    this.guesses[this.currentGuess] = row.slice(0, Math.max(0, row.length - 1));
  }

  async submitGuess() {
    const guessRaw = (this.guesses[this.currentGuess] ?? "").trim();

    if (guessRaw.length < this.targetLength) {
      this.toast("Not enough letters");
      this.shake();
      return;
    }

    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guess: guessRaw,
        puzzleId: this.puzzleId,
        progressToken: this._progressToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      this.toast(data?.error ?? "Error");
      this.shake();
      return;
    }

    // save next server-issued token
    this._progressToken = data.progressToken ?? null;

    const marks = data.marks as Mark[];
    this.rowMarks[this.currentGuess] = marks;

    // Update keyboard state (use normalized)
    const rank: Record<Mark, number> = { correct: 3, present: 2, absent: 1 };
    const guessNorm = normalizeWord(guessRaw);
    for (let i = 0; i < this.targetLength; i++) {
      const ch = guessNorm[i];
      const prev = this.lettersState[ch];
      if (!prev || rank[marks[i]] > rank[prev]) {
        this.lettersState[ch] = marks[i];
      }
    }

    this.currentGuess += 1;

    if (data.won) {
      this.bannerText = "GOAL! 🎉";
    } else if (this.currentGuess >= 6) {
      this.reveal = true;
      if (data.answer) {
        // Server sends the correct name (UPPERCASE) only on a 6-try loss
        this.bannerText = `FULL TIME — ${data.answer}`;
      } else {
        // Fallback (shouldn’t happen if server logic is followed)
        this.bannerText = "FULL TIME";
      }
    }
  }
}

export const store = new PuzzleStore();
export type { Mark };
