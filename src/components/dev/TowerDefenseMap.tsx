'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
} from '@/constants/creatures';
import { Creature } from '@/types/baseGame';

interface Point {
  x: number;
  y: number;
}

interface Tower {
  id: string;
  creature: Creature;
  position: Point;
  lastAttackTime: number;
}

interface Enemy {
  id: string;
  creature: Creature;
  position: Point;
  hp: number;
  maxHp: number;
  speed: number;
}

interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  position: Point;
  speed: number;
  damage: number;
  target: Point;
}

const PLAYER_CREATURES = [STARTER_CRAB, STARTER_IGUANA, STARTER_MONKEY];
const ENEMY_TYPES = [BUG_STAGE_1, BUG_STAGE_2, BUG_STAGE_3];

export default function TowerDefenseMap({ onClose }: { onClose: () => void }) {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [selectedCreatureIndex, setSelectedCreatureIndex] = useState<
    number | null
  >(null);

  const [wave, setWave] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Mutable state for game loop to avoid React dependency issues
  const stateRef = useRef({
    towers,
    enemies,
    projectiles,
    lastSpawnTime: 0,
    money: 100,
    lives: 20,
  });

  useEffect(() => {
    stateRef.current = { ...stateRef.current, towers, enemies, projectiles };
  }, [towers, enemies, projectiles]);

  const [uiMoney, setUiMoney] = useState(100);
  const [uiLives, setUiLives] = useState(20);

  const gameLoop = (time: number) => {
    if (!isPlaying) return;

    const state = stateRef.current;
    let newEnemies = [...state.enemies];
    let newProjectiles = [...state.projectiles];
    let newTowers = [...state.towers];

    // Spawn enemies
    if (time - state.lastSpawnTime > 2000) {
      const randomEnemy =
        ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
      newEnemies.push({
        id: `enemy_${time}`,
        creature: randomEnemy,
        position: { x: 100, y: 20 + Math.random() * 60 },
        hp: randomEnemy.maxHp,
        maxHp: randomEnemy.maxHp,
        speed: 0.1 + Math.random() * 0.1,
      });
      state.lastSpawnTime = time;
    }

    // Update enemies
    newEnemies.forEach((enemy) => {
      enemy.position.x -= enemy.speed;
    });

    // Enemy reached end
    const reachedEnd = newEnemies.filter((e) => e.position.x <= 0);
    if (reachedEnd.length > 0) {
      state.lives -= reachedEnd.length;
      setUiLives(state.lives);
      if (state.lives <= 0) {
        setIsPlaying(false);
        alert('Game Over!');
      }
    }
    newEnemies = newEnemies.filter((e) => e.position.x > 0);

    // Towers attack
    newTowers.forEach((tower) => {
      if (time - tower.lastAttackTime > 1000) {
        // Attack speed
        let nearestEnemy: Enemy | null = null;
        let minDist = 30; // 30% range

        newEnemies.forEach((enemy) => {
          const dx = enemy.position.x - tower.position.x;
          // Scale Y to match X theoretically depending on aspect ratio, but we'll keep it simple
          const dy = enemy.position.y - tower.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestEnemy = enemy;
          }
        });

        if (nearestEnemy) {
          const enemyTarget = nearestEnemy as Enemy;
          newProjectiles.push({
            id: `proj_${time}_${tower.id}`,
            sourceId: tower.id,
            targetId: enemyTarget.id,
            position: { ...tower.position },
            speed: 1,
            damage: tower.creature.attack,
            target: { ...enemyTarget.position },
          });
          tower.lastAttackTime = time;
        }
      }
    });

    // Update projectiles
    newProjectiles.forEach((p) => {
      const target = newEnemies.find((e) => e.id === p.targetId);
      if (target) {
        p.target = { ...target.position };
      }

      const dx = p.target.x - p.position.x;
      const dy = p.target.y - p.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < p.speed) {
        if (target) {
          target.hp -= p.damage;
        }
        p.speed = 0;
      } else {
        p.position.x += (dx / dist) * p.speed;
        p.position.y += (dy / dist) * p.speed;
      }
    });

    // Filter dead enemies and collect money
    const deadEnemies = newEnemies.filter((e) => e.hp <= 0);
    if (deadEnemies.length > 0) {
      state.money += deadEnemies.length * 10;
      setUiMoney(state.money);
    }
    newEnemies = newEnemies.filter((e) => e.hp > 0);

    newProjectiles = newProjectiles.filter((p) => p.speed > 0);

    state.enemies = newEnemies;
    state.projectiles = newProjectiles;
    state.towers = newTowers;

    setEnemies(newEnemies);
    setProjectiles(newProjectiles);
    setTowers(newTowers);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedCreatureIndex === null) return;
    if (stateRef.current.money < 50) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const newTower = {
        id: `tower_${Date.now()}`,
        creature: PLAYER_CREATURES[selectedCreatureIndex],
        position: { x, y },
        lastAttackTime: 0,
      };

      stateRef.current.towers.push(newTower);
      setTowers([...stateRef.current.towers]);

      stateRef.current.money -= 50;
      setUiMoney(stateRef.current.money);
      setSelectedCreatureIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-9998 bg-slate-900 flex flex-col">
      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-between border-b border-cyan-800">
        <h2 className="text-xl font-bold text-cyan-400">
          Tower Defense Dev Tool
        </h2>
        <div className="flex items-center gap-4 text-white">
          <span>Money: ${uiMoney}</span>
          <span>Lives: {uiLives}</span>
          <span>Wave: {wave}</span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded font-bold"
          >
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold"
          >
            Close
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair overflow-hidden"
        style={{
          backgroundImage: 'url(/backgrounds/forest.png)',
          backgroundSize: 'cover',
        }}
        onClick={handleMapClick}
      >
        {towers.map((t) => (
          <div
            key={t.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none"
            style={{ left: `${t.position.x}%`, top: `${t.position.y}%` }}
          >
            <img
              src={t.creature.spriteUrl}
              alt={t.creature.name}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/30 bg-cyan-400/5 pointer-events-none"
              style={{ width: '30vw', height: '30vw' }}
            />
          </div>
        ))}

        {enemies.map((e) => (
          <div
            key={e.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none"
            style={{ left: `${e.position.x}%`, top: `${e.position.y}%` }}
          >
            <img
              src={e.creature.spriteUrl}
              alt={e.creature.name}
              className="w-full h-full object-contain -scale-x-100"
            />
            <div className="absolute -bottom-2 w-full h-1 bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {projectiles.map((p) => (
          <div
            key={p.id}
            className="absolute w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${p.position.x}%`, top: `${p.position.y}%` }}
          />
        ))}
      </div>

      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-center gap-4 overflow-x-auto border-t border-cyan-800">
        <div className="text-slate-400 mr-4 font-bold uppercase text-sm">
          Select Creature to Place ($50):
        </div>
        {PLAYER_CREATURES.map((creature, i) => (
          <button
            key={creature.id}
            onClick={() =>
              setSelectedCreatureIndex(i === selectedCreatureIndex ? null : i)
            }
            className={`w-24 h-24 p-2 rounded flex flex-col items-center justify-center transition-all ${
              selectedCreatureIndex === i
                ? 'bg-cyan-700 ring-2 ring-cyan-300 scale-110'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <img
              src={creature.spriteUrl}
              alt={creature.name}
              className="w-12 h-12 object-contain"
            />
            <span className="text-[10px] text-white mt-1 uppercase text-center leading-tight">
              {creature.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
