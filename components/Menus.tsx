
import React, { useState, useEffect } from 'react';
import { GameOptions, GameStats, PersistentData, UpgradeState } from '../types';
import { UPGRADE_CONFIG, getUpgradeCost, CHARACTERS } from '../constants';

interface StartMenuProps {
  onStart: (options: GameOptions) => void;
  persistentData: PersistentData;
  onUpgrade: (type: keyof UpgradeState) => void;
}

// --- Decorative Components ---

const BulletHole: React.FC<{ top: string; left: string }> = ({ top, left }) => (
  <div 
    className="absolute w-3 h-3 bg-black rounded-full z-30 pointer-events-none"
    style={{ top, left, boxShadow: 'inset 1px 1px 3px rgba(0,0,0,1), 0 0 0 1px rgba(100,100,100,0.2)' }}
  >
    <div className="absolute -inset-2 border-2 border-transparent border-t-gray-600/40 border-l-gray-600/40 rounded-full transform rotate-45 scale-75 opacity-70"></div>
    <div className="absolute top-0 left-0 w-full h-full bg-black rounded-full opacity-80"></div>
  </div>
);

const BloodSplatter: React.FC<{ top: string; right: string; size?: string; rotation?: string }> = ({ top, right, size = "w-24 h-24", rotation = "0deg" }) => (
    <div 
        className={`absolute ${size} z-0 pointer-events-none opacity-80 mix-blend-multiply`}
        style={{ 
            top, 
            right, 
            transform: `rotate(${rotation})`,
            background: 'radial-gradient(circle at center, #450a0a 0%, #7f1d1d 40%, transparent 70%)',
            filter: 'blur(1px) contrast(1.2)'
        }}
    >
       <div className="absolute top-1/2 left-1/2 w-full h-1 bg-[#450a0a] rounded-full transform -translate-x-1/2 -translate-y-1/2 rotate-45 blur-sm"></div>
    </div>
);

const ZombieSilhouette = () => (
    <div className="absolute bottom-0 left-0 w-full h-32 bg-black z-0 pointer-events-none opacity-80">
        <div 
            className="w-full h-full bg-black"
            style={{
                clipPath: 'polygon(0% 100%, 0% 80%, 2% 75%, 4% 85%, 6% 65%, 8% 80%, 10% 70%, 12% 85%, 15% 60%, 18% 80%, 20% 75%, 22% 85%, 25% 65%, 28% 80%, 30% 70%, 32% 85%, 35% 60%, 38% 80%, 40% 75%, 42% 85%, 45% 65%, 48% 80%, 50% 70%, 52% 85%, 55% 60%, 58% 80%, 60% 75%, 62% 85%, 65% 65%, 68% 80%, 70% 70%, 72% 85%, 75% 60%, 78% 80%, 80% 75%, 82% 85%, 85% 65%, 88% 80%, 90% 70%, 92% 85%, 95% 60%, 98% 80%, 100% 75%, 100% 100%)',
                transform: 'scaleY(0.6) translateY(40px)',
                filter: 'blur(2px)'
            }}
        />
        <div 
            className="absolute bottom-0 w-full h-full bg-black opacity-50"
             style={{
                clipPath: 'polygon(0% 100%, 3% 85%, 7% 90%, 12% 75%, 18% 90%, 23% 80%, 28% 95%, 34% 70%, 40% 90%, 45% 80%, 52% 95%, 58% 75%, 64% 90%, 70% 80%, 76% 95%, 82% 70%, 88% 90%, 94% 80%, 100% 95%, 100% 100%)',
                transform: 'scaleY(0.8) translateY(10px) scaleX(-1)',
                filter: 'blur(3px)'
            }}
        />
    </div>
);

// --- Main Components ---

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, persistentData, onUpgrade }) => {
  const [view, setView] = useState<'MAIN' | 'SHOP' | 'CHAR_SELECT' | 'CREDITS'>('MAIN');
  const [options, setOptions] = useState<GameOptions>({
    unlimitedCash: false,
    soundEnabled: true,
    characterId: 'TOM'
  });

  useEffect(() => {
    if (view === 'CREDITS') {
        const timer = setTimeout(() => {
            setView('MAIN');
        }, 10000);
        return () => clearTimeout(timer);
    }
  }, [view]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const ShopUI = () => (
    <div className="bg-gray-900 p-8 rounded-sm shadow-[0_0_50px_rgba(0,0,0,1)] border border-gray-700 w-[550px] animate-in fade-in zoom-in duration-300 relative overflow-hidden z-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>

        <div className="flex justify-between items-center mb-8 mt-2">
            <div>
                <h2 className="text-4xl font-black text-gray-200 italic tracking-tighter uppercase">Armory</h2>
                <div className="text-red-700 text-xs font-bold tracking-[0.3em] uppercase mt-1">Upgrades & Equipment</div>
            </div>
            <div className="bg-black/60 px-5 py-3 rounded border border-gray-700 flex flex-col items-end">
               <span className="text-xs text-green-700 font-bold uppercase tracking-wider">Funds</span>
               <span className="text-green-500 font-mono font-black text-2xl leading-none">${persistentData.totalCash}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
           {(Object.keys(UPGRADE_CONFIG) as Array<keyof typeof UPGRADE_CONFIG>).map((key) => {
               const config = UPGRADE_CONFIG[key];
               const levelKey = `${key}Level` as keyof UpgradeState;
               const currentLevel = persistentData.upgrades[levelKey];
               const cost = getUpgradeCost(config.baseCost, currentLevel, config.costMult);
               const canAfford = persistentData.totalCash >= cost;

               let val = config.base + (currentLevel - 1) * config.perLevel;
               if (key === 'fireRate') val = Math.max(UPGRADE_CONFIG.fireRate.min, val);

               let nextVal = config.base + currentLevel * config.perLevel;
               if (key === 'fireRate') nextVal = Math.max(UPGRADE_CONFIG.fireRate.min, nextVal);
               
               return (
                   <div key={key} className="bg-gray-800 p-4 rounded border border-gray-600 flex flex-col gap-3 relative group overflow-hidden hover:border-gray-500 transition-colors">
                       <div className="flex justify-between items-start z-10">
                           <span className="font-bold text-lg text-gray-300 tracking-wide uppercase">{config.name}</span>
                           <span className="text-xs font-black bg-black text-gray-500 px-2 py-1 rounded">LVL {currentLevel}</span>
                       </div>
                       
                       <div className="flex items-center gap-2 text-sm z-10 mb-1">
                            <span className="text-gray-500 font-mono">{val}</span>
                            <span className="text-gray-600">➜</span>
                            <span className="text-green-600 font-bold font-mono">{nextVal}</span>
                       </div>

                       <button
                         disabled={!canAfford}
                         onClick={() => onUpgrade(levelKey)}
                         className={`w-full py-3 rounded-sm font-black text-sm transition-all flex justify-between px-4 border shadow-lg z-10 items-center uppercase tracking-wider ${
                             canAfford 
                             ? 'bg-red-900 hover:bg-red-800 border-red-950 text-red-100 hover:text-white' 
                             : 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed'
                         }`}
                       >
                           <span>Upgrade</span>
                           <span className={canAfford ? "text-white" : ""}>${cost}</span>
                       </button>
                   </div>
               )
           })}
        </div>

        <button 
            onClick={() => setView('MAIN')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-4 rounded-sm transition-all border border-gray-600 uppercase tracking-widest text-sm"
        >
            Back to Menu
        </button>
    </div>
  );

  const CharacterSelectUI = () => (
      <div className="bg-gray-900 p-8 rounded-sm shadow-[0_0_50px_rgba(0,0,0,1)] border border-gray-700 w-[700px] animate-in fade-in zoom-in duration-300 relative overflow-hidden z-20">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-900"></div>

        <h2 className="text-4xl font-black text-white mb-2 text-center italic tracking-tighter mt-2 uppercase">Select Survivor</h2>
        <p className="text-center text-gray-500 mb-8 uppercase tracking-[0.3em] text-xs font-bold">Choose your fighter</p>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
            {Object.values(CHARACTERS).map(char => {
                const isSelected = options.characterId === char.id;
                return (
                <button 
                    key={char.id}
                    onClick={() => {
                        setOptions(o => ({ ...o, characterId: char.id }));
                        onStart({ ...options, characterId: char.id });
                    }}
                    className={`
                        relative p-6 rounded-sm text-left transition-all group shadow-xl border flex flex-col h-full
                        ${isSelected 
                            ? 'bg-gray-800 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
                            : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                        }
                    `}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className={`text-2xl font-black transition-colors uppercase italic tracking-wide ${isSelected ? 'text-red-500' : 'text-gray-300 group-hover:text-white'}`}>{char.name}</span>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{char.weaponName} Specialist</span>
                        </div>
                         <div className="flex flex-col gap-1 mt-1">
                             <div className="w-5 h-5 rounded-full border border-black shadow-sm" style={{ backgroundColor: char.model.shirt }}></div>
                             <div className="w-5 h-5 rounded-full border border-black shadow-sm" style={{ backgroundColor: char.model.pants }}></div>
                         </div>
                    </div>
                    
                    <div className="text-gray-400 text-sm mb-6 flex-grow italic leading-relaxed border-l-2 border-gray-700 pl-3">
                        "{char.description}"
                    </div>
                    
                    <div className={`
                        p-3 rounded-sm text-sm flex justify-between items-center border transition-colors
                        ${isSelected ? 'bg-black/40 border-red-900/50' : 'bg-black/20 border-gray-800'}
                    `}>
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Weapon</span>
                        <span className={`font-bold ${isSelected ? 'text-red-400' : 'text-gray-300'}`}>{char.weaponName}</span>
                    </div>
                </button>
            )})}
        </div>

        <button 
            onClick={() => setView('MAIN')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-4 rounded-sm transition-all border border-gray-600 uppercase tracking-widest text-sm"
        >
            Cancel
        </button>
      </div>
  );

  const CreditsUI = () => (
      <div 
        className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer" 
        onClick={() => setView('MAIN')}
      >
        <div 
            className="flex flex-col items-center text-center space-y-12 w-full"
            style={{ animation: 'rollCredits 10s linear forwards' }}
        >
             <style>{`
                @keyframes rollCredits {
                    0% { transform: translateY(100vh); }
                    100% { transform: translateY(-150%); }
                }
            `}</style>
            <h2 className="text-5xl font-black text-red-600 tracking-widest uppercase mb-12 drop-shadow-lg">Credits</h2>
            
            <div className="space-y-2">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mb-1">Director \ Designer</div>
                <div className="text-3xl text-white font-black tracking-wide">Jamie T</div>
            </div>

            <div className="space-y-2">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mb-1">Code Writer</div>
                <div className="text-3xl text-white font-black tracking-wide">Google Studio AI</div>
            </div>

            <div className="space-y-2">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mb-1">Background Music</div>
                <div className="text-3xl text-white font-black tracking-wide">nickpanek</div>
                <div className="text-gray-600 text-xs mt-1 tracking-wider">(pixabay.com)</div>
            </div>
             
             {/* Spacing to ensure it clears the screen */}
            <div className="h-[20vh]"></div>
        </div>
        
        <div className="absolute bottom-8 text-gray-700 text-[10px] uppercase tracking-widest animate-pulse font-mono">
            Click to Skip
        </div>
      </div>
  );

  return (
    <div className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 text-white overflow-hidden font-sans">
      
      {/* --- Environment Background --- */}
      <div className="absolute inset-0 z-0">
          {/* Deep Red Fog Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#1a0000_80%,_#000000_100%)] z-10 pointer-events-none"></div>
          
          {/* Subtle animated red background noise */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
          
          {/* Grid Floor */}
          <div 
            className="absolute bottom-0 w-full h-[50%] opacity-20 origin-bottom transform perspective-[100px] rotate-x-[60deg]" 
            style={{ 
                backgroundImage: 'linear-gradient(rgba(255,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.3) 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to top, black, transparent)'
            }}
          ></div>
          
          {/* Zombie Silhouette Crowd */}
          <ZombieSilhouette />
      </div>

      <div className="relative z-20 flex flex-col items-center">
          {/* Main Title */}
          <div className="mb-10 text-center relative group">
              <h1 className="text-8xl font-black text-[#8a1c1c] tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase select-none" 
                  style={{ WebkitTextStroke: '1px #220505' }}>
                Block Town
              </h1>
              <h2 className="text-5xl font-black text-gray-300 tracking-[1.2rem] uppercase -mt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative left-2 select-none">
                Survival
              </h2>
              {/* Blood drip animation hint */}
              <div className="absolute top-[60px] right-[40px] w-2 h-16 bg-[#8a1c1c] rounded-b-full opacity-80 animate-pulse pointer-events-none"></div>
          </div>
          
          {view === 'SHOP' && <ShopUI />}
          {view === 'CHAR_SELECT' && <CharacterSelectUI />}
          {view === 'CREDITS' && <CreditsUI />}
          
          {view === 'MAIN' && (
          <div className="relative bg-[#0f0f11] border border-gray-800 w-[420px] p-8 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-20">
            {/* Edgy Decor - Corners */}
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 border-red-800/50"></div>
            <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-2 border-r-2 border-red-800/50"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-2 border-l-2 border-red-800/50"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-2 border-r-2 border-red-800/50"></div>

            {/* Bullet Holes & Blood */}
            <BulletHole top="12%" left="4%" />
            <BulletHole top="88%" left="94%" />
            <BloodSplatter top="-20px" right="-20px" size="w-32 h-32" rotation="45deg" />

            {/* Top Red Bar Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#8a1c1c] rounded-t-sm shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>

            <div className="space-y-5 pt-4 relative z-10">
              {/* Start Button */}
              <button 
                onClick={() => setView('CHAR_SELECT')}
                className="w-full relative group bg-[#c62828] hover:bg-[#b71c1c] text-white font-black py-5 text-2xl tracking-[0.15em] uppercase shadow-[0_6px_0_#7f1d1d] active:shadow-none active:translate-y-[6px] transition-all rounded-sm border-t border-red-400/30"
              >
                Start Survival
              </button>

              {/* Armory */}
              <button 
                onClick={() => setView('SHOP')}
                className="w-full flex items-center justify-between bg-[#1a1a1d] hover:bg-[#222] border border-gray-700 hover:border-gray-500 text-white font-bold py-3 px-5 shadow-inner transition-all group rounded-sm"
              >
                <span className="uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors text-sm">Armory</span>
                <span className="bg-black/60 px-3 py-1 rounded text-green-500 font-mono border border-green-900/30 shadow-[0_0_5px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all">
                  ${persistentData.totalCash}
                </span>
              </button>
              
              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="w-full bg-[#1a1a1d] hover:bg-[#222] border border-gray-700 hover:border-gray-500 text-gray-500 font-bold py-3 text-xs uppercase tracking-[0.2em] hover:text-white transition-all rounded-sm"
              >
                Fullscreen
              </button>
            </div>

            {/* Options Area - Grouped at Bottom */}
            <div className="mt-8 pt-6 border-t border-gray-800 space-y-4 relative">
                {/* Section Label */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#0f0f11] px-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                    Settings
                </div>

                {/* Sound Toggle */}
                <div className="bg-[#151517] p-3 rounded-md border border-gray-800/50 flex items-center justify-between group hover:border-gray-700 transition-colors">
                     <span className="font-bold text-gray-400 group-hover:text-gray-200 text-sm tracking-wide">Sound Effects</span>
                     <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${options.soundEnabled ? 'bg-[#c62828]' : 'bg-gray-700'}`}
                        onClick={() => setOptions(o => ({ ...o, soundEnabled: !o.soundEnabled }))}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${options.soundEnabled ? 'left-7' : 'left-1'}`} />
                     </div>
                </div>

                {/* Credits Button (Replaces Unlimited Cash) */}
                <button 
                    onClick={() => setView('CREDITS')}
                    className="w-full bg-[#151517] hover:bg-[#1a1a1d] p-3 rounded-md border border-gray-800/50 flex items-center justify-center group hover:border-gray-700 transition-colors"
                >
                    <span className="font-bold text-gray-400 group-hover:text-white text-sm tracking-widest uppercase">Credits</span>
                </button>

            </div>
            
            <div className="text-center text-[10px] text-gray-700 mt-6 font-mono uppercase tracking-widest opacity-50">
              WASD to Move • Click to Shoot
            </div>
          </div>
          )}
      </div>
    </div>
  );
};

interface GameOverMenuProps {
  stats: GameStats;
  onRestart: () => void;
  onQuit: () => void;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ stats, onRestart, onQuit }) => {
  return (
    <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white animate-in fade-in duration-500">
      <h2 className="text-8xl font-black mb-2 text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tighter text-red-500 animate-pulse">WASTED</h2>
      <p className="text-xl text-red-200 mb-10 font-mono tracking-[0.5rem] uppercase">You Died</p>

      <div className="bg-black/80 p-10 rounded-xl backdrop-blur-xl border border-red-900/50 w-[450px] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>

        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Time Survived</span>
            <span className="font-mono text-2xl text-white">{stats.timeSurvived}s</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Level Reached</span>
            <span className="font-mono text-2xl text-blue-400">{stats.levelReached}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Zombies Killed</span>
            <span className="font-mono text-2xl text-red-500">{stats.enemiesKilled}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Money Earned</span>
            <span className="font-mono text-2xl text-green-500">+${stats.moneyEarned}</span>
            </div>
        </div>
        
        <div className="bg-white/5 p-4 rounded text-center text-xs text-gray-500 mt-4 italic border border-white/5">
            Total cash has been saved to your armory stash.
        </div>

        <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={onRestart}
              className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-lg text-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] tracking-widest uppercase border-b-4 border-gray-400"
            >
              Try Again
            </button>
            <button 
              onClick={onQuit}
              className="w-full bg-red-900/50 hover:bg-red-800/50 text-red-200 font-bold py-3 rounded-lg text-sm shadow-xl transition-all border border-red-900 tracking-widest uppercase"
            >
              Quit to Menu
            </button>
        </div>
      </div>
    </div>
  );
};
