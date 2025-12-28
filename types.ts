
export type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  reload: boolean;
  sprint: boolean;
};

export interface Position {
  x: number;
  y: number;
  z: number;
}

export type WeaponStance = 'ONE_HANDED' | 'TWO_HANDED';

export interface Rot3 {
  x: number;
  y: number;
  z: number;
}

export interface WeaponHoldConfig {
  twoHanded: boolean;
  rightArm: Rot3;
  rightForearm: Rot3;
  leftArm: Rot3;
  leftForearm: Rot3;
  model: {
    pos: [number, number, number];
    rot: [number, number, number];
    scale: [number, number, number];
  };
}

export interface WeaponStats {
  name: string;
  stance: WeaponStance;
  maxAmmo: number;
  damage: number;
  fireRate: number; // ms between shots
  reloadTime: number; // ms
  projectileSpeed: number;
  color: string;
  pelletCount?: number; // For shotgun
  spread?: number; // Spread variance
  automatic: boolean; // Full auto fire
  explosive?: boolean;
  explosionRadius?: number;
  arcing?: boolean; // New flag for grenade launcher physics
  holdConfig: WeaponHoldConfig;
}

export interface ProjectileData {
  id: string;
  position: [number, number, number];
  direction: [number, number, number]; // Used for linear
  velocity?: [number, number, number]; // Used for physics/arcing
  speed: number;
  damage: number;
  createdAt: number;
  isExplosive?: boolean;
  explosionRadius?: number;
  usePhysics?: boolean; // Toggle for gravity logic
}

export type EnemyType = 'ZOMBIE' | 'DEMON' | 'CROW';

export interface EnemyData {
  id: string;
  type: EnemyType;
  initialPosition: [number, number, number];
  maxHealth: number;
  currentHealth: number;
  speed: number;
}

export interface PowerUpData {
  id: string;
  position: [number, number, number];
  type: 'HEALTH';
  value: number;
}

export interface BoneData {
  id: string;
  position: [number, number, number];
  value: number;
  createdAt: number;
}

export type PerkType = 'HEAL' | 'SPEED' | 'DAMAGE' | 'FIRE_RATE' | 'MAX_HP' | 'WEAPON_UPGRADE';

export interface PerkOption {
  id: string;
  type: PerkType;
  label: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC';
  value: number; // e.g., 0.1 for 10%
}

export interface GameOptions {
  unlimitedCash: boolean;
  soundEnabled: boolean;
  characterId: string;
}

export interface GameStats {
  enemiesKilled: number;
  moneyEarned: number;
  moneySpent: number;
  timeSurvived: number;
  levelReached: number;
}

export interface UpgradeState {
  healthLevel: number;
  speedLevel: number;
  damageLevel: number;
  fireRateLevel: number;
}

export interface PersistentData {
  totalCash: number;
  upgrades: UpgradeState;
}

export interface PlayerStats {
  maxHealth: number;
  movementSpeed: number;
  damage: number;
  fireRate: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  weapon: string;
  weaponName: string; // Display name of starter weapon
  model: {
      skin: string;
      shirt: string;
      pants: string;
      accessory: 'NONE' | 'BEARD' | 'SUNGLASSES';
      hairStyle?: 'NONE' | 'BOB';
      hairColor?: string;
  }
}
