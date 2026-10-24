import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { PixiBattlefieldRef } from '../tower-defense/PixiBattlefield';
import { getTDDragAimPoint } from '@/utils/tdDragPointer';

interface TowerDrag {
  id: string;
  name: string;
  imageUrl: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  pointerId: number;
  pointerType: string;
}

/** Uses the Story battlefield's pointer threshold, touch aim and drop protocol. */
export function useRunTowerDrag() {
  const pixiRef = useRef<PixiBattlefieldRef>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const justDraggedRef = useRef(false);
  const pendingRef = useRef<TowerDrag | null>(null);
  const activeRef = useRef<TowerDrag | null>(null);
  const [preview, setPreview] = useState<TowerDrag | null>(null);

  function cancel() {
    pendingRef.current = null;
    activeRef.current = null;
    draggingRef.current = false;
    pixiRef.current?.handleExternalLeave();
    setPreview(null);
  }

  useEffect(() => {
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);

  function begin(
    event: PointerEvent<HTMLButtonElement>,
    creature: { id: string; name: string; imageUrl: string }
  ) {
    if (event.button !== 0 || pendingRef.current || draggingRef.current) return;
    justDraggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    pendingRef.current = {
      ...creature,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX:
        event.pointerType === 'touch'
          ? rect.width / 2
          : event.clientX - rect.left,
      offsetY:
        event.pointerType === 'touch'
          ? rect.height / 2
          : event.clientY - rect.top,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = activeRef.current ?? pendingRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (
      !activeRef.current &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 10
    )
      return;
    const next = { ...drag, x: event.clientX, y: event.clientY };
    pendingRef.current = null;
    activeRef.current = next;
    draggingRef.current = true;
    setPreview(next);
    pixiRef.current?.handleExternalMove(
      next.x,
      next.y,
      'tower',
      next.id,
      next.pointerType
    );
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    const drag = activeRef.current ?? pendingRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (activeRef.current) {
      pixiRef.current?.handleExternalDrop(
        event.clientX,
        event.clientY,
        drag.id,
        false,
        drag.pointerType
      );
      justDraggedRef.current = true;
    }
    pendingRef.current = null;
    activeRef.current = null;
    draggingRef.current = false;
    setPreview(null);
    const target = event.target;
    if (target instanceof Element && target.hasPointerCapture(event.pointerId))
      target.releasePointerCapture(event.pointerId);
  }

  function cancelPointer(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerId === (activeRef.current ?? pendingRef.current)?.pointerId
    )
      cancel();
  }

  return {
    pixiRef,
    surfaceRef,
    draggingRef,
    preview,
    aim: preview ? getTDDragAimPoint(preview, preview.pointerType) : null,
    begin,
    setDragging(value: boolean) {
      draggingRef.current = value;
    },
    consumeClick() {
      const dragged = justDraggedRef.current;
      justDraggedRef.current = false;
      return dragged;
    },
    surfaceEvents: {
      onPointerMove: move,
      onPointerUp: finish,
      onPointerCancel: cancelPointer,
      onLostPointerCapture: cancelPointer,
    },
  };
}
