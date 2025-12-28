import React, { createContext, useContext, useMemo } from 'react';
import { generateMap, GeneratedMap, MapConfig } from '../utils/mapGenerator';
import { getMapConfig, APOCALYPSE_TOWN } from '../configs/maps';

interface MapContextValue {
  map: GeneratedMap;
  config: MapConfig;
  mapName: string;
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
  /** Name of the map preset to use (from configs/maps.ts) */
  mapName?: string;
  /** Override seed for the map (optional) */
  seed?: number;
  /** Or provide a complete custom config */
  customConfig?: MapConfig;
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({
  mapName = 'apocalypse_town',
  seed,
  customConfig,
  children
}) => {
  const config = useMemo(() => {
    if (customConfig) {
      return seed !== undefined ? { ...customConfig, seed } : customConfig;
    }
    const baseConfig = getMapConfig(mapName);
    return seed !== undefined ? { ...baseConfig, seed } : baseConfig;
  }, [mapName, seed, customConfig]);

  const map = useMemo(() => generateMap(config), [config]);

  return (
    <MapContext.Provider value={{ map, config, mapName }}>
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
