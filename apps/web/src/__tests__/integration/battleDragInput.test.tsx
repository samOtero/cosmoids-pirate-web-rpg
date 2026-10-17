import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { battleSpecies } from '../engine/behaviorFixtures';
import { makePlayerCreature, testDefinitionId } from '../utils/dataBuilders';

const harness = vi.hoisted(() => ({
  engine: null as TowerDefenseEngine | null,
  move: vi.fn(),
  drop: vi.fn(),
  leave: vi.fn(),
}));
vi.mock('@/app/components/tower-defense/PixiBattlefield', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: { engine: TowerDefenseEngine }, ref) => {
      harness.engine = props.engine;
      React.useImperativeHandle(ref, () => ({
        handleExternalMove: harness.move,
        handleExternalDrop: harness.drop,
        handleExternalLeave: harness.leave,
      }));
      return <div data-testid="battlefield" />;
    }),
  };
});

const speciesId = testDefinitionId('drag-input-species');
const captureMethods = [
  'setPointerCapture',
  'hasPointerCapture',
  'releasePointerCapture',
];
const captureDescriptors = new Map(
  captureMethods.map((key) => [
    key,
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, key),
  ])
);
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
  );
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 20,
    y: 300,
    left: 20,
    top: 300,
    right: 84,
    bottom: 364,
    width: 64,
    height: 64,
    toJSON: () => ({}),
  });
  vi.clearAllMocks();
  battleSpecies(speciesId, { name: 'Drag test creature' });
});
afterEach(() => {
  harness.engine?.destroy();
  harness.engine = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const key of captureMethods) {
    const descriptor = captureDescriptors.get(key);
    if (descriptor)
      Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, key);
  }
});

function start() {
  render(
    <TowerDefenseScreen
      onClose={vi.fn()}
      levelData={{
        paths: [
          [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
        ],
        placementSpots: [{ x: 50, y: 50 }],
        waveEnemyDefinitions: [],
        waves: [{ id: 'controlled-empty-wave', groups: [] }],
        premadeRoster: [
          makePlayerCreature({
            id: 'drag-instance',
            speciesId,
            equippedAttacks: [],
          }),
        ],
      }}
    />
  );
  act(() => vi.advanceTimersByTime(2500));
}

describe('roster and capture drag input', () => {
  it.each([
    ['tower', 'touch'],
    ['capture', 'touch'],
    ['tower', 'mouse'],
    ['capture', 'mouse'],
  ] as const)(
    'keeps the %s preview and forwarded %s pointer in agreement',
    (type, pointerType) => {
      start();
      const button = screen.getByRole('button', {
        name: type === 'tower' ? /Drag test creature/ : 'Drag capture ball',
      });
      const pointer = {
        pointerType,
        pointerId: 7,
        clientX: 50,
        clientY: 330,
        button: 0,
      };
      fireEvent.pointerDown(button, pointer);
      fireEvent.pointerMove(button, { ...pointer, clientY: 325 });
      expect(harness.move).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('battle-drag-preview')
      ).not.toBeInTheDocument();
      fireEvent.pointerMove(button, { ...pointer, clientX: 200, clientY: 230 });
      const preview = screen.getByTestId('battle-drag-preview');
      const centerY = Number.parseFloat(preview.style.top) + 32;
      if (pointerType === 'touch') expect(centerY).toBeLessThan(230 - 40);
      else expect(preview.style.top).toBe('200px');
      expect(harness.move).toHaveBeenLastCalledWith(
        200,
        230,
        type,
        type === 'tower' ? 'drag-instance' : undefined,
        pointerType
      );
      fireEvent.pointerUp(button, { ...pointer, clientX: 200, clientY: 230 });
      expect(harness.drop).toHaveBeenCalledWith(
        200,
        230,
        type === 'tower' ? 'drag-instance' : null,
        type === 'capture',
        pointerType
      );
      expect(
        screen.queryByTestId('battle-drag-preview')
      ).not.toBeInTheDocument();
    }
  );

  it.each(['pointerCancel', 'lostPointerCapture', 'blur'] as const)(
    'clears the preview without dropping on %s',
    (event) => {
      start();
      const button = screen.getByRole('button', { name: /Drag test creature/ });
      const pointer = {
        pointerId: 7,
        pointerType: 'touch',
        clientX: 50,
        clientY: 330,
        button: 0,
      };
      fireEvent.pointerDown(button, pointer);
      fireEvent.pointerMove(button, { ...pointer, clientX: 200, clientY: 230 });
      if (event === 'blur') fireEvent(window, new Event('blur'));
      else if (event === 'lostPointerCapture')
        fireEvent(
          button,
          new PointerEvent('lostpointercapture', { ...pointer, bubbles: true })
        );
      else fireEvent.pointerCancel(button, pointer);
      expect(harness.leave).toHaveBeenCalledOnce();
      expect(harness.drop).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('battle-drag-preview')
      ).not.toBeInTheDocument();
    }
  );

  it('ignores a second pointer instead of moving or dropping the first finger’s tower', () => {
    start();
    const button = screen.getByRole('button', { name: /Drag test creature/ });
    const pointer = {
      pointerId: 7,
      pointerType: 'touch',
      clientX: 50,
      clientY: 330,
      button: 0,
    };
    fireEvent.pointerDown(button, pointer);
    fireEvent.pointerMove(button, { ...pointer, clientX: 200, clientY: 230 });
    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Drag capture ball' }),
      { ...pointer, pointerId: 9 }
    );
    fireEvent.pointerMove(button, { ...pointer, pointerId: 9, clientX: 500 });
    fireEvent.pointerUp(button, { ...pointer, pointerId: 9 });
    expect(harness.move).toHaveBeenCalledOnce();
    expect(harness.drop).not.toHaveBeenCalled();
    expect(screen.getByTestId('battle-drag-preview')).toBeInTheDocument();
    fireEvent.pointerUp(button, { ...pointer, clientX: 200, clientY: 230 });
    expect(harness.drop).toHaveBeenCalledOnce();
  });
});
