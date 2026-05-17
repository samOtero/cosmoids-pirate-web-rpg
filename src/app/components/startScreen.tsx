'use client';

import { Button } from './ui/Button';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 lg:gap-8 animate-fade-in p-4">
      <div className="text-center">
        <h1 className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-300 to-blue-600 drop-shadow-lg tracking-widest">
          COSMOIDS TD
        </h1>
        <h2 className="text-4xl lg:text-6xl font-black text-wood-light tracking-widest mt-1 uppercase">
          The Grand Voyage
        </h2>
      </div>
      <div>
        <Button
          variant="wood"
          onClick={onStart}
          className="text-xl px-12 py-4 mt-8"
        >
          Press Start
        </Button>
      </div>
      <p className="text-sm text-cyan-800">v1.0.0 • React • Gemini AI</p>
    </div>
  );
}
