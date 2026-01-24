"use client";

import React, { useEffect, useState, lazy, Suspense } from "react";

const DialogEditor = lazy(() => import("./DialogEditor"));

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <Suspense fallback={<div className="fixed bottom-4 right-4 bg-black text-white px-3 py-1 rounded text-xs">Loading Editor...</div>}>
      <DialogEditor onClose={() => setIsOpen(false)} />
    </Suspense>
  );
}
