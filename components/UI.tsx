
import React, { useEffect, useState } from 'react';
import { WEAPONS, MAX_HEALTH } from '../constants';
import { audioManager } from '../utils/audioManager';
import { PerkOption } from '../types';

// We'll use a simple custom event system to update UI from the Character component 
// to avoid prop drilling complex state up to App.tsx
export const uiEvents = new EventTarget();

interface UIProps {
    isPaused: boolean;
    onTogglePause: (paused: boolean) => void;
    onQuit: () => void;
}

export const UI: React.FC<UIProps> = ({ isPaused, onTogglePause, onQuit }) => {
  const [ammo, setAmmo] = useState(WEAPONS.PISTOL.maxAmmo);
  const [maxAmmo, setMaxAmmo] = useState(WEAPONS.PISTOL.maxAmmo);
  const [health, setHealth] = useState(MAX_HEALTH);
  const [currentMaxHealth, setCurrentMaxHealth] = useState(MAX_HEALTH);
  const [isReloading, setIsReloading] = useState(false);
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);

  // Exp State
  const [exp, setExp] = useState(0);
  const [maxExp, setMaxExp] = useState(100);
  const [level, setLevel] = useState(1);
  const [levelUpOptions, setLevelUpOptions] = useState<PerkOption[] | null>(null);

  // Settings State
  const [sfxVolume, setSfxVolume] = useState(audioManager.sfxVolume);
  const [bgmVolume, setBgmVolume] = useState(audioManager.bgmVolume);

  useEffect(() => {
    const handleAmmoUpdate = (e: any) => {
      setAmmo(e.detail.current);
      setMaxAmmo(e.detail.max);
    };
    
    const handleReloading = (e: any) => {
        setIsReloading(e.detail.isReloading);
    }

    const handleHealthUpdate = (e: any) => {
        setHealth(e.detail.health);
        if (e.detail.maxHealth) {
            setCurrentMaxHealth(e.detail.maxHealth);
        }
    }

    const handleWaveUpdate = (e: any) => {
        setWave(e.detail.wave);
    }

    const handleMoneyUpdate = (e: any) => {
        setMoney(e.detail.money);
    }
    
    const handleExpUpdate = (e: any) => {
        setExp(e.detail.current);
        setMaxExp(e.detail.max);
        setLevel(e.detail.level);
    }

    const handleShowLevelUp = (e: any) => {
        setLevelUpOptions(e.detail.options);
    }

    const handleTimeUpdate = (e: any) => {
        setTimeSurvived(e.detail.time);
    }

    uiEvents.addEventListener('ammoChange', handleAmmoUpdate);
    uiEvents.addEventListener('reloadState', handleReloading);
    uiEvents.addEventListener('healthChange', handleHealthUpdate);
    uiEvents.addEventListener('waveChange', handleWaveUpdate);
    uiEvents.addEventListener('moneyChange', handleMoneyUpdate);
    uiEvents.addEventListener('expChange', handleExpUpdate);
    uiEvents.addEventListener('showLevelUp', handleShowLevelUp);
    uiEvents.addEventListener('timeUpdate', handleTimeUpdate);

    return () => {
      uiEvents.removeEventListener('ammoChange', handleAmmoUpdate);
      uiEvents.removeEventListener('reloadState', handleReloading);
      uiEvents.removeEventListener('healthChange', handleHealthUpdate);
      uiEvents.removeEventListener('waveChange', handleWaveUpdate);
      uiEvents.removeEventListener('moneyChange', handleMoneyUpdate);
      uiEvents.removeEventListener('expChange', handleExpUpdate);
      uiEvents.removeEventListener('showLevelUp', handleShowLevelUp);
      uiEvents.removeEventListener('timeUpdate', handleTimeUpdate);
    };
  }, []);

  // Hotkey for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
          // If level up is showing, pause logic is handled by levelUpOptions existence 
          // but we can toggle the settings menu. 
          // Usually games allow toggling main menu even during interactions, 
          // or block it. Here we just toggle.
          onTogglePause(!isPaused);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, onTogglePause]);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setSfxVolume(v);
      audioManager.setSFXVolume(v);
  };

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setBgmVolume(v);
      audioManager.setBGMVolume(v);
  };

  const selectPerk = (perk: PerkOption) => {
      setLevelUpOptions(null);
      uiEvents.dispatchEvent(new CustomEvent('selectPerk', { detail: { perk } }));
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const healthPercent = (health / currentMaxHealth) * 100;
  const expPercent = Math.min(100, (exp / maxExp) * 100);

  return (
    <>
      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="flex gap-2">
            <div className="bg-red-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-red-500/30 text-white font-bold tracking-widest shadow-lg pointer-events-none">
                ZOMBIES: {wave}
            </div>
            <button 
                onClick={() => onTogglePause(true)}
                className="bg-gray-800/80 hover:bg-gray-700 backdrop-blur-md p-2 rounded-full border border-gray-500 text-white shadow-lg transition-all"
            >
                ⚙️
            </button>
          </div>
      </div>

      {/* Level Up Modal */}
      {levelUpOptions && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
             <h2 className="text-5xl font-black text-red-600 mb-2 drop-shadow-lg tracking-wider">LEVEL UP!</h2>
             <p className="text-gray-300 mb-8 text-xl font-light">Choose your survival perk</p>
             
             <div className="flex gap-4 items-stretch">
                {levelUpOptions.map((perk, idx) => (
                    <button 
                        key={perk.id}
                        onClick={() => selectPerk(perk)}
                        className={`
                            w-64 p-6 rounded-sm border-2 transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] text-left group
                            ${perk.rarity === 'COMMON' ? 'bg-gray-900 border-gray-600 hover:border-gray-400' : ''}
                            ${perk.rarity === 'RARE' ? 'bg-blue-900/40 border-blue-600 hover:border-blue-400' : ''}
                            ${perk.rarity === 'EPIC' ? 'bg-purple-900/40 border-purple-600 hover:border-purple-400' : ''}
                        `}
                    >
                        <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">
                           <span className={
                               perk.rarity === 'COMMON' ? 'text-gray-400' :
                               perk.rarity === 'RARE' ? 'text-blue-400' : 'text-purple-400'
                           }>{perk.rarity}</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{perk.label}</div>
                        <div className="text-gray-400 leading-relaxed">{perk.description}</div>
                    </button>
                ))}
             </div>
         </div>
      )}

      {/* Settings Modal */}
      {isPaused && !levelUpOptions && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
              <div className="bg-gray-900 p-8 rounded-sm shadow-2xl border border-gray-700 w-96 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-red-600 tracking-widest">PAUSED</h2>
                      <button onClick={() => onTogglePause(false)} className="text-gray-500 hover:text-white">✕</button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <div className="flex justify-between text-white mb-2">
                              <span>Music Volume</span>
                              <span className="text-gray-500 font-mono">{Math.round(bgmVolume * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.05" 
                            value={bgmVolume} 
                            onChange={handleBgmChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                          />
                      </div>
                      
                      <div>
                          <div className="flex justify-between text-white mb-2">
                              <span>SFX Volume</span>
                              <span className="text-gray-500 font-mono">{Math.round(sfxVolume * 100)}%</span>
                          </div>
                           <input 
                            type="range" 
                            min="0" max="1" step="0.05" 
                            value={sfxVolume} 
                            onChange={handleSfxChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                          />
                      </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <button 
                        onClick={() => onTogglePause(false)}
                        className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-sm transition-all border border-red-900"
                    >
                        RESUME SURVIVAL
                    </button>
                    
                    <button 
                        onClick={onQuit}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-sm transition-all border border-gray-700 hover:text-white"
                    >
                        QUIT TO MENU
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* Info Panel - Title Only */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-sm text-white border border-white/10 shadow-xl">
          <h1 className="text-xl font-black text-red-600 tracking-tighter">BLOCK TOWN SURVIVAL</h1>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-1">
         {/* Stopwatch */}
         <div className="font-mono font-black text-3xl text-white drop-shadow-md tracking-widest bg-black/20 px-4 rounded-sm backdrop-blur-sm border border-white/5 mb-1">
            {formatTime(timeSurvived)}
         </div>

         <div className="bg-gray-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-green-900/50 text-white shadow-lg flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="font-black font-mono text-2xl text-green-600">${money}</span>
         </div>
         {/* Level Bar */}
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center font-bold text-white border-2 border-red-900 shadow-lg z-10">
                {level}
            </div>
            <div className="w-64 h-3 bg-black/60 backdrop-blur-sm rounded-full border border-white/10 overflow-hidden -ml-4">
                 <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${expPercent}%` }}></div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none w-64">
          <div className="bg-black/70 backdrop-blur-md p-3 rounded-sm border border-white/10 shadow-2xl">
              <div className="flex justify-between text-white mb-1">
                  <span className="font-bold text-gray-400">VITALS</span>
                  <span className="font-mono text-red-500">{Math.ceil(health)} / {currentMaxHealth}</span>
              </div>
              <div className="w-full bg-gray-900 h-4 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className={`h-full transition-all duration-300 ${healthPercent > 30 ? 'bg-red-700' : 'bg-red-500 animate-pulse'}`}
                    style={{ width: `${healthPercent}%` }}
                  ></div>
              </div>
          </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-md p-4 rounded-sm text-white border border-white/10 shadow-2xl flex items-center gap-4">
            <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Weapon</div>
                <div className={`text-4xl font-black font-mono tracking-wider ${isReloading ? 'text-yellow-600 animate-pulse' : ammo === 0 ? 'text-red-900' : 'text-gray-200'}`}>
                    {isReloading ? 'RLD' : `${ammo} / ${maxAmmo}`}
                </div>
            </div>
            {/* Simple Bullet Icon */}
            <div className="h-10 w-4 bg-gray-400 rounded-t-full rounded-b-sm border-2 border-gray-600"></div>
        </div>
      </div>
    </>
  );
};
