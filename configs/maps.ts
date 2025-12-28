// Map Configurations for Block Town Survivors
// Add new map presets here for future maps

import { MapConfig } from '../utils/mapGenerator';

/**
 * Default apocalyptic town map
 * A grid-based city with streets, buildings, and debris
 */
export const APOCALYPSE_TOWN: MapConfig = {
  seed: 12345,
  worldSize: 100,
  blockSize: 25,
  streetWidth: 6,
  buildingDensity: 0.7,
  treeDensity: 0.4,
  obstacleDensity: 0.3,
};

/**
 * Dense urban map - more buildings, less open space
 */
export const DENSE_CITY: MapConfig = {
  seed: 54321,
  worldSize: 100,
  blockSize: 20,
  streetWidth: 5,
  buildingDensity: 0.85,
  treeDensity: 0.2,
  obstacleDensity: 0.4,
};

/**
 * Suburban wasteland - larger blocks, more trees
 */
export const SUBURBAN_WASTELAND: MapConfig = {
  seed: 99999,
  worldSize: 120,
  blockSize: 35,
  streetWidth: 7,
  buildingDensity: 0.5,
  treeDensity: 0.6,
  obstacleDensity: 0.25,
};

/**
 * Industrial district - large buildings, few trees
 */
export const INDUSTRIAL_ZONE: MapConfig = {
  seed: 77777,
  worldSize: 100,
  blockSize: 30,
  streetWidth: 8,
  buildingDensity: 0.6,
  treeDensity: 0.15,
  obstacleDensity: 0.5,
};

/**
 * Small arena map - compact for intense action
 */
export const ARENA: MapConfig = {
  seed: 11111,
  worldSize: 60,
  blockSize: 20,
  streetWidth: 6,
  buildingDensity: 0.4,
  treeDensity: 0.3,
  obstacleDensity: 0.35,
};

// Map registry for easy lookup
export const MAP_PRESETS: Record<string, MapConfig> = {
  apocalypse_town: APOCALYPSE_TOWN,
  dense_city: DENSE_CITY,
  suburban_wasteland: SUBURBAN_WASTELAND,
  industrial_zone: INDUSTRIAL_ZONE,
  arena: ARENA,
};

// Default map to use
export const DEFAULT_MAP = 'apocalypse_town';

// Helper to get a map config by name
export function getMapConfig(mapName: string): MapConfig {
  return MAP_PRESETS[mapName] || APOCALYPSE_TOWN;
}

// Helper to get a random seed for a new game
export function getRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

// Create a custom map config with a specific seed
export function createMapWithSeed(baseName: string, seed: number): MapConfig {
  const base = getMapConfig(baseName);
  return { ...base, seed };
}
