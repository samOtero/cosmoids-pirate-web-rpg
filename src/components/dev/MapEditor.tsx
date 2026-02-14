'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ISLANDS, BACKGROUND_IMAGES } from '@/constants/game';
import { Island, IslandNode } from '@/types/baseGame';

// --- Components ---

function IslandList({
  islands,
  selectedIslandId,
  onSelect,
}: {
  islands: Island[];
  selectedIslandId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1">
      {islands.map((island) => (
        <button
          key={island.id}
          onClick={() => onSelect(island.id)}
          className={`text-left px-3 py-2 rounded text-xs font-mono mb-1 ${
            selectedIslandId === island.id
              ? 'bg-cyan-900 text-cyan-100'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {island.name}
        </button>
      ))}
    </div>
  );
}

// --- Main Editor ---

export default function MapEditor({ onClose }: { onClose: () => void }) {
  // Local State for editing
  const [islands, setIslands] = useState<Island[]>(
    JSON.parse(JSON.stringify(ISLANDS))
  );
  const [selectedIslandId, setSelectedIslandId] = useState<number | null>(
    islands.length > 0 ? islands[0].id : null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Derived
  const activeIsland =
    selectedIslandId !== null
      ? islands.find((i) => i.id === selectedIslandId)
      : null;

  const activeNode = activeIsland?.nodes?.find((n) => n.id === selectedNodeId);

  // Handlers
  const handleIslandSelect = (id: number) => {
    setSelectedIslandId(id);
    setSelectedNodeId(null);
  };

  const handleNodeSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedNodeId(id);
  };

  const updateIsland = (updates: Partial<Island>) => {
    if (!activeIsland) return;
    const updatedIslands = islands.map((i) =>
      i.id === activeIsland.id ? { ...i, ...updates } : i
    );
    setIslands(updatedIslands);
    setIsDirty(true);
  };

  const updateNode = (nodeId: number, updates: Partial<IslandNode>) => {
    if (!activeIsland) return;
    const newNodes = activeIsland.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates } : n
    );
    updateIsland({ nodes: newNodes });
  };

  const handleDragStart = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !isDragging ||
      !activeIsland ||
      selectedNodeId === null ||
      !mapRef.current
    )
      return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateNode(selectedNodeId, { coordinates: { x: clampedX, y: clampedY } });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addNode = () => {
    if (!activeIsland) return;
    const newId =
      activeIsland.nodes.length > 0
        ? Math.max(...activeIsland.nodes.map((n) => n.id)) + 1
        : 0;
    const newNode: IslandNode = {
      id: newId,
      name: `Node ${newId}`,
      description: 'New Node Description',
      coordinates: { x: 50, y: 50 },
      events: [],
    };
    updateIsland({ nodes: [...activeIsland.nodes, newNode] });
    setSelectedNodeId(newId);
  };

  const removeNode = () => {
    if (!activeIsland || selectedNodeId === null) return;
    if (!confirm('Are you sure you want to delete this node?')) return;

    const newNodes = activeIsland.nodes.filter((n) => n.id !== selectedNodeId);
    updateIsland({ nodes: newNodes });
    setSelectedNodeId(null);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/map/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ islands }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setIsDirty(false);
      alert('Saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Error saving: ' + (e as Error).message);
    }
  };

  const handleCopyJson = () => {
    if (!activeIsland) return;
    // create a clean copy without react internal keys if any
    const cleanIsland = { ...activeIsland };
    navigator.clipboard.writeText(JSON.stringify(cleanIsland, null, 2));
    alert('Island JSON copied to clipboard!');
  };

  // Global mouse up to stop dragging even if mouse leaves the node
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur text-white font-sans">
      <div className="w-full h-full flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h2 className="font-bold text-sm text-slate-300">Map Editor</h2>
            <button onClick={onClose} className="px-2 text-slate-500">
              ✕
            </button>
          </div>
          <div className="p-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Islands
            </label>
          </div>
          <IslandList
            islands={islands}
            selectedIslandId={selectedIslandId}
            onSelect={handleIslandSelect}
          />
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Toolbar / Header */}
          <div className="h-12 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-950">
            <div className="text-sm font-bold text-slate-300">
              {activeIsland ? activeIsland.name : 'Select an Island'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`text-xs px-3 py-1 rounded font-bold ${
                  isDirty
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-slate-800 text-slate-500'
                }`}
                disabled={!isDirty}
              >
                {isDirty ? 'Save' : 'Saved'}
              </button>
              <button
                onClick={handleCopyJson}
                className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1 rounded"
              >
                Copy JSON
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* MAP PREVIEW */}
            <div
              className="flex-1 relative bg-black overflow-hidden select-none"
              ref={mapRef}
              onMouseMove={handleMouseMove}
              onClick={() => setSelectedNodeId(null)} // Deselect node on map click
            >
              {activeIsland && (
                <>
                  {/* Background Key Check */}
                  {activeIsland.backgroundImageKey &&
                  BACKGROUND_IMAGES[activeIsland.backgroundImageKey] ? (
                    <div
                      className="absolute inset-0 z-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${BACKGROUND_IMAGES[activeIsland.backgroundImageKey]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.5, // Dimmed for editing
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                      No Background Image
                    </div>
                  )}

                  {/* Grid Overlay */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {activeIsland.nodes?.map((node, idx) => {
                      if (idx === 0) return null;
                      const prev = activeIsland.nodes[idx - 1];
                      return (
                        <line
                          key={`path-${node.id}`}
                          x1={`${prev.coordinates.x}%`}
                          y1={`${prev.coordinates.y}%`}
                          x2={`${node.coordinates.x}%`}
                          y2={`${node.coordinates.y}%`}
                          stroke={'#f4e4bc'}
                          strokeWidth="2"
                          strokeDasharray={'5,5'}
                          opacity={0.6}
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {activeIsland.nodes?.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 
                                        ${selectedNodeId === node.id ? 'bg-cyan-600 border-white scale-125 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-700 border-slate-500 hover:bg-slate-600'}
                                    `}
                      style={{
                        left: `${node.coordinates.x}%`,
                        top: `${node.coordinates.y}%`,
                      }}
                      onMouseDown={(e) => handleDragStart(e, node.id)}
                      // onClick handled by mousedown mostly, but for selection without drag:
                      onClick={(e) => handleNodeSelect(e, node.id)}
                    >
                      <span className="text-[10px] pointer-events-none select-none text-white font-bold">
                        {node.id}
                      </span>
                      {/* Tooltip on hover */}
                      <div className="absolute top-full mt-1 bg-black/80 px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.name}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* PROPERTIES PANEL */}
            <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 flex flex-col overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">
                Properties
              </h3>

              {activeNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      ID
                    </label>
                    <div className="text-xs text-slate-300 font-mono">
                      {activeNode.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      Name
                    </label>
                    <input
                      value={activeNode.name}
                      onChange={(e) =>
                        updateNode(activeNode.id, { name: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      Description
                    </label>
                    <textarea
                      value={activeNode.description}
                      onChange={(e) =>
                        updateNode(activeNode.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-xs text-white h-20 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">
                        X (%)
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeNode.coordinates.x)}
                        onChange={(e) =>
                          updateNode(activeNode.id, {
                            coordinates: {
                              ...activeNode.coordinates,
                              x: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">
                        Y (%)
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeNode.coordinates.y)}
                        onChange={(e) =>
                          updateNode(activeNode.id, {
                            coordinates: {
                              ...activeNode.coordinates,
                              y: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <button
                      onClick={removeNode}
                      className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded px-3 py-2 text-xs"
                    >
                      Delete Node
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs italic mt-10">
                  {activeIsland ? (
                    <>
                      <p className="mb-4">Select a node to edit</p>
                      <button
                        onClick={addNode}
                        className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded text-xs"
                      >
                        + Add Node
                      </button>
                    </>
                  ) : (
                    <p>Select an island first</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
