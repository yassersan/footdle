"use client";

import { observer } from "mobx-react-lite";
import Guess from "@/components/Guess";
import Querty from "@/components/Querty";
import { store } from "@/store/PuzzleStore";
import { useEffect, useLayoutEffect, useState } from "react";

/** Centered banner */
const Banner = ({ text }: { text: string }) => (
  <div
    className="
      fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
      z-50 px-6 py-4 rounded-2xl text-xl font-bold tracking-wide
      bg-emerald-900/90 text-white border-2 border-emerald-400
      shadow-lg backdrop-blur-md animate-fadeIn
    "
    role="status"
    aria-live="polite"
  >
    {text}
  </div>
);

/** Tile size calculation */
function useTileSize(cols: number) {
  const [size, setSize] = useState(48);
  useLayoutEffect(() => {
    const calc = () => {
      const vw = window.innerWidth,
        vh = window.innerHeight;
      const isMobile = vw < 640; // Tailwind sm breakpoint
      const sidePadding = 49,
        tileGap = 10,
        rows = 6;

      const headerH = isMobile ? 120 : 84;
      const controlsH = isMobile ? 48 : 40;
      const keyboardH = isMobile ? 190 : 170;
      const verticalPadding = 24;

      const sizeW = Math.floor(
        (vw - sidePadding * 2 - tileGap * (cols - 1)) / Math.max(cols, 1)
      );
      const sizeH = Math.floor(
        (vh -
          (headerH + controlsH + keyboardH + verticalPadding * 2) -
          tileGap * (rows - 1)) /
          rows
      );

      setSize(Math.max(30, Math.min(72, Math.min(sizeW, sizeH))));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [cols]);
  return size;
}

export default observer(function Home() {
  useEffect(() => {
    store.init();
    window.addEventListener("keyup", store.handleKeyup);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keyup", store.handleKeyup);
      document.documentElement.style.overflow = prev;
    };
  }, []);

  const guesses = store.guesses ?? [];
  const rowMarks = store.rowMarks ?? [];
  const cols = Math.max(store.targetLength, 1);
  const tileSize = useTileSize(cols);

  return (
    <div className="min-h-screen w-full text-white overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-700">
      {/* Header */}
      <div className="px-4 pt-3 md:pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-3">
          <div className="hidden md:block text-2xl opacity-80">⚽ Footdle</div>
          <h1 className="text-center text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide">
            Guess the Footballer
          </h1>
          <div className="text-center md:text-right text-sm sm:text-base opacity-80">
            Attempts {store.currentGuess}/6
          </div>
        </div>
        <div className="md:hidden mt-1 text-center text-base opacity-80">
          ⚽ Footdle
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 flex flex-col items-center">
        <div className="mt-2 md:mt-3 mb-2 flex flex-col gap-2">
          {guesses.map((_, i) => (
            <Guess
              key={i}
              letters={guesses[i]}
              marks={rowMarks[i]}
              isGuessed={i < store.currentGuess}
              size={tileSize}
              gap={8}
              shake={store.shakeRow === i}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 text-sm mb-2">
          <button
            className="px-3 py-1.5 rounded bg-emerald-900/70 hover:bg-emerald-900 border border-white/10 mt-5 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            onClick={() => store.init()}
          >
            New Match
          </button>
        </div>
      </div>

      {/* Keyboard */}
      <div className="fixed left-0 right-0 bottom-0 pb-[env(safe-area-inset-bottom)] bg-emerald-950/60 backdrop-blur-sm">
        <Querty
          lettersState={store.lettersState}
          onKey={(k) => store.press(k)}
          keyHeight={Math.max(40, Math.min(56, Math.floor(tileSize * 0.9)))}
          keyMinWidth={Math.max(30, Math.min(46, Math.floor(tileSize * 0.7)))}
          gap={8}
        />
      </div>

      {store.bannerText && <Banner text={store.bannerText} />}
    </div>
  );
});
