
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { Character } from './Character';
import { Environment } from './Environment';
import { MapProvider } from '../contexts/MapContext';
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
        camera={{ position: [8, 12, 8], fov: 40 }}
        dpr={[1, 2]}
      >
        <MapProvider seed={12345}>
          <Stats />

          {/* Red Moon Atmosphere */}
          <color attach="background" args={['#0a0205']} />
          <fog attach="fog" args={['#0a0205', 20, 80]} />

          {/* --- Lighting --- */}
          {/* Dim reddish ambient light */}
          <ambientLight intensity={0.25} color="#4a2525" />

          {/* Crimson Moonlight - main directional */}
          <directionalLight
            position={[-30, 40, -30]}
            intensity={1.5}
            color="#ff4444"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.0005}
          />

          {/* Cold rim light for contrast */}
          <pointLight position={[20, 8, 20]} intensity={0.3} color="#334466" distance={30} />

          {/* Subtle ground bounce light */}
          <hemisphereLight args={['#1a0505', '#000000', 0.2]} />

          {/* --- World Content --- */}
          <Environment />

          {/* --- Player --- */}
          <Character
            onGameOver={onGameOver}
            options={options}
            playerStats={playerStats}
            isPaused={isPaused}
          />
        </MapProvider>
      </Canvas>
    </div>
  );
};
