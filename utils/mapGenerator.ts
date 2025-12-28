// Procedural Map Generator for Block Town Survivors
// Generates apocalyptic town layouts with buildings, streets, and obstacles

export interface MapConfig {
  seed: number;
  worldSize: number;        // Total world size (e.g., 100 = 100x100)
  blockSize: number;        // Size of each city block
  streetWidth: number;      // Width of streets
  buildingDensity: number;  // 0-1, chance of building per plot
  treeDensity: number;      // 0-1, trees per valid area
  obstacleDensity: number;  // 0-1, debris/cars per area
}

export interface GeneratedBuilding {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  variant: 'small' | 'medium' | 'large' | 'ruined';
  rotation: number;
}

export interface GeneratedTree {
  position: [number, number, number];
  scale: number;
  variant: 'dead' | 'burnt' | 'twisted';
}

export interface GeneratedObstacle {
  position: [number, number, number];
  type: 'car' | 'debris' | 'barricade' | 'dumpster' | 'barrel';
  rotation: number;
  scale: number;
}

export interface GeneratedStreetLamp {
  position: [number, number, number];
  rotation: number;
  working: boolean;
}

export interface GeneratedMap {
  buildings: GeneratedBuilding[];
  trees: GeneratedTree[];
  obstacles: GeneratedObstacle[];
  streetLamps: GeneratedStreetLamp[];
  streets: { position: [number, number, number]; size: [number, number]; rotation: number }[];
}

// Seeded random number generator (Mulberry32)
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Simple 2D noise for variation
function noise2D(x: number, z: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Poisson disk sampling for natural distribution
function poissonDiskSampling(
  rng: SeededRandom,
  width: number,
  height: number,
  minDist: number,
  maxAttempts: number = 30
): [number, number][] {
  const cellSize = minDist / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (number | null)[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(null));

  const points: [number, number][] = [];
  const active: [number, number][] = [];

  // Start with a random point
  const startX = rng.range(0, width);
  const startZ = rng.range(0, height);
  const startPoint: [number, number] = [startX, startZ];
  points.push(startPoint);
  active.push(startPoint);

  const gridX = Math.floor(startX / cellSize);
  const gridZ = Math.floor(startZ / cellSize);
  if (gridX >= 0 && gridX < gridWidth && gridZ >= 0 && gridZ < gridHeight) {
    grid[gridX][gridZ] = 0;
  }

  while (active.length > 0 && points.length < 500) {
    const idx = Math.floor(rng.next() * active.length);
    const point = active[idx];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = rng.next() * Math.PI * 2;
      const dist = rng.range(minDist, minDist * 2);
      const newX = point[0] + Math.cos(angle) * dist;
      const newZ = point[1] + Math.sin(angle) * dist;

      if (newX < 0 || newX >= width || newZ < 0 || newZ >= height) continue;

      const newGridX = Math.floor(newX / cellSize);
      const newGridZ = Math.floor(newZ / cellSize);

      let valid = true;
      for (let dx = -2; dx <= 2 && valid; dx++) {
        for (let dz = -2; dz <= 2 && valid; dz++) {
          const checkX = newGridX + dx;
          const checkZ = newGridZ + dz;
          if (checkX >= 0 && checkX < gridWidth && checkZ >= 0 && checkZ < gridHeight) {
            const neighborIdx = grid[checkX][checkZ];
            if (neighborIdx !== null) {
              const neighbor = points[neighborIdx];
              const distSq = (newX - neighbor[0]) ** 2 + (newZ - neighbor[1]) ** 2;
              if (distSq < minDist * minDist) {
                valid = false;
              }
            }
          }
        }
      }

      if (valid) {
        const newPoint: [number, number] = [newX, newZ];
        points.push(newPoint);
        active.push(newPoint);
        if (newGridX >= 0 && newGridX < gridWidth && newGridZ >= 0 && newGridZ < gridHeight) {
          grid[newGridX][newGridZ] = points.length - 1;
        }
        found = true;
        break;
      }
    }

    if (!found) {
      active.splice(idx, 1);
    }
  }

  return points;
}

// Check if a point is on a street
function isOnStreet(
  x: number,
  z: number,
  blockSize: number,
  streetWidth: number,
  worldSize: number
): boolean {
  const halfWorld = worldSize / 2;
  const adjustedX = x + halfWorld;
  const adjustedZ = z + halfWorld;

  const modX = adjustedX % blockSize;
  const modZ = adjustedZ % blockSize;

  return modX < streetWidth || modZ < streetWidth;
}

// Building color palette (apocalyptic)
const BUILDING_COLORS = [
  '#262626', // Dark gray
  '#1f1f1f', // Almost black
  '#2d2d2d', // Medium gray
  '#1a1a1a', // Very dark
  '#333333', // Light gray
  '#2a2520', // Brown-gray
  '#252530', // Blue-gray
];

export function generateMap(config: MapConfig): GeneratedMap {
  const rng = new SeededRandom(config.seed);
  const halfWorld = config.worldSize / 2;

  const buildings: GeneratedBuilding[] = [];
  const trees: GeneratedTree[] = [];
  const obstacles: GeneratedObstacle[] = [];
  const streetLamps: GeneratedStreetLamp[] = [];
  const streets: { position: [number, number, number]; size: [number, number]; rotation: number }[] = [];

  // Generate street grid
  const numBlocks = Math.floor(config.worldSize / config.blockSize);

  for (let i = 0; i <= numBlocks; i++) {
    const pos = -halfWorld + i * config.blockSize;

    // Horizontal streets
    streets.push({
      position: [0, 0.01, pos + config.streetWidth / 2],
      size: [config.worldSize, config.streetWidth],
      rotation: 0,
    });

    // Vertical streets
    streets.push({
      position: [pos + config.streetWidth / 2, 0.01, 0],
      size: [config.streetWidth, config.worldSize],
      rotation: 0,
    });
  }

  // Generate buildings on each block
  for (let bx = 0; bx < numBlocks; bx++) {
    for (let bz = 0; bz < numBlocks; bz++) {
      const blockStartX = -halfWorld + bx * config.blockSize + config.streetWidth;
      const blockStartZ = -halfWorld + bz * config.blockSize + config.streetWidth;
      const blockInnerSize = config.blockSize - config.streetWidth;

      // Subdivide block into building plots
      const plotsPerSide = rng.int(1, 3);
      const plotSize = blockInnerSize / plotsPerSide;

      for (let px = 0; px < plotsPerSide; px++) {
        for (let pz = 0; pz < plotsPerSide; pz++) {
          if (!rng.chance(config.buildingDensity)) continue;

          const plotCenterX = blockStartX + px * plotSize + plotSize / 2;
          const plotCenterZ = blockStartZ + pz * plotSize + plotSize / 2;

          // Building size based on plot
          const variant = rng.pick(['small', 'medium', 'large', 'ruined'] as const);
          let width: number, height: number, depth: number;

          switch (variant) {
            case 'small':
              width = rng.range(3, 5);
              height = rng.range(2, 4);
              depth = rng.range(3, 5);
              break;
            case 'medium':
              width = rng.range(5, 8);
              height = rng.range(4, 7);
              depth = rng.range(5, 8);
              break;
            case 'large':
              width = rng.range(8, 12);
              height = rng.range(6, 10);
              depth = rng.range(8, 12);
              break;
            case 'ruined':
              width = rng.range(4, 8);
              height = rng.range(1, 3); // Shorter, collapsed
              depth = rng.range(4, 8);
              break;
          }

          // Ensure building fits in plot with some margin
          const maxDim = plotSize * 0.8;
          width = Math.min(width, maxDim);
          depth = Math.min(depth, maxDim);

          buildings.push({
            position: [plotCenterX, 0, plotCenterZ],
            size: [width, height, depth],
            color: rng.pick(BUILDING_COLORS),
            variant,
            rotation: rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]),
          });
        }
      }
    }
  }

  // Generate trees using Poisson disk sampling (avoiding streets)
  const treePoints = poissonDiskSampling(rng, config.worldSize, config.worldSize, 4);
  for (const [px, pz] of treePoints) {
    const x = px - halfWorld;
    const z = pz - halfWorld;

    if (isOnStreet(x, z, config.blockSize, config.streetWidth + 2, config.worldSize)) continue;
    if (!rng.chance(config.treeDensity)) continue;

    // Check not too close to buildings
    let tooClose = false;
    for (const b of buildings) {
      const dist = Math.sqrt((x - b.position[0]) ** 2 + (z - b.position[2]) ** 2);
      if (dist < Math.max(b.size[0], b.size[2]) / 2 + 2) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    trees.push({
      position: [x, 0, z],
      scale: rng.range(0.6, 1.4),
      variant: rng.pick(['dead', 'burnt', 'twisted']),
    });
  }

  // Generate obstacles on streets
  const obstaclePoints = poissonDiskSampling(rng, config.worldSize, config.worldSize, 6);
  for (const [px, pz] of obstaclePoints) {
    const x = px - halfWorld;
    const z = pz - halfWorld;

    // Only on or near streets
    if (!isOnStreet(x, z, config.blockSize, config.streetWidth + 1, config.worldSize)) continue;
    if (!rng.chance(config.obstacleDensity)) continue;

    obstacles.push({
      position: [x, 0, z],
      type: rng.pick(['car', 'debris', 'barricade', 'dumpster', 'barrel']),
      rotation: rng.range(0, Math.PI * 2),
      scale: rng.range(0.8, 1.2),
    });
  }

  // Generate street lamps along streets
  for (let i = 0; i <= numBlocks; i++) {
    const streetPos = -halfWorld + i * config.blockSize;

    // Lamps along vertical streets
    for (let j = 1; j < numBlocks; j++) {
      const lampZ = -halfWorld + j * config.blockSize - config.blockSize / 2;

      if (rng.chance(0.7)) {
        streetLamps.push({
          position: [streetPos + config.streetWidth + 0.5, 0, lampZ],
          rotation: -Math.PI / 2,
          working: rng.chance(0.3), // Most are broken
        });
      }

      if (rng.chance(0.7)) {
        streetLamps.push({
          position: [streetPos - 0.5, 0, lampZ],
          rotation: Math.PI / 2,
          working: rng.chance(0.3),
        });
      }
    }
  }

  return { buildings, trees, obstacles, streetLamps, streets };
}

// Default map configuration
export const DEFAULT_MAP_CONFIG: MapConfig = {
  seed: 12345,
  worldSize: 100,
  blockSize: 25,
  streetWidth: 6,
  buildingDensity: 0.7,
  treeDensity: 0.4,
  obstacleDensity: 0.3,
};
