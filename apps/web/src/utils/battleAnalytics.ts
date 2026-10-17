import type { SpeciesId } from '@/types/definitionIds';
import { analyticsEnabled, trackGameEvent } from './analytics';

export function createBattleAnalytics(
  levelId: string,
  mode: string,
  team: string[]
) {
  let attemptId: string | undefined;
  let finished = false;
  const deployed = new Set<SpeciesId>();
  return {
    start() {
      if (attemptId || !analyticsEnabled() || levelId === 'unknown') return;
      attemptId = crypto.randomUUID();
      void trackGameEvent('level_started', {
        level_id: levelId,
        mode,
        attempt_id: attemptId,
        team,
      });
    },
    deploy(speciesId: SpeciesId) {
      deployed.add(speciesId);
    },
    finish(
      outcome: 'win' | 'loss' | 'quit',
      elapsedMs: number,
      waveIndex: number,
      lives: number
    ) {
      if (!attemptId || finished) return;
      finished = true;
      void trackGameEvent('level_finished', {
        level_id: levelId,
        mode,
        attempt_id: attemptId,
        outcome,
        simulation_duration_seconds: Math.round(elapsedMs / 1000),
        wave_index: waveIndex,
        lives_remaining: lives,
        deployed_species: [...deployed],
      });
    },
    capture(speciesId: SpeciesId, level: number, success: boolean) {
      if (!attemptId || finished) return;
      void trackGameEvent('capture_result', {
        level_id: levelId,
        mode,
        attempt_id: attemptId,
        species_id: speciesId,
        creature_level: level,
        success,
      });
    },
  };
}
