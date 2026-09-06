import {
  clampTDLevelEditorScroll,
  getTDLevelEditorScrollLimits,
} from '@/utils/tdLevelEditorViewport';

describe('TD level editor viewport', () => {
  it('allows panning beyond every map edge', () => {
    expect(getTDLevelEditorScrollLimits(1200, 900, 1000, 600)).toEqual({
      minX: -90,
      maxX: 290,
      minY: -90,
      maxY: 390,
    });
  });

  it('still provides overscroll when the map fits within the viewport', () => {
    expect(getTDLevelEditorScrollLimits(800, 500, 1000, 600)).toEqual({
      minX: -90,
      maxX: 90,
      minY: -90,
      maxY: 90,
    });
  });

  it('clamps scrolling to the extended editor limits', () => {
    expect(clampTDLevelEditorScroll(-120, -90, 290)).toBe(-90);
    expect(clampTDLevelEditorScroll(400, -90, 290)).toBe(290);
    expect(clampTDLevelEditorScroll(100, -90, 290)).toBe(100);
  });
});
