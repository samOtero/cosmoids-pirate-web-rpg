'use client';

import FullscreenLauncher from './FullscreenLauncher';
import { trackGameEvent } from '@/utils/analytics';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-6 p-4 lg:gap-8">
      <div className="text-center">
        <h1 className="bg-linear-to-b from-cyan-300 to-blue-600 bg-clip-text text-6xl font-black tracking-widest text-transparent drop-shadow-lg lg:text-8xl">
          COSMOIDS TD
        </h1>
        <h2 className="mt-1 text-4xl font-black tracking-widest text-wood-light uppercase lg:text-6xl">
          The Grand Voyage
        </h2>
      </div>
      <FullscreenLauncher
        onStart={() => {
          void trackGameEvent('game_started');
          onStart();
        }}
      />
      <p className="text-sm text-cyan-800">v1.0.1 • By Samuel Otero</p>
    </div>
  );
}
