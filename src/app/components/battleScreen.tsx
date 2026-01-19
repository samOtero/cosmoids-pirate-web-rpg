import React, { useState, useEffect, useRef } from 'react';
import { Creature, Item } from '@/types/baseGame';
import { Button } from '@/app/components/ui/Button';
import { CreatureStatus } from '@/app/components/ui/CreatureStatus';
import BattleBackground from '@/app/components/BattleBackground';

// --- Presentational Component ---
interface BattleScreenUIProps {
  playerCreature: Creature;
  enemyCreature: Creature;
  onAttack: (moveIndex: number) => void;
  onHeal: () => void;
  onRun: () => void;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleOver: boolean;
  inventory: Item[];
}

const BattleScreenUI: React.FC<BattleScreenUIProps> = ({ 
  playerCreature, enemyCreature, onAttack, onHeal, onRun, battleLog, isPlayerTurn, battleOver, inventory 
}) => {
  const potion = inventory.find(i => i.id === 'potion');
  const potionCount = potion ? potion.count : 0;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Battle Arena Wrapper - Restricts background to this area */}
      <div className="relative flex-1 min-h-0 w-full">
        <BattleBackground />
        
        {/* Battle Arena Content */}
        <div className="relative h-full p-2 md:p-4 flex flex-col justify-center md:justify-between max-w-5xl mx-auto w-full z-10 overflow-y-auto custom-scrollbar">
          
          {/* Enemy Group */}
          <CreatureStatus creature={enemyCreature} variant="enemy" />
  
          {/* Player Group */}
          <CreatureStatus creature={playerCreature} variant="friend" showHpValues />
        </div>
      </div>

      {/* Log & Controls Area - Fixed Height / No Shrink */}
      <div className="bg-ocean-dark border-t-4 border-wood p-2 md:p-4 z-20 shadow-2xl shrink-0">
         <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            
            {/* Battle Log */}
            <div className="bg-black/40 border-2 border-wood-light/30 rounded p-2 h-24 md:h-32 overflow-y-auto font-mono text-xs md:text-sm text-sand leading-relaxed">
              {battleLog.length === 0 ? <p className="opacity-50">Battle started...</p> : 
                battleLog.map((log, i) => (
                  <p key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</p>
                ))
              }
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
                 disabled={!isPlayerTurn || battleOver || potionCount === 0}
                 onClick={onHeal}
                 className="flex flex-col items-center justify-center h-full text-xs md:text-sm"
               >
                 <span>Bag</span>
                 <span className="text-[10px] opacity-70">Potions: {potionCount}</span>
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
interface BattleScreenLogicProps {
  playerCreature: Creature; 
  enemyCreature: Creature;
  inventory: Item[];
  onBattleEnd: (won: boolean) => void;
}

export default function BattleScreen({ playerCreature, enemyCreature, inventory, onBattleEnd }: BattleScreenLogicProps) {
  // Local state for the battle loop so we don't mutate global store directly until the end
  const [playerHp, setPlayerHp] = useState(playerCreature.currentHp);
  const [enemyHp, setEnemyHp] = useState(enemyCreature.currentHp);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleOver, setBattleOver] = useState(false);

  // Simple logging helper
  const addLog = (msg: string) => {
    setBattleLog(prev => [...prev, msg]);
  };

  useEffect(() => {
    addLog(`A wild ${enemyCreature.name} appeared!`);
  }, []);

  useEffect(() => {
    if (enemyHp <= 0) {
      addLog(`${enemyCreature.name} fainted! You won!`);
      setBattleOver(true);
      setTimeout(() => onBattleEnd(true), 2000);
    } else if (playerHp <= 0) {
      addLog(`${playerCreature.name} fainted! You lost...`);
      setBattleOver(true);
      setTimeout(() => onBattleEnd(false), 2000);
    }
  }, [enemyHp, playerHp]);

  // Enemy turn logic
  useEffect(() => {
    if (!isPlayerTurn && !battleOver) {
        const timer = setTimeout(() => {
            // Enemy attacks
            const damage = Math.max(1, Math.floor(enemyCreature.attack - (playerCreature.defense / 2)));
            setPlayerHp(prev => prev - damage);
            addLog(`${enemyCreature.name} attacked doing ${damage} damage!`);
            setIsPlayerTurn(true);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, battleOver]);


  const handleAttack = (moveIndex: number) => {
    if (!isPlayerTurn || battleOver) return;

    // Calc damage
    const moveName = playerCreature.moves[moveIndex];
    const damage = Math.max(1, Math.floor(playerCreature.attack - (enemyCreature.defense / 2)));
    setEnemyHp(prev => prev - damage);
    addLog(`${playerCreature.name} used ${moveName} doing ${damage} damage!`);
    
    setIsPlayerTurn(false);
  };

  const handleHeal = () => {
    if (!isPlayerTurn || battleOver) return;
    // Logic to use potion would go here - for now just skip turn effectively or implement heal if we updated inventory
    addLog("You used a potion! (Not implemented fully yet)");
    setIsPlayerTurn(false);
  };

  const handleRun = () => {
    if (!isPlayerTurn || battleOver) return;
    addLog("You ran away safely!");
    setBattleOver(true);
    setTimeout(() => onBattleEnd(false), 1000);
  };

  // Create temporary creature objects with current HP for the UI
  const currentPlayer = { ...playerCreature, currentHp: Math.max(0, playerHp) };
  const currentEnemy = { ...enemyCreature, currentHp: Math.max(0, enemyHp) };

  return (
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
    />
  );
}
