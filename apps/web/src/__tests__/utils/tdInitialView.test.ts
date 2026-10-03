import {
  DEFAULT_TD_VIEW_OFFSET_X,
  DEFAULT_TD_VIEW_OFFSET_Y,
  resolveTDInitialView,
  resolveTDBattlefieldHeight,
  resolveTDOpeningPanView,
} from '@/utils/tdInitialView';

describe('TD initial view', () => {
  it.each([
    { width: 1200, height: 600, ratio: 1.6 },
    { width: 360, height: 640, ratio: 1.6 },
    { width: 800, height: 800, ratio: 0.75 },
  ])(
    'contains a fitted arena in a $width by $height viewport',
    ({ width, height, ratio }) => {
      const battlefieldHeight = resolveTDBattlefieldHeight(
        width,
        height,
        ratio,
        1,
        true
      );
      expect(battlefieldHeight).toBeLessThanOrEqual(height);
      expect(battlefieldHeight * ratio).toBeLessThanOrEqual(width);
      expect(
        battlefieldHeight === height || battlefieldHeight * ratio === width
      ).toBe(true);
    }
  );

  it('preserves the height-based sizing of existing scrolling levels', () => {
    expect(resolveTDBattlefieldHeight(360, 640, 1.6, 2, false)).toBe(1280);
  });

  it('preserves the legacy centered-top, maximum-zoom starting view', () => {
    expect(resolveTDInitialView(2, undefined)).toEqual({
      offsetX: DEFAULT_TD_VIEW_OFFSET_X,
      offsetY: DEFAULT_TD_VIEW_OFFSET_Y,
      zoom: 1,
    });
  });

  it('uses a configured starting view', () => {
    expect(
      resolveTDInitialView(2, { offsetX: 25, offsetY: 75, zoom: 0.8 })
    ).toEqual({ offsetX: 25, offsetY: 75, zoom: 0.8 });
  });

  it('clamps offsets and zoom to the valid level range', () => {
    expect(
      resolveTDInitialView(2, { offsetX: -10, offsetY: 120, zoom: 0.2 })
    ).toEqual({ offsetX: 0, offsetY: 100, zoom: 0.5 });
  });

  it('eases an opening camera tour from the configured view to gameplay', () => {
    const gameplayView = { offsetX: 50, offsetY: 0, zoom: 0.9 };
    const openingPan = { fromOffsetY: 100, durationMs: 2000 };

    expect(resolveTDOpeningPanView(gameplayView, openingPan, 0)).toEqual({
      offsetX: 50,
      offsetY: 100,
    });
    expect(resolveTDOpeningPanView(gameplayView, openingPan, 0.5)).toEqual({
      offsetX: 50,
      offsetY: 50,
    });
    expect(resolveTDOpeningPanView(gameplayView, openingPan, 1)).toEqual({
      offsetX: 50,
      offsetY: 0,
    });
  });
});
