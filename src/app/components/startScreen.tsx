'use client';

import Image from 'next/image';

import FullscreenLauncher from './FullscreenLauncher';
import { trackGameEvent } from '@/utils/analytics';
import styles from './startScreen.module.css';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className={`${styles.screen} animate-fade-in`}>
      <Image
        src="/title/four-at-the-bow.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.artwork}
      />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.heading}>
          <h1 className={styles.title}>COSMOIDS TD</h1>
          <h2 className={styles.subtitle}>The Grand Voyage</h2>
        </div>
        <div className={styles.launcher}>
          <FullscreenLauncher
            onStart={() => {
              void trackGameEvent('game_started');
              onStart();
            }}
          />
        </div>
        <p className={styles.credit}>v1.0.1 • By Samuel Otero</p>
      </div>
    </main>
  );
}
