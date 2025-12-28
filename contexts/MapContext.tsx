import React, { createContext, useContext, useMemo } from 'react';
import { generateMap, DEFAULT_MAP_CONFIG, GeneratedMap, MapConfig } from '../utils/mapGenerator';

interface MapContextValue {
  map: GeneratedMap;
  config: MapConfig;
}

const MapContext = createContext<MapContextValue | null>(null);

export const useMap = (): MapContextValue => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

interface MapProviderProps {
  seed?: number;
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ seed = 12345, children }) => {
  const config = useMemo(() => ({ ...DEFAULT_MAP_CONFIG, seed }), [seed]);
  const map = useMemo(() => generateMap(config), [config]);

  return (
    <MapContext.Provider value={{ map, config }}>
      {children}
    </MapContext.Provider>
  );
};

// Helper types for collision detection
export interface CollisionBuilding {
  position: [number, number, number];
  size: [number, number, number];
  rotation: number;
}

export interface CollisionTree {
  position: [number, number, number];
  radius: number;
}

export interface CollisionObstacle {
  position: [number, number, number];
  type: string;
  radius: number;
}

// Convert generated map to collision data
export function getCollisionData(map: GeneratedMap) {
  const buildings: CollisionBuilding[] = map.buildings.map(b => ({
    position: b.position,
    size: b.size,
    rotation: b.rotation,
  }));

  const trees: CollisionTree[] = map.trees.map(t => ({
    position: t.position,
    radius: 0.3 * t.scale,
  }));

  const obstacles: CollisionObstacle[] = map.obstacles.map(o => ({
    position: o.position,
    type: o.type,
    radius: o.type === 'car' ? 1.2 : 0.5,
  }));

  return { buildings, trees, obstacles };
}
