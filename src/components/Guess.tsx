import React from "react";
import type { Mark } from "@/types/mark";

const tileBg = (mark: Mark | undefined, isGuessed: boolean) => {
  if (!isGuessed) return "bg-emerald-900/70";
  if (mark === "correct") return "bg-emerald-500";
  if (mark === "present") return "bg-amber-400 text-black";
  return "bg-slate-700";
};

export default function Guess({
  letters,
  marks,
  isGuessed,
  size,
  gap = 8,
  shake = false,
}: {
  isGuessed: boolean;
  letters: string;
  marks: Mark[];
  size: number;
  gap?: number;
  shake?: boolean;
}) {
  const n = marks?.length ?? letters?.length ?? 0;

  return (
    <div
      className={`grid ${shake ? "shake" : ""}`}
      style={{ gridTemplateColumns: `repeat(${n}, ${size}px)`, gap: `${gap}px` }}
    >
      {Array.from({ length: n }).map((_, i) => {
        const letter = letters?.[i]?.toUpperCase() ?? "";
        return (
          <div
            key={i}
            className={[
              "rounded-md border border-white/10",
              "flex items-center justify-center font-extrabold uppercase",
              tileBg(marks[i], isGuessed),
            ].join(" ")}
            style={{
              width: size,
              height: size,
              fontSize: Math.max(16, Math.min(28, Math.floor(size * 0.5))),
            }}
            aria-label={letter}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
