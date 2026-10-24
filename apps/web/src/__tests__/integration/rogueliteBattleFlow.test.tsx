import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useImperativeHandle, type Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RogueliteScreen from '@/app/components/roguelite/RogueliteScreen';
import type { RogueliteBattleEngine } from '@/engine/roguelite/RogueliteRun';
import type { PixiBattlefieldRef } from '@/app/components/tower-defense/PixiBattlefield';
import { RUN_ATTACK_DEFS } from '@/engine/roguelite/attacks/definitions';
import { RUN_WAVES } from '@/constants/roguelite';

const harness = vi.hoisted(() => ({
  engine: null as RogueliteBattleEngine | null,
  move: vi.fn(),
  drop: vi.fn(),
  dragging: null as ((value: boolean) => void) | null,
}));
vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: function MockBattlefield({
    engine,
    ref,
    onMapDrop,
    onDragStateChange,
  }: {
    engine: RogueliteBattleEngine;
    ref: Ref<PixiBattlefieldRef>;
    onMapDrop: (id: string, x: number, y: number) => void;
    onDragStateChange: (value: boolean) => void;
  }) {
    harness.engine = engine;
    harness.dragging = onDragStateChange;
    useImperativeHandle(ref, () => ({
      handleExternalMove: harness.move,
      handleExternalLeave: vi.fn(),
      handleExternalDrop: (x, y, id) => {
        harness.drop(x, y, id);
        if (id) onMapDrop(id, x, y);
      },
    }));
    return <div data-testid="battlefield" />;
  },
}));
vi.mock('@/engine/roguelite/attacks/definitions', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/engine/roguelite/attacks/definitions')
    >();
  return {
    ...actual,
    drawStartingMoves: () =>
      Object.values(actual.RUN_ATTACK_DEFS)
        .slice(0, 2)
        .map((move) => move.id),
  };
});

const frames = new Map<number, FrameRequestCallback>();
let serial = 0;
const patched = [
  [HTMLDialogElement.prototype, 'showModal'],
  [HTMLDialogElement.prototype, 'close'],
  [HTMLElement.prototype, 'setPointerCapture'],
  [HTMLElement.prototype, 'hasPointerCapture'],
  [HTMLElement.prototype, 'releasePointerCapture'],
] as const;
const descriptors = patched.map(([prototype, name]) =>
  Object.getOwnPropertyDescriptor(prototype, name)
);
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
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
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
});
afterEach(() => {
  cleanup();
  frames.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  patched.forEach(([prototype, name], index) => {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(prototype, name, descriptor);
    else Reflect.deleteProperty(prototype, name);
  });
});
function frame(time: number) {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(time));
  });
}
function enter() {
  render(<RogueliteScreen onBack={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Choose Fueguana/ }));
  fireEvent.click(
    screen.getByText(`Start with ${Object.values(RUN_ATTACK_DEFS)[0].name} →`)
  );
  return harness.engine!;
}
function countIn() {
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText('GO!')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
}

describe('roguelite Story-style battle controls', () => {
  it('counts in once, pauses for rewards and launches the next wave after choosing', () => {
    const engine = enter();
    expect(screen.getByText('Ready!')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start wave/i })
    ).not.toBeInTheDocument();
    expect(engine.elapsedTimeMs).toBe(0);
    countIn();
    const tick = vi.spyOn(engine, 'tick').mockImplementation(() => {});
    frame(100);
    frame(200);
    expect(tick).toHaveBeenCalledOnce();
    engine.hasFinishedAllWaves = true;
    frame(300);
    expect(
      screen.getByRole('heading', { name: 'Choose your next advantage' })
    ).toBeInTheDocument();
    const calls = tick.mock.calls.length;
    frame(400);
    expect(tick).toHaveBeenCalledTimes(calls);
    fireEvent.click(screen.getAllByRole('button', { name: /NEW PARTNER/i })[0]);
    expect(screen.getByText(`Wave 2/${RUN_WAVES}`)).toBeInTheDocument();
    expect(screen.queryByText('Ready!')).not.toBeInTheDocument();
    const next = vi.spyOn(harness.engine!, 'tick').mockImplementation(() => {});
    frame(500);
    frame(600);
    expect(next).toHaveBeenCalledOnce();
  });

  it('opens the shared move menu and preserves manual pause when closing it', () => {
    const engine = enter();
    countIn();
    const tick = vi.spyOn(engine, 'tick').mockImplementation(() => {});
    frame(100);
    frame(200);
    const towerButton = screen.getByRole('button', { name: /Fueguana.*Lv\./i });
    fireEvent.click(towerButton);
    expect(
      screen.getByRole('dialog', { name: 'Moves · Fueguana' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `Select ${Object.values(RUN_ATTACK_DEFS)[0].name}`,
      })
    ).toBeInTheDocument();
    frame(300);
    expect(tick).toHaveBeenCalledOnce();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Close',
      })
    );
    frame(400);
    frame(500);
    expect(tick).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(towerButton);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Close',
      })
    );
    frame(600);
    frame(700);
    expect(tick).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    frame(800);
    frame(900);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('pauses simulation for in-map dragging and resumes afterward', () => {
    const engine = enter();
    countIn();
    const tick = vi.spyOn(engine, 'tick').mockImplementation(() => {});
    frame(100);
    act(() => harness.dragging!(true));
    frame(200);
    expect(tick).not.toHaveBeenCalled();
    act(() => harness.dragging!(false));
    frame(300);
    expect(tick).toHaveBeenCalledOnce();
  });

  it.each(['mouse', 'touch'])(
    'moves a deployed partner from the tower button with %s input',
    (pointerType) => {
      const engine = enter();
      countIn();
      const source = engine.towers[0];
      const spot = engine.placementSpots.find(
        (candidate) => candidate.x !== source.position.x
      )!;
      const tick = vi.spyOn(engine, 'tick').mockImplementation(() => {});
      const button = screen.getByRole('button', { name: /Fueguana.*Lv\./i });
      const pointer = {
        pointerId: 7,
        pointerType,
        button: 0,
        clientX: 5,
        clientY: 5,
      };
      fireEvent.pointerDown(button, pointer);
      fireEvent.pointerMove(button, { ...pointer, clientX: 6, clientY: 6 });
      expect(harness.move).not.toHaveBeenCalled();
      fireEvent.pointerMove(button, {
        ...pointer,
        clientX: spot.x,
        clientY: spot.y,
      });
      expect(screen.getByTestId('battle-drag-preview')).toBeInTheDocument();
      expect(harness.move).toHaveBeenLastCalledWith(
        spot.x,
        spot.y,
        'tower',
        source.creature.id,
        pointerType
      );
      frame(100);
      frame(200);
      expect(tick).not.toHaveBeenCalled();
      fireEvent.pointerUp(button, {
        ...pointer,
        clientX: spot.x,
        clientY: spot.y,
      });
      fireEvent.click(button);
      expect(source.position).toEqual(spot);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      frame(300);
      expect(tick).toHaveBeenCalledOnce();
    }
  );
});
