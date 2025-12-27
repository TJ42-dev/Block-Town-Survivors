
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { Character } from './Character';
import { Environment } from './Environment';
import { GameOptions, GameStats, PlayerStats } from '../types';

interface GameProps {
  onGameOver: (stats: GameStats) => void;
  options: GameOptions;
  playerStats: PlayerStats;
  isPaused: boolean;
}

export const Game: React.FC<GameProps> = ({ onGameOver, options, playerStats, isPaused }) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [8, 12, 8], fov: 40 }} // Initial camera
        dpr={[1, 2]}
      >
        <Stats />
        
        {/* Red Moon Atmosphere */}
        <color attach="background" args={['#1a0505']} />
        <fog attach="fog" args={['#1a0505', 15, 60]} />

        {/* --- Lighting --- */}
        {/* Reddish ambient light */}
        <ambientLight intensity={0.4} color="#5c3a3a" />
        
        {/* Crimson Moonlight */}
        <directionalLight
          position={[-20, 30, -20]}
          intensity={2.0}
          color="#ff5555"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0005}
        />
        
        {/* Rim light for definition */}
        <pointLight position={[10, 5, 10]} intensity={0.5} color="#4466ff" distance={20} />

        {/* --- World Content --- */}
        <Environment />
        
        {/* --- Player --- */}
        <Character 
          onGameOver={onGameOver} 
          options={options} 
          playerStats={playerStats} 
          isPaused={isPaused}
        />
        
      </Canvas>
    </div>
  );
};
