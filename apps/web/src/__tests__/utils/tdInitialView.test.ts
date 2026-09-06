import {
  DEFAULT_TD_VIEW_OFFSET_X,
  DEFAULT_TD_VIEW_OFFSET_Y,
  resolveTDInitialView,
  resolveTDOpeningPanView,
} from '@/utils/tdInitialView';

describe('TD initial view', () => {
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
