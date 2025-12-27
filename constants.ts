
import { WeaponStats, PersistentData, PerkOption, CharacterConfig } from './types';

export const MOVEMENT_SPEED = 5;
export const ROTATION_SPEED = 10;
export const CAMERA_OFFSET = [10, 10, 10]; // Isometric-ish offset
export const CAMERA_ZOOM = 20;

export const COLORS = {
  grass: "#262626", // Slightly lighter dirt/dead grass
  road: "#1a1a1a", // Lighter asphalt
  curb: "#404040",
  skin: "#f5cba7",
  shirt: "#3b82f6",
  pants: "#1e3a8a",
  shoes: "#111827",
  treeLeaves: "#333333", 
  treeTrunk: "#3f3f46", 
  bullet: "#fbbf24",
  zombieSkin: "#5c7358", // Rotten green/grey
  zombieClothes: "#4b5563",
  demonSkin: "#991b1b", // Blood red
  crowSkin: "#0a0a0a", // Black
  healthPack: "#ef4444", // Red cross
  bone: "#a3a3a3" // Dusty bone
};

// --- Audio Paths ---
// Use Vite's base URL for proper path resolution on GitHub Pages
const BASE = import.meta.env.BASE_URL || '/';
export const SOUND_PATHS = {
  BGM: `${BASE}sounds/bgm1.mp3`,
  SHOOT: `${BASE}sounds/pistol_fire.wav`,
  SHOTGUN: `${BASE}sounds/shotgun_fire.wav`,
  HIT: `${BASE}sounds/enemy_hit.wav`,
  DEAD: `${BASE}sounds/enemy_dead.wav`,
  PLAYER_HIT_1: `${BASE}sounds/player_hit1.wav`,
  PLAYER_HIT_2: `${BASE}sounds/player_hit2.wav`,
  PLAYER_HIT_3: `${BASE}sounds/player_hit3.wav`
};

// --- Player Stats ---
export const MAX_HEALTH = 100;
export const ENEMY_DAMAGE = 15;
export const INVULNERABILITY_TIME = 1000; // ms
export const MONEY_PER_KILL = 10;

// --- Weapon Data ---

export const WEAPONS: Record<string, WeaponStats> = {
  PISTOL: {
    name: "Silver Enforcer",
    stance: "ONE_HANDED",
    maxAmmo: 12,
    damage: 40,
    fireRate: 250,
    reloadTime: 1200,
    projectileSpeed: 20,
    color: "#e2e8f0",
    pelletCount: 1,
    spread: 0,
    automatic: false,
    holdConfig: {
      twoHanded: false,
      rightArm: { x: -Math.PI / 2, y: -Math.PI / 12, z: 0 },
      rightForearm: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0, y: 0, z: 0 },
      leftForearm: { x: -0.1, y: 0, z: 0 },
      model: {
        pos: [0, -0.22, 0.05],
        rot: [21, 0, 0],
        scale: [1, 1, 1]
      }
    }
  },
  UZI: {
    name: "Micro Silencer",
    stance: "ONE_HANDED",
    maxAmmo: 20,
    damage: 26,
    fireRate: 50, // 20 rounds per second
    reloadTime: 900,
    projectileSpeed: 24,
    color: "#111111",
    pelletCount: 1,
    spread: 0.1, // Slight spray
    automatic: true,
    holdConfig: {
      twoHanded: false,
      rightArm: { x: -Math.PI / 2, y: -Math.PI / 10, z: 0 },
      rightForearm: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0, y: 0, z: 0 },
      leftForearm: { x: -0.1, y: 0, z: 0 },
      model: {
        pos: [0, -0.20, 0.08],
        rot: [21, 0, 0],
        scale: [0.9, 0.9, 0.9]
      }
    }
  },
  SHOTGUN: {
    name: "Demon Breaker",
    stance: "TWO_HANDED",
    maxAmmo: 6,
    damage: 22, // Per pellet
    fireRate: 900,
    reloadTime: 2200,
    projectileSpeed: 18,
    color: "#292524",
    pelletCount: 5,
    spread: 0.3,
    automatic: false,
    holdConfig: {
      twoHanded: true,
      rightArm: { x: -Math.PI / 2, y: -Math.PI / 6, z: 0 },
      rightForearm: { x: Math.PI / 6, y: 0, z: 0 },
      leftArm: { x: -Math.PI / 2, y: Math.PI / 3, z: 0 },
      leftForearm: { x: Math.PI / 12, y: 0, z: 0 },
      model: {
        pos: [0, -0.05, 0.1],
        rot: [-Math.PI/0.60, 0, 0],
        scale: [1.2, 1.2, 1.2]
      }
    }
  }
};

// Stats for levels 1, 2, 3
export const WEAPON_LEVEL_STATS: Record<string, { maxAmmo: number, damage: number, reloadTime: number }[]> = {
    PISTOL: [
        { maxAmmo: 12, damage: 40, reloadTime: 1200 },
        { maxAmmo: 20, damage: 60, reloadTime: 1000 },
        { maxAmmo: 32, damage: 85, reloadTime: 800 }
    ],
    UZI: [
        { maxAmmo: 20, damage: 26, reloadTime: 900 },
        { maxAmmo: 32, damage: 34, reloadTime: 800 },
        { maxAmmo: 50, damage: 42, reloadTime: 700 }
    ],
    SHOTGUN: [
        { maxAmmo: 6, damage: 22, reloadTime: 2200 },
        { maxAmmo: 10, damage: 32, reloadTime: 1900 },
        { maxAmmo: 16, damage: 45, reloadTime: 1500 }
    ]
};

export const CHARACTERS: Record<string, CharacterConfig> = {
  TOM: {
    id: 'TOM',
    name: 'Survivor Tom',
    description: 'Just trying to make it to dawn.',
    weapon: 'PISTOL',
    weaponName: 'Silver Enforcer',
    model: {
        skin: "#f5cba7",
        shirt: "#374151", // Grey shirt
        pants: "#1f2937", // Dark pants
        accessory: 'NONE'
    }
  },
  HANK: {
    id: 'HANK',
    name: 'Exorcist Hank',
    description: 'Here to clean up the town.',
    weapon: 'SHOTGUN',
    weaponName: 'Demon Breaker',
    model: {
        skin: "#e0ac69",
        shirt: "#000000", // Priest-ish black
        pants: "#000000",
        accessory: 'BEARD'
    }
  },
  QUADRINITY: {
    id: 'QUADRINITY',
    name: 'Quadrinity',
    description: 'She needs guns. Lots of guns.',
    weapon: 'UZI',
    weaponName: 'Micro Silencer',
    model: {
        skin: "#fef3c7", // Pale
        shirt: "#0f172a", // Dark latex/leather look
        pants: "#000000",
        accessory: 'SUNGLASSES',
        hairStyle: 'BOB',
        hairColor: '#0a0a0a'
    }
  }
};

export const PROJECTILE_TTL = 2000; // Time to live in ms

// --- Spawning & Difficulty ---
export const INITIAL_ENEMY_COUNT = 3;
export const MAX_ENEMIES_CAP = 40;
export const SPAWN_INTERVAL = 4000; 
export const POWERUP_INTERVAL = 30000; 
export const HEAL_AMOUNT = 50;

// --- Leveling System ---
export const BONE_RADIUS = 0.5;
export const BONE_EXP_VALUE = 20;
export const BASE_EXP_REQ = 100;
export const EXP_EXPONENT = 1.2; 

export const PERKS: PerkOption[] = [
  { id: 'p1', type: 'HEAL', label: 'First Aid', description: 'Heal 50% HP', rarity: 'COMMON', value: 0.5 },
  { id: 'p2', type: 'SPEED', label: 'Adrenaline', description: '+10% Speed', rarity: 'COMMON', value: 0.1 },
  { id: 'p3', type: 'DAMAGE', label: 'Silver Bullets', description: '+15% Damage', rarity: 'RARE', value: 0.15 },
  { id: 'p4', type: 'FIRE_RATE', label: 'Fast Hands', description: '+10% Fire Rate', rarity: 'RARE', value: 0.1 },
  { id: 'p5', type: 'MAX_HP', label: 'Thick Skin', description: '+20% Max HP', rarity: 'EPIC', value: 0.2 },
];

// --- Collision & World Data ---

export const PLAYER_RADIUS = 0.3;
export const ENEMY_RADIUS = 0.35;
export const POWERUP_RADIUS = 0.5;
export const TREE_COLLISION_RADIUS = 0.3;
export const ENEMY_ATTACK_RANGE_BUFFER = 0.4;

export interface BuildingData {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

export interface TreeData {
  position: [number, number, number];
  scale: number;
}

export const BUILDINGS: BuildingData[] = [
  { position: [-10, 0, 0], size: [6, 4, 6], color: "#262626" },
  { position: [-10, 0, 18], size: [5, 3, 5], color: "#404040" },
  { position: [12, 0, 20], size: [7, 5, 5], color: "#171717" },
  { position: [-12, 0, -12], size: [6, 6, 8], color: "#2d2d2d" },
];

export const TREES: TreeData[] = [];

// Generate street trees deterministically
for (let i = 0; i < 15; i++) {
    const zPos = i * 6 - 40;
    const scale1 = 0.8 + (Math.sin(i * 123) * 0.5 + 0.5) * 0.4;
    const scale2 = 0.8 + (Math.cos(i * 321) * 0.5 + 0.5) * 0.4;
    
    TREES.push({ position: [5, 0, zPos], scale: scale1 });
    TREES.push({ position: [-5, 0, zPos], scale: scale2 });
}

// Park trees (Dead Forest)
TREES.push({ position: [15, 0, -10], scale: 1.5 });
TREES.push({ position: [18, 0, -8], scale: 1.2 });
TREES.push({ position: [13, 0, -6], scale: 1.0 });
TREES.push({ position: [16, 0, -14], scale: 1.3 });
TREES.push({ position: [11, 0, -9], scale: 0.9 });

// --- Persistence & Upgrades ---

export const DEFAULT_SAVE_DATA: PersistentData = {
  totalCash: 0,
  upgrades: {
    healthLevel: 1,
    speedLevel: 1,
    damageLevel: 1,
    fireRateLevel: 1
  }
};

export const UPGRADE_CONFIG = {
  health: {
    base: 100,
    perLevel: 25,
    baseCost: 100,
    costMult: 1.5,
    name: "Max Health"
  },
  speed: {
    base: 5,
    perLevel: 0.5,
    baseCost: 150,
    costMult: 1.5,
    name: "Move Speed"
  },
  damage: {
    base: 35,
    perLevel: 10,
    baseCost: 200,
    costMult: 1.6,
    name: "Damage"
  },
  fireRate: {
    base: 250,
    perLevel: -20,
    min: 50,
    baseCost: 250,
    costMult: 1.7,
    name: "Fire Rate"
  }
};

export const getUpgradeCost = (baseCost: number, level: number, multiplier: number) => {
  return Math.floor(baseCost * Math.pow(multiplier, level - 1));
};
