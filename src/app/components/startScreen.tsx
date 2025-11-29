"use client";

import { Button } from "./ui/Button";

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-300 to-blue-600 drop-shadow-lg tracking-widest">
          OCEANIC
        </h1>
        <h2 className="text-4xl md:text-6xl font-black text-wood-light tracking-widest mt-2 uppercase">
          Odyssey
        </h2>
      </div>
      <div className="mt-12">
        <Button variant="wood" onClick={onStart} className="text-xl px-12 py-4">
          Press Start
        </Button>
      </div>
      <p className="absolute bottom-4 text-sm text-cyan-800">
        v1.0.0 • React • Gemini AI
      </p>
    </div>
  );
}
