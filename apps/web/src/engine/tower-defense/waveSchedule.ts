import type { TDWave } from './types';

/** Expand finite repeats at runtime so the authored wave and pool remain editable. */
export function expandWaveRepetitions(waves: TDWave[]): TDWave[] {
  return waves.flatMap((wave) => {
    const count =
      Number.isInteger(wave.repeatCount) && wave.repeatCount! > 0
        ? wave.repeatCount!
        : 1;
    let openingCount = wave.groups.length ? 1 : 0;
    while (
      openingCount < wave.groups.length &&
      wave.groups[openingCount].concurrentWithPrevious
    )
      openingCount++;
    const earliestDelay = Math.min(
      ...wave.groups
        .slice(0, openingCount)
        .map((group) => group.delayBeforeGroupMs)
    );
    return Array.from({ length: count }, (_, index) => {
      if (index === 0) return wave;
      return {
        ...wave,
        id: `${wave.id}_repeat_${index + 1}`,
        groups: wave.groups.map((group, groupIndex) =>
          groupIndex < openingCount && wave.delayBetweenRepeatsMs !== undefined
            ? {
                ...group,
                delayBeforeGroupMs:
                  wave.delayBetweenRepeatsMs +
                  group.delayBeforeGroupMs -
                  earliestDelay,
              }
            : group
        ),
      };
    });
  });
}
