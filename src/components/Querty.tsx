import React from "react";
import type { Mark } from "@/types/mark";

const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const keyBg: Record<Mark, string> = {
  correct: "bg-emerald-500",
  present: "bg-amber-400 text-black",
  absent: "bg-slate-700",
};

export default function Querty({
  onKey,
  lettersState,
  keyHeight = 48,
  keyMinWidth = 36,
  gap = 8,
}: {
  onKey: (k: string) => void;
  lettersState: Record<string, Mark | undefined>;
  keyHeight?: number;
  keyMinWidth?: number;
  gap?: number;
}) {
  return (
    <div className="select-none px-2 pt-2 pb-3">
      {rows.map((r, ri) => (
        <div key={ri} className="flex justify-center mb-2" style={{ gap: `${gap}px` }}>
          {ri === 2 && (
            <Key
              label="⚽ Enter"
              onClick={() => onKey("Enter")}
              keyHeight={keyHeight}
              keyMinWidth={Math.max(keyMinWidth * 1.6, 56)}
              customBg="bg-emerald-700"
            />
          )}
          {r.split("").map((ch) => (
            <Key
              key={ch}
              label={ch}
              onClick={() => onKey(ch)}
              mark={lettersState[ch]}
              keyHeight={keyHeight}
              keyMinWidth={keyMinWidth}
            />
          ))}
          {ri === 2 && (
            <Key
              label="⌫"
              onClick={() => onKey("Backspace")}
              keyHeight={keyHeight}
              keyMinWidth={Math.max(keyMinWidth * 1.6, 56)}
              customBg="bg-rose-600"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Key({
  label,
  onClick,
  mark,
  keyHeight,
  keyMinWidth,
  customBg,
}: {
  label: string;
  onClick: () => void;
  mark?: Mark;
  keyHeight: number;
  keyMinWidth: number;
  customBg?: string;
}) {
  const color = customBg ?? (mark ? keyBg[mark] : "bg-emerald-900/70");
  return (
    <button
      className={[
        "rounded-md text-white uppercase font-semibold",
        "flex items-center justify-center border border-white/10",
        "hover:brightness-110 active:brightness-95",
        color,
      ].join(" ")}
      onClick={onClick}
      style={{
        height: keyHeight,
        minWidth: keyMinWidth,
        padding: "0 10px",
        fontSize: Math.max(12, Math.min(16, Math.floor(keyHeight * 0.35))),
      }}
      aria-label={label}
      title={label}
    >
      {label}
    </button>
  );
}
