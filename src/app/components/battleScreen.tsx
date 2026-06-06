import React, { useState, useEffect, useRef } from 'react';

import {
  Creature,
  Item,
  BattleConfig,
  BattleContext,
  BackgroundImageKey,
  DialogContext,
  BattleTurnPhase,
  BattleTriggerPhase,
} from '@/types/baseGame';
import { BATTLE_BACKGROUND_IMAGES } from '@/constants/game';
import { Button } from '@/app/components/ui/Button';
import { CreatureBattleStats } from '@/app/components/ui/CreatureBattleStats';
import BattleBackground from '@/app/components/BattleBackground';
import { BattleCreature } from '@/app/components/BattleCreature';
import InventoryModal from '@/app/components/inventory/InventoryModal';

// --- Presentational Component ---
interface BattleScreenUIProps {
  playerCreature: Creature;
  enemyCreature: Creature;
  onAttack: (moveIndex: number) => void;
  onHeal: () => void; // Keep for compatibility if needed, but we used onOpenBag
  onOpenBag: () => void;
  onRun: () => void;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleOver: boolean;

  inventory: Item[];
  backgroundImageUrl: string;
  playerHit?: string;
  enemyHit?: string;
}

export const BattleScreenUI: React.FC<BattleScreenUIProps> = ({
  playerCreature,
  enemyCreature,
  onAttack,
  onHeal,
  onRun,
  battleLog,
  isPlayerTurn,
  battleOver,
  inventory,
  backgroundImageUrl,
  playerHit,
  enemyHit,
  onOpenBag,
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  return (
    <div className="flex flex-col h-full bg-black relative select-none">
      {/* Battle Arena Wrapper - Restricts background to this area */}
      <div className="relative flex-1 min-h-0 w-full">
        <BattleBackground backgroundImageUrl={backgroundImageUrl} />

        {/* Battle Arena Content */}
        <div className="relative h-full w-full z-10">
          {/* Enemy HUD (Top right) */}
          <div className="absolute top-[5%] md:top-[10%] right-4 md:right-8 z-20">
            <CreatureBattleStats creature={enemyCreature} variant="enemy" />
          </div>

          {/* Enemy Sprite (Bottom Right/Center) */}
          <div
            className={`absolute z-10 ${!enemyCreature.battlePosition ? 'bottom-[5%] right-[10%] md:right-[20%]' : ''}`}
            style={
              enemyCreature.battlePosition
                ? {
                    bottom: `${enemyCreature.battlePosition.bottom}%`,
                    right: `${enemyCreature.battlePosition.left}%`,
                  }
                : undefined
            }
          >
            <BattleCreature
              creature={enemyCreature}
              isEnemy={true}
              className="h-40 md:h-56 lg:h-64 w-auto"
              animationOverride={enemyHit}
              scale={enemyCreature.battleScale}
            />
          </div>

          {/* Player Sprite (Bottom Left/Center) */}
          <div
            className={`absolute z-30 ${!playerCreature.battlePosition ? 'bottom-[2%] left-[10%] md:left-[20%]' : ''}`}
            style={
              playerCreature.battlePosition
                ? {
                    bottom: `${playerCreature.battlePosition.bottom}%`,
                    left: `${playerCreature.battlePosition.left}%`,
                  }
                : undefined
            }
          >
            <BattleCreature
              creature={playerCreature}
              className="h-40 md:h-56 lg:h-60 w-auto"
              animationOverride={playerHit}
              scale={playerCreature.battleScale}
            />
          </div>

          {/* Player HUD (Top left) */}
          <div className="absolute top-[5%] md:top-[10%] left-4 md:left-8 z-20">
            <CreatureBattleStats creature={playerCreature} variant="friend" />
          </div>
        </div>
      </div>

      {/* Log & Controls Area - Fixed Height / No Shrink */}
      <div className="bg-ocean-dark border-t-4 border-wood p-2 md:p-4 z-20 shadow-2xl shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {/* Battle Log */}
          <div className="bg-black/40 border-2 border-wood-light/30 rounded p-2 h-24 md:h-32 overflow-y-auto font-mono text-xs md:text-sm text-sand leading-relaxed">
            {battleLog.length === 0 ? (
              <p className="opacity-50">Battle started...</p>
            ) : (
              battleLog.map((log, i) => (
                <p
                  key={i}
                  className="mb-1 border-b border-white/5 pb-1 last:border-0"
                >
                  {log}
                </p>
              ))
            )}
            <div ref={logEndRef}></div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2 h-24 md:h-32">
            {playerCreature.moves.map((move, idx) => (
              <Button
                key={move}
                variant="wood"
                disabled={!isPlayerTurn || battleOver}
                onClick={() => onAttack(idx)}
                className="text-xs md:text-sm h-full flex items-center justify-center"
              >
                {move}
              </Button>
            ))}

            <Button
              variant="secondary"
              disabled={!isPlayerTurn || battleOver}
              onClick={onOpenBag}
              className="flex flex-col items-center justify-center h-full text-xs md:text-sm"
            >
              <span>Bag</span>
            </Button>

            <Button
              variant="danger"
              onClick={onRun}
              disabled={!isPlayerTurn || battleOver}
              className="h-full flex items-center justify-center text-xs md:text-sm"
            >
              Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Logic Wrapper ---
import { resolveDialog } from '@/utils/dialogResolver';
import DialogContent from '@/app/components/ui/DialogContent';
import { DialogContextData, DialogAction } from '@/types/baseGame';

// --- Logic Wrapper ---
interface BattleScreenLogicProps {
  playerCreature: Creature;
  enemyCreature: Creature;
  inventory: Item[];

  onBattleEnd: (won: boolean, modifiedCreatures?: Creature[]) => void;
  backgroundImageKey: BackgroundImageKey;

  // Dialog Support
  dialogContext?: DialogContext | null;
  dialogContextData?: DialogContextData | null;
  onDialogContinue?: () => void;
  onDialogAction?: (action: DialogAction) => void;
  onTriggerTurnEvent?: (turn: number, phase: BattleTriggerPhase) => boolean;
  party: Creature[];
  onUseItem?: (itemId: string, targetCreatureId?: string) => boolean | void;
}

export default function BattleScreen({
  playerCreature,
  enemyCreature,
  inventory,

  onBattleEnd,
  backgroundImageKey,

  dialogContext,
  dialogContextData,
  onDialogContinue,
  onDialogAction,
  onTriggerTurnEvent,
  party,
  onUseItem,
}: BattleScreenLogicProps) {
  // Local state for the battle loop so we don't mutate global store directly until the end
  const [playerHp, setPlayerHp] = useState(playerCreature.currentHp);
  const [enemyHp, setEnemyHp] = useState(enemyCreature.currentHp);

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [playerHit, setPlayerHit] = useState<string | undefined>();
  const [enemyHit, setEnemyHit] = useState<string | undefined>();
  const [showInventory, setShowInventory] = useState(false);

  // Turn Management
  const [turnCount, setTurnCount] = useState(1);
  const [turnPhase, setTurnPhase] = useState<BattleTurnPhase>('before');
  // Simple logging helper
  const addLog = (msg: string) => {
    setBattleLog((prev) => [...prev, msg]);
  };

  useEffect(() => {
    addLog(`A wild ${enemyCreature.name} appeared!`);
    onTriggerTurnEvent?.(1, 'start');
  }, []);

  useEffect(() => {
    if (enemyHp <= 0) {
      addLog(`${enemyCreature.name} fainted! You won!`);
      setBattleOver(true);
      setTimeout(() => onBattleEnd(true, [currentPlayer]), 2000);
    } else if (playerHp <= 0) {
      addLog(`${playerCreature.name} fainted! You lost...`);
      setBattleOver(true);
      setTimeout(() => onBattleEnd(false, [currentPlayer]), 2000);
    }
  }, [enemyHp, playerHp]);

  // Enemy turn logic
  useEffect(() => {
    // 1. Basic checks: Must be enemy turn, battle active, and NO active dialog
    if (isPlayerTurn || battleOver || !!dialogContext) return;

    // 2. Phase: Before Attack
    if (turnPhase === 'before') {
      const triggered = onTriggerTurnEvent?.(turnCount, 'beforeEnemyAttack');
      // If triggered, we stay in 'before' phase but wait for dialog to clear.
      // Once dialog clears, this effect runs again. We need to advance phase ONLY if NOT triggered or trigger handled?
      // actually, if triggered is true, we should probably mark that we attempted it?
      // No, if triggered is true, it means an event was queued. The dialogContext will become true shortly.
      // But for this render cycle, we need to STOP.
      // And we need to advance to 'attack' phase for the NEXT check.
      // But if we advance to 'attack' now, we might skip the wait.
      // Better: If triggered, we wait. The TRIGGER function should probably return true if it did something.
      // If it returned true, we set phase to 'attack' BUT return early so we don't run attack immediately.
      // Next time we come here (after dialog), phase is 'attack', so we proceed.

      setTurnPhase('attack');
      if (triggered) {
        return;
      }
    }

    // 3. Phase: Attack
    if (turnPhase === 'attack') {
      const timer = setTimeout(() => {
        setTurnPhase('animating'); // Advance phase first to prevent re-entry on state changes

        // 1. Enemy Tackle Animation
        setEnemyHit('tackle_enemy');

        setTimeout(() => {
          // 2. Play Tackle Sound (Optional, future)
          // 3. Player Hit Animation + Damage
          setPlayerHit('hit');

          let damage = Math.max(
            1,
            Math.floor(enemyCreature.attack - playerCreature.defense / 2)
          );

          setPlayerHp((prev) => prev - damage);
          addLog(`${enemyCreature.name} attacked doing ${damage} damage!`);

          // Clear animations
          setTimeout(() => {
            setEnemyHit(undefined);
            setPlayerHit(undefined);

            // Add delay before moving to After phase
            setTimeout(() => {
              setTurnPhase('after');
            }, 1000);
          }, 500);
        }, 250); // Impact time (mid-tackle)
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 4. Phase: After Attack
    if (turnPhase === 'after') {
      const triggered = onTriggerTurnEvent?.(turnCount, 'afterEnemyAttack');
      setTurnPhase('end');
      if (triggered) {
        return;
      }
    }

    // 5. Phase: End
    if (turnPhase === 'end') {
      setIsPlayerTurn(true);
      setTurnPhase('before'); // Reset for next enemy turn
      setTurnCount((prev) => prev + 1);
    }
  }, [
    isPlayerTurn,
    battleOver,
    turnPhase,
    dialogContext,
    onTriggerTurnEvent,
    turnCount,
    enemyCreature,
    playerCreature,
  ]);

  const handleAttack = (moveIndex: number) => {
    if (!isPlayerTurn || battleOver) return;

    const triggered = onTriggerTurnEvent?.(turnCount, 'beforePlayerAttack');
    if (triggered) return;

    const moveName = playerCreature.moves[moveIndex];

    setIsPlayerTurn(false);

    // 1. Player Tackle Animation
    setPlayerHit('tackle_player');

    setTimeout(() => {
      // 2. Enemy Hit Animation + Damage
      setEnemyHit('hit');

      let damage = 5; //Math.max(
      // 1,
      // Math.floor(playerCreature.attack - enemyCreature.defense / 2)
      // );

      setEnemyHp((prev) => prev - damage);
      addLog(`${playerCreature.name} used ${moveName} doing ${damage} damage!`);

      // Clear animations
      setTimeout(() => {
        setPlayerHit(undefined);
        setEnemyHit(undefined);
      }, 500);
    }, 250); // Impact time
  };

  const handleHeal = () => {
    // Deprecated in favor of Bag, but kept to satisfy UI prop if needed
    setShowInventory(true);
  };

  const handleUseItem = (itemId: string, targetCreatureId?: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    let catchSuccess = false;
    if (onUseItem) {
      catchSuccess = onUseItem(itemId, targetCreatureId) as boolean;
    }

    if (item.effect === 'CATCH') {
      addLog(`You threw the ${item.name}...`);
      setShowInventory(false);

      setTimeout(() => {
        if (catchSuccess) {
          addLog(`Gotcha! ${enemyCreature.name} was caught!`);
          setBattleOver(true);
          setTimeout(() => onBattleEnd(true, [currentPlayer]), 2000);
        } else {
          addLog(`Oh no! The cosmoid broke free!`);
          setIsPlayerTurn(false);
        }
      }, 1000);
      return;
    }

    const targetName =
      targetCreatureId === playerCreature.id
        ? playerCreature.name
        : party.find((c) => c.id === targetCreatureId)?.name || 'Creature';

    addLog(`You used ${item.name} on ${targetName}!`);

    // If used on active creature, update local state
    if (targetCreatureId === playerCreature.id && item.effect === 'HEAL') {
      const newHp = Math.min(playerHp + item.value, playerCreature.maxHp);
      setPlayerHp(newHp);
    }

    setShowInventory(false);
    setIsPlayerTurn(false);
  };

  const handleRun = () => {
    if (!isPlayerTurn || battleOver) return;
    addLog('You ran away safely!');
    setBattleOver(true);
    setBattleOver(true);
    setTimeout(() => onBattleEnd(false, [currentPlayer]), 1000);
  };

  // Create temporary creature objects with current HP for the UI
  const currentPlayer = {
    ...playerCreature,
    currentHp: Math.max(0, playerHp),
  };
  const currentEnemy = {
    ...enemyCreature,
    currentHp: Math.max(0, enemyHp),
  };

  const backgroundImageUrl =
    BATTLE_BACKGROUND_IMAGES[backgroundImageKey] ||
    BATTLE_BACKGROUND_IMAGES[BackgroundImageKey.DEFAULT];

  // Resolve dialog if active
  const resolvedDialog = dialogContext
    ? resolveDialog(dialogContext, dialogContextData || null)
    : null;
  const sequence = resolvedDialog?.sequence || null;
  const dialogStartIndex = dialogContextData?.dialogStartIndex || 0;

  return (
    <>
      <BattleScreenUI
        playerCreature={currentPlayer}
        enemyCreature={currentEnemy}
        onAttack={handleAttack}
        onHeal={handleHeal}
        onRun={handleRun}
        battleLog={battleLog}
        isPlayerTurn={isPlayerTurn}
        battleOver={battleOver}
        inventory={inventory}
        backgroundImageUrl={backgroundImageUrl}
        playerHit={playerHit}
        enemyHit={enemyHit}
        onOpenBag={() => setShowInventory(true)}
      />

      {showInventory && (
        <InventoryModal
          inventory={inventory}
          creatures={party}
          onClose={() => setShowInventory(false)}
          onUseItem={handleUseItem}
        />
      )}

      {/* Dialog Overlay */}
      {sequence && onDialogContinue && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <DialogContent
            sequence={sequence}
            onContinue={onDialogContinue}
            onDialogAction={onDialogAction || (() => {})}
            initialLineIndex={dialogStartIndex || 0}
          />
        </div>
      )}
    </>
  );
}
