
import React, { useState, useEffect } from 'react';
import { Game } from './components/Game';
import { UI } from './components/UI';
import { StartMenu, GameOverMenu } from './components/Menus';
import { GameOptions, GameStats, PersistentData, PlayerStats, UpgradeState } from './types';
import { DEFAULT_SAVE_DATA, UPGRADE_CONFIG, getUpgradeCost, SOUND_PATHS } from './constants';
import { audioManager } from './utils/audioManager';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

const STORAGE_KEY = 'blocky_town_save_v1';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameOptions, setGameOptions] = useState<GameOptions>({ 
    unlimitedCash: false, 
    soundEnabled: true,
    characterId: 'TOM' 
  });
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Persistent State
  const [persistentData, setPersistentData] = useState<PersistentData>(DEFAULT_SAVE_DATA);

  // Load Data on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPersistentData(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load save data", e);
    }
    // Preload audio
    audioManager.load(SOUND_PATHS.BGM);
  }, []);

  // Save Helper
  const saveData = (newData: PersistentData) => {
    setPersistentData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const handleStartGame = (options: GameOptions) => {
    setGameOptions(options);
    setGameState('PLAYING');
    setIsPaused(false);
    setGameKey(prev => prev + 1);
    
    // Start Audio
    audioManager.playBGM(SOUND_PATHS.BGM);
  };

  const handleGameOver = (stats: GameStats) => {
    setGameStats(stats);
    setGameState('GAME_OVER');
    
    // Add earned money to persistence
    const newData = {
        ...persistentData,
        totalCash: persistentData.totalCash + stats.moneyEarned
    };
    saveData(newData);
  };

  const handleRetry = () => {
    setGameStats(null);
    setGameState('PLAYING');
    setIsPaused(false);
    setGameKey(prev => prev + 1); // Force full remount
    // Ensure audio continues or restarts
    audioManager.playBGM(SOUND_PATHS.BGM);
  };

  const handleQuit = () => {
    setGameState('MENU');
    setGameStats(null);
    setIsPaused(false);
    audioManager.stopBGM();
  };

  const handleUpgrade = (type: keyof UpgradeState) => {
    // Map upgrade state key to config key
    // type is like "healthLevel", config key is "health"
    const configKey = type.replace('Level', '') as keyof typeof UPGRADE_CONFIG;
    const config = UPGRADE_CONFIG[configKey];
    
    if (!config) return;

    const currentLevel = persistentData.upgrades[type];
    const cost = getUpgradeCost(config.baseCost, currentLevel, config.costMult);

    if (persistentData.totalCash >= cost) {
        const newData = {
            ...persistentData,
            totalCash: persistentData.totalCash - cost,
            upgrades: {
                ...persistentData.upgrades,
                [type]: currentLevel + 1
            }
        };
        saveData(newData);
    }
  };

  // Calculate stats based on upgrades
  const calculatePlayerStats = (): PlayerStats => {
     const { healthLevel, speedLevel, damageLevel, fireRateLevel } = persistentData.upgrades;
     
     // Health
     const maxHealth = UPGRADE_CONFIG.health.base + (healthLevel - 1) * UPGRADE_CONFIG.health.perLevel;
     // Speed
     const movementSpeed = UPGRADE_CONFIG.speed.base + (speedLevel - 1) * UPGRADE_CONFIG.speed.perLevel;
     // Damage
     const damage = UPGRADE_CONFIG.damage.base + (damageLevel - 1) * UPGRADE_CONFIG.damage.perLevel;
     // Fire Rate (Lower is better)
     let fireRate = UPGRADE_CONFIG.fireRate.base + (fireRateLevel - 1) * UPGRADE_CONFIG.fireRate.perLevel;
     fireRate = Math.max(UPGRADE_CONFIG.fireRate.min, fireRate);

     return { maxHealth, movementSpeed, damage, fireRate };
  }

  return (
    <div className="w-full h-full relative bg-gray-900 select-none overflow-hidden font-sans">
      {/* UI is only visible when playing */}
      {gameState === 'PLAYING' && (
        <UI 
            isPaused={isPaused} 
            onTogglePause={setIsPaused} 
            onQuit={handleQuit} 
        />
      )}

      {/* Menus Overlay */}
      {gameState === 'MENU' && (
          <StartMenu 
            onStart={handleStartGame} 
            persistentData={persistentData}
            onUpgrade={handleUpgrade}
          />
      )}
      
      {gameState === 'GAME_OVER' && gameStats && (
        <GameOverMenu 
            stats={gameStats} 
            onRestart={handleRetry} 
            onQuit={handleQuit}
        />
      )}

      {/* Game Logic */}
      {gameState === 'PLAYING' && (
        <Game 
          key={gameKey} 
          onGameOver={handleGameOver} 
          options={gameOptions} 
          playerStats={calculatePlayerStats()}
          isPaused={isPaused}
        />
      )}
    </div>
  );
};

export default App;
