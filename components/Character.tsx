
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3, MathUtils, Plane, Object3D } from 'three';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { uiEvents } from './UI';
import { 
  COLORS, 
  BUILDINGS, 
  TREES, 
  PLAYER_RADIUS, 
  ENEMY_RADIUS, 
  TREE_COLLISION_RADIUS,
  WEAPONS,
  WEAPON_LEVEL_STATS,
  CHARACTERS, 
  PROJECTILE_TTL,
  ENEMY_DAMAGE,
  INVULNERABILITY_TIME,
  SPAWN_INTERVAL,
  POWERUP_INTERVAL,
  MAX_ENEMIES_CAP,
  INITIAL_ENEMY_COUNT,
  POWERUP_RADIUS,
  HEAL_AMOUNT,
  ENEMY_ATTACK_RANGE_BUFFER,
  MONEY_PER_KILL,
  SOUND_PATHS,
  BONE_RADIUS,
  BONE_EXP_VALUE,
  BASE_EXP_REQ,
  EXP_EXPONENT,
  PERKS
} from '../constants';
import { ProjectileData, EnemyData, PowerUpData, GameStats, GameOptions, PlayerStats, BoneData, PerkOption, CharacterConfig, EnemyType } from '../types';
import { audioManager } from '../utils/audioManager';

// Pre-allocate math objects to reduce GC
const AIM_PLANE = new Plane(new Vector3(0, 1, 0), -1.25);
const TARGET_VEC = new Vector3();
const CAM_FORWARD = new Vector3();
const CAM_RIGHT = new Vector3();
const UP_VEC = new Vector3(0, 1, 0);
const MOVE_DIR = new Vector3();
const PROJECTILE_POS = new Vector3();
const ENEMY_DIR = new Vector3();

// --- Internal Components ---

type EnemyPositionMap = Record<string, Vector3>;

const Bullet: React.FC<{ 
  data: ProjectileData, 
  onDelete: (id: string) => void,
  enemyPositionsRef: React.MutableRefObject<EnemyPositionMap>,
  onHitEnemy: (enemyId: string) => void,
  isPaused: boolean
}> = ({ data, onDelete, enemyPositionsRef, onHitEnemy, isPaused }) => {
  const ref = useRef<Group>(null);
  
  useFrame((state, delta) => {
    if (isPaused || !ref.current) return;
    
    // Check life
    const age = Date.now() - data.createdAt;
    if (age > PROJECTILE_TTL) {
      onDelete(data.id);
      return;
    }

    // Move
    const speed = data.speed * delta;
    ref.current.position.x += data.direction[0] * speed;
    ref.current.position.z += data.direction[2] * speed;

    // Check collision with environment
    const x = ref.current.position.x;
    const z = ref.current.position.z;

    // Check Trees
    for (const tree of TREES) {
       const dx = x - tree.position[0];
       const dz = z - tree.position[2];
       if (dx * dx + dz * dz < 0.25) { // Simple radius check
         onDelete(data.id);
         return;
       }
    }

    // Check Buildings
    for (const b of BUILDINGS) {
      const hw = b.size[0] / 2;
      const hd = b.size[2] / 2;
      if (x > b.position[0] - hw && x < b.position[0] + hw && 
          z > b.position[2] - hd && z < b.position[2] + hd) {
        onDelete(data.id);
        return;
      }
    }

    // Check Enemies
    if (enemyPositionsRef.current) {
      const enemies = enemyPositionsRef.current;
      for (const id in enemies) {
        const pos = enemies[id];
        const dx = x - pos.x;
        const dz = z - pos.z;
        const hitRadius = ENEMY_RADIUS + 0.1; // Slightly larger for gameplay feel
        
        if (dx*dx + dz*dz < hitRadius * hitRadius) {
          onHitEnemy(id);
          onDelete(data.id);
          return;
        }
      }
    }
  });

  return (
    <group ref={ref} position={data.position}>
      <mesh rotation={[0, Math.atan2(data.direction[0], data.direction[2]), 0]}>
        <sphereGeometry args={[0.08, 4, 4]} />
        <meshStandardMaterial color={COLORS.bullet} emissive={COLORS.bullet} emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

const Enemy: React.FC<{ 
  data: EnemyData, 
  playerRef: React.RefObject<Group | null>,
  positionMapRef: React.MutableRefObject<EnemyPositionMap>,
  onHitPlayer: () => void,
  isPaused: boolean
}> = ({ data, playerRef, positionMapRef, onHitPlayer, isPaused }) => {
  const group = useRef<Group>(null);
  const leftLimb = useRef<Group>(null);
  const rightLimb = useRef<Group>(null);
  const [animationTime, setAnimationTime] = useState(Math.random() * 100);

  useEffect(() => {
    if (!positionMapRef.current) positionMapRef.current = {};
    positionMapRef.current[data.id] = new Vector3(...data.initialPosition);
    return () => {
      if (positionMapRef.current) delete positionMapRef.current[data.id];
    };
  }, [data.id, data.initialPosition, positionMapRef]);

  useFrame((state, delta) => {
    if (isPaused || !group.current || !playerRef.current) return;
    const currentPos = group.current.position;
    const playerPos = playerRef.current.position;
    ENEMY_DIR.subVectors(playerPos, currentPos);
    ENEMY_DIR.y = 0;
    const distSq = ENEMY_DIR.lengthSq();
    const attackRange = PLAYER_RADIUS + ENEMY_RADIUS + ENEMY_ATTACK_RANGE_BUFFER; 

    if (distSq < attackRange * attackRange) onHitPlayer();

    if (distSq > 0.5) {
      ENEMY_DIR.normalize();
      const moveDist = data.speed * delta;
      group.current.position.addScaledVector(ENEMY_DIR, moveDist);
      group.current.lookAt(playerPos.x, group.current.position.y, playerPos.z);
      
      const newTime = animationTime + delta * (data.type === 'CROW' ? 15 : 8);
      setAnimationTime(newTime);
      
      // Animations
      if (data.type === 'CROW') {
          // Flapping wings
          if (leftLimb.current) leftLimb.current.rotation.z = Math.sin(newTime) * 0.5;
          if (rightLimb.current) rightLimb.current.rotation.z = -Math.sin(newTime) * 0.5;
          // Float up and down - Lowered from 2.0 to 1.5 for easier shotgun hits
          group.current.position.y = 1.5 + Math.sin(newTime * 0.5) * 0.2;
      } else {
          // Walking (Zombie/Demon)
          if (leftLimb.current) leftLimb.current.rotation.x = Math.sin(newTime) * 0.5;
          if (rightLimb.current) rightLimb.current.rotation.x = Math.sin(newTime + Math.PI) * 0.5;
          group.current.position.y = Math.abs(Math.sin(newTime * 2)) * 0.05;
      }
    }
    if (positionMapRef.current[data.id]) {
      positionMapRef.current[data.id].copy(group.current.position);
    } else {
        positionMapRef.current[data.id] = group.current.position.clone();
    }
  });

  const healthPercent = Math.max(0, data.currentHealth / data.maxHealth);

  const isZombie = data.type === 'ZOMBIE';
  const isDemon = data.type === 'DEMON';
  const isCrow = data.type === 'CROW';

  return (
    <group ref={group} position={data.initialPosition}>
       {/* Health Bar */}
       <group position={[0, isCrow ? 2.4 : 2.2, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[-0.5 + (0.98 * healthPercent) / 2, 0, 0.01]}>
             <planeGeometry args={[0.98 * healthPercent, 0.1]} />
             <meshBasicMaterial color={healthPercent > 0.5 ? "#ef4444" : "#7f1d1d"} />
          </mesh>
       </group>

       {/* --- CROW MODEL --- */}
       {isCrow && (
           <group position={[0, 0, 0]}>
               {/* Body */}
               <mesh castShadow>
                   <boxGeometry args={[0.3, 0.3, 0.3]} />
                   <meshStandardMaterial color={COLORS.crowSkin} />
               </mesh>
                {/* Wings */}
               <group position={[-0.2, 0, 0]} ref={leftLimb}>
                    <mesh position={[-0.4, 0, 0]} castShadow>
                        <boxGeometry args={[0.8, 0.05, 0.4]} />
                        <meshStandardMaterial color={COLORS.crowSkin} />
                    </mesh>
               </group>
               <group position={[0.2, 0, 0]} ref={rightLimb}>
                    <mesh position={[0.4, 0, 0]} castShadow>
                        <boxGeometry args={[0.8, 0.05, 0.4]} />
                        <meshStandardMaterial color={COLORS.crowSkin} />
                    </mesh>
               </group>
           </group>
       )}

       {/* --- ZOMBIE / DEMON MODEL --- */}
       {!isCrow && (
        <group position={[0, 0, 0]}>
          {/* Head */}
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial color={isDemon ? COLORS.demonSkin : COLORS.zombieSkin} />
          </mesh>
          
          {/* Demon Horns */}
          {isDemon && (
              <>
                <mesh position={[0.1, 1.65, 0.1]} rotation={[0.2, 0, -0.2]}>
                    <coneGeometry args={[0.05, 0.2, 8]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
                <mesh position={[-0.1, 1.65, 0.1]} rotation={[0.2, 0, 0.2]}>
                    <coneGeometry args={[0.05, 0.2, 8]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
              </>
          )}

          {/* Torso */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.5, 0.25]} />
            <meshStandardMaterial color={isDemon ? "#450a0a" : COLORS.zombieClothes} />
          </mesh>
          
          {/* Arms */}
          <group position={[0, 1.25, 0]}>
            <mesh position={[-0.28, -0.1, 0.2]} rotation={[isZombie ? -1.5 : 0, 0, 0]} castShadow>
                <boxGeometry args={[0.12, 0.5, 0.12]} />
                <meshStandardMaterial color={isDemon ? "#450a0a" : COLORS.zombieClothes} />
            </mesh>
            <mesh position={[0.28, -0.1, 0.2]} rotation={[isZombie ? -1.5 : 0, 0, 0]} castShadow>
                <boxGeometry args={[0.12, 0.5, 0.12]} />
                <meshStandardMaterial color={isDemon ? "#450a0a" : COLORS.zombieClothes} />
            </mesh>
          </group>

          {/* Legs */}
          <group position={[-0.1, 0.75, 0]} ref={leftLimb}>
            <mesh position={[0, -0.375, 0]} castShadow>
              <boxGeometry args={[0.15, 0.75, 0.15]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
          <group position={[0.1, 0.75, 0]} ref={rightLimb}>
            <mesh position={[0, -0.375, 0]} castShadow>
              <boxGeometry args={[0.15, 0.75, 0.15]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        </group>
       )}
    </group>
  );
};

const HealthPack: React.FC<{ data: PowerUpData, isPaused: boolean }> = ({ data, isPaused }) => {
    const ref = useRef<Group>(null);
    useFrame((state, delta) => {
        if (!isPaused && ref.current) {
            ref.current.rotation.y += delta;
            ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });
    return (
        <group ref={ref} position={data.position}>
             <mesh castShadow>
                 <boxGeometry args={[0.5, 0.5, 0.5]} />
                 <meshStandardMaterial color="white" />
             </mesh>
             <mesh position={[0, 0, 0.26]}>
                <boxGeometry args={[0.3, 0.1, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[0, 0, -0.26]}>
                <boxGeometry args={[0.3, 0.1, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[0.26, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[0.3, 0.1, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[-0.26, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[0, 0, 0.26]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
              <mesh position={[0, 0, -0.26]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[0.26, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
             <mesh position={[-0.26, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color={COLORS.healthPack} />
             </mesh>
        </group>
    )
}

const Bone: React.FC<{ data: BoneData, isPaused: boolean }> = ({ data, isPaused }) => {
    const ref = useRef<Group>(null);
    useFrame((state, delta) => {
        if (!isPaused && ref.current) {
            ref.current.rotation.y += delta * 2;
            ref.current.rotation.z += delta;
            ref.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3 + data.value) * 0.1;
        }
    });
    return (
        <group ref={ref} position={data.position}>
             <mesh castShadow>
                 <cylinderGeometry args={[0.05, 0.08, 0.4, 6]} />
                 <meshStandardMaterial color={COLORS.bone} />
             </mesh>
             <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color={COLORS.bone} />
             </mesh>
             <mesh position={[0, -0.2, 0]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color={COLORS.bone} />
             </mesh>
        </group>
    )
}

// --- Weapon Models & Flashlight ---

const GunFlashlight: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const target = useMemo(() => {
        const obj = new Object3D();
        obj.position.set(0, 0, 50); 
        return obj;
    }, []);

    return (
        <group position={position}>
            <mesh position={[0, 0, -0.04]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.025, 0.08]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 0, 0.001]}>
                <circleGeometry args={[0.018]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <primitive object={target} />
            <spotLight
                target={target}
                position={[0, 0, 0.01]}
                angle={0.6}
                penumbra={0.3}
                intensity={6}
                distance={40}
                castShadow
                color="#eef"
            />
        </group>
    )
}

const PistolModel: React.FC<{ muzzleRef: React.RefObject<Group | null> }> = ({ muzzleRef }) => {
    const metalColor = "#e2e8f0"; 
    const gripColor = "#0f172a"; 
    
    return (
        <group>
            <group rotation={[-0.15, 0, 0]} position={[0, -0.08, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.055, 0.14, 0.07]} />
                    <meshStandardMaterial color={gripColor} roughness={0.9} />
                </mesh>
            </group>
            <mesh position={[0, 0.06, 0.06]} castShadow>
                 <boxGeometry args={[0.06, 0.065, 0.26]} />
                 <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.2} />
            </mesh>
             <mesh position={[0, 0.06, 0.28]} ref={muzzleRef} />
             <GunFlashlight position={[0, -0.01, 0.22]} />
        </group>
    )
}

const UziModel: React.FC<{ muzzleRef: React.RefObject<Group | null> }> = ({ muzzleRef }) => {
    return (
        <group>
            {/* Grip */}
            <mesh position={[0, -0.08, -0.05]} castShadow>
                <boxGeometry args={[0.06, 0.15, 0.08]} />
                <meshStandardMaterial color="#111" />
            </mesh>
             {/* Magazine (sticking out) */}
            <mesh position={[0, -0.15, -0.05]} castShadow>
                <boxGeometry args={[0.04, 0.15, 0.06]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0.02, 0]} castShadow>
                 <boxGeometry args={[0.08, 0.12, 0.3]} />
                 <meshStandardMaterial color="#222" metalness={0.5} />
            </mesh>
             {/* Suppressor */}
            <mesh position={[0, 0.02, 0.25]} rotation={[Math.PI/2, 0, 0]} castShadow>
                 <cylinderGeometry args={[0.03, 0.03, 0.25]} />
                 <meshStandardMaterial color="#050505" metalness={0.2} roughness={0.8} />
            </mesh>
             <mesh position={[0, 0.02, 0.4]} ref={muzzleRef} />
             <GunFlashlight position={[0.05, 0.02, 0.15]} />
        </group>
    )
}

const ShotgunModel: React.FC<{ muzzleRef: React.RefObject<Group | null> }> = ({ muzzleRef }) => {
    return (
        <group>
            <mesh position={[0, -0.05, -0.2]} rotation={[-Math.PI/12, 0, 0]} castShadow>
                <boxGeometry args={[0.08, 0.1, 0.35]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh position={[0, 0, 0.1]} castShadow>
                <boxGeometry args={[0.08, 0.08, 0.25]} />
                <meshStandardMaterial color="#292524" />
            </mesh>
            {/* Shortened Barrel */}
            <mesh position={[0, 0.02, 0.35]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 0.35]} />
                <meshStandardMaterial color="#111" />
            </mesh>
             {/* Shortened Pump */}
             <mesh position={[0, -0.02, 0.30]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.2]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>
            <group position={[0, 0.02, 0.55]} ref={muzzleRef} />
            <GunFlashlight position={[0, -0.045, 0.45]} />
        </group>
    )
}

// --- Main Character Component ---

interface CharacterProps {
  onGameOver: (stats: GameStats) => void;
  options: GameOptions;
  playerStats: PlayerStats;
  isPaused: boolean;
}

export const Character: React.FC<CharacterProps> = ({ onGameOver, options, playerStats, isPaused }) => {
  const group = useRef<Group>(null);
  const controls = useKeyboardControls();
  const { camera, gl } = useThree();
  
  // Resolve Character Config
  const characterConfig = useMemo(() => {
    return CHARACTERS[options.characterId] || CHARACTERS.TOM;
  }, [options.characterId]);
  
  // Weapon Level State
  const [weaponLevel, setWeaponLevel] = useState(1);

  // Resolve Weapon Config with Dynamic Scaling
  const weaponConfig = useMemo(() => {
     const base = WEAPONS[characterConfig.weapon] || WEAPONS.PISTOL;
     const levelStats = WEAPON_LEVEL_STATS[characterConfig.weapon];
     if (!levelStats) return base;
     // weaponLevel is 1-based, array is 0-based
     const currentStats = levelStats[weaponLevel - 1];
     if (!currentStats) return base;
     return { ...base, ...currentStats };
  }, [characterConfig, weaponLevel]);

  // Animation refs
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftForearm = useRef<Group>(null);
  const rightForearm = useRef<Group>(null);
  const muzzleRef = useRef<Group>(null);
  
  const [animationTime, setAnimationTime] = useState(0);

  // Weapon State
  const [ammo, setAmmo] = useState(weaponConfig.maxAmmo);
  const [isReloading, setIsReloading] = useState(false);
  const lastShotTime = useRef(0);
  const aimTarget = useRef(new Vector3()); 
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const isMouseDown = useRef(false);

  // Health & Money State
  const [health, setHealth] = useState(playerStats.maxHealth);
  const [money, setMoney] = useState(options.unlimitedCash ? 9999999 : 0);
  const lastHitTime = useRef(0);
  const [powerUps, setPowerUps] = useState<PowerUpData[]>([]);
  const [bones, setBones] = useState<BoneData[]>([]);
  
  // Leveling State
  const [level, setLevel] = useState(1);
  const [currentExp, setCurrentExp] = useState(0);
  const [expToNextLevel, setExpToNextLevel] = useState(BASE_EXP_REQ);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  
  // Run Modifiers (Perks)
  const [statModifiers, setStatModifiers] = useState({
      speed: 1.0,
      damage: 1.0,
      fireRate: 1.0, 
      maxHp: 1.0
  });

  // Derived effective stats
  const effectiveMaxHealth = Math.floor(playerStats.maxHealth * statModifiers.maxHp);
  const effectiveSpeed = playerStats.movementSpeed * statModifiers.speed;
  const baseWeaponDamage = weaponConfig.damage;
  const damageMultiplier = (playerStats.damage / WEAPONS.PISTOL.damage); 
  const finalDamage = baseWeaponDamage * damageMultiplier * statModifiers.damage;

  const baseFireRate = weaponConfig.fireRate;
  const fireRateRatio = WEAPONS.PISTOL.fireRate / playerStats.fireRate; 
  const finalFireRate = (baseFireRate / fireRateRatio) / statModifiers.fireRate;

  // Statistics Tracking
  const enemiesKilledRef = useRef(0);
  const moneyEarnedRef = useRef(options.unlimitedCash ? 9999999 : 0);

  // Enemy State
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const enemyPositionsRef = useRef<EnemyPositionMap>({});
  const gameStartTime = useRef(Date.now());
  const lastSpawnTime = useRef(0);
  const lastPowerUpTime = useRef(0);

  // Time handling for pause
  const isPausedRef = useRef(isPaused);
  const pauseStartTime = useRef(0);

  const isGameFrozen = isPaused || isLevelingUp;

  // Handle pause time shifting
  useEffect(() => {
    if (isGameFrozen && !isPausedRef.current) {
        pauseStartTime.current = Date.now();
    } else if (!isGameFrozen && isPausedRef.current) {
        const duration = Date.now() - pauseStartTime.current;
        gameStartTime.current += duration;
        lastSpawnTime.current += duration;
        lastPowerUpTime.current += duration;
        lastHitTime.current += duration;
        lastShotTime.current += duration;
        setProjectiles(prev => prev.map(p => ({ ...p, createdAt: p.createdAt + duration })));
        setBones(prev => prev.map(b => ({ ...b, createdAt: b.createdAt + duration })));
    }
    isPausedRef.current = isGameFrozen;
  }, [isGameFrozen]);


  useEffect(() => {
    Object.values(SOUND_PATHS).forEach(path => audioManager.load(path));
  }, []);

  useEffect(() => {
    audioManager.setMute(!options.soundEnabled);
  }, [options.soundEnabled]);

  const createEnemy = (forcedType?: EnemyType): EnemyData => {
    const pos = getValidSpawnPosition();
    const rand = Math.random();
    // Default to Zombie
    let type: EnemyType = 'ZOMBIE';
    let speed = 2.5;
    let hp = 100;

    // Difficulty scaling
    const minutes = (Date.now() - gameStartTime.current) / 60000;

    if (rand > 0.8 || minutes > 2) {
        type = 'DEMON';
        speed = 4.5 + (minutes * 0.2);
        hp = 80;
    } 
    if (rand > 0.9 || minutes > 4) {
        type = 'CROW';
        speed = 6.0;
        hp = 30;
    }
    if (forcedType) type = forcedType;

    return {
        id: Math.random().toString(36),
        type,
        initialPosition: [pos.x, pos.y, pos.z],
        currentHealth: hp,
        maxHealth: hp,
        speed: speed + Math.random()
    };
  }

  useEffect(() => {
    const initialEnemies: EnemyData[] = [];
    for(let i=0; i<INITIAL_ENEMY_COUNT; i++) {
        initialEnemies.push(createEnemy('ZOMBIE'));
    }
    setEnemies(initialEnemies);
  }, []);

  useEffect(() => {
    uiEvents.dispatchEvent(new CustomEvent('ammoChange', { detail: { current: ammo, max: weaponConfig.maxAmmo } }));
    uiEvents.dispatchEvent(new CustomEvent('reloadState', { detail: { isReloading } }));
    uiEvents.dispatchEvent(new CustomEvent('healthChange', { detail: { health, maxHealth: effectiveMaxHealth } }));
    uiEvents.dispatchEvent(new CustomEvent('waveChange', { detail: { wave: enemies.length } }));
    uiEvents.dispatchEvent(new CustomEvent('moneyChange', { detail: { money } }));
    uiEvents.dispatchEvent(new CustomEvent('expChange', { detail: { current: currentExp, max: expToNextLevel, level } }));
  }, [ammo, isReloading, health, enemies.length, money, effectiveMaxHealth, currentExp, expToNextLevel, level, weaponConfig]);

  useEffect(() => {
      const handlePerkSelection = (e: any) => {
          const perk: PerkOption = e.detail.perk;
          
          if (perk.type === 'WEAPON_UPGRADE') {
              setWeaponLevel(prev => {
                  const nextLevel = prev + 1;
                  // Refill ammo on upgrade (and apply new max via weaponConfig update cycle)
                  const stats = WEAPON_LEVEL_STATS[characterConfig.weapon][nextLevel - 1];
                  setAmmo(stats.maxAmmo);
                  return nextLevel;
              });
          } else {
              setStatModifiers(prev => {
                  const next = { ...prev };
                  switch(perk.type) {
                      case 'SPEED': next.speed += perk.value; break;
                      case 'DAMAGE': next.damage += perk.value; break;
                      case 'FIRE_RATE': next.fireRate += perk.value; break;
                      case 'MAX_HP': 
                          next.maxHp += perk.value; 
                          setHealth(h => h + (effectiveMaxHealth * perk.value));
                          break;
                      case 'HEAL':
                          setHealth(h => Math.min(effectiveMaxHealth, h + (effectiveMaxHealth * perk.value)));
                          break;
                  }
                  return next;
              });
          }
          setIsLevelingUp(false);
      };

      uiEvents.addEventListener('selectPerk', handlePerkSelection);
      return () => {
          uiEvents.removeEventListener('selectPerk', handlePerkSelection);
      }
  }, [effectiveMaxHealth, characterConfig.weapon]);

  const shoot = () => {
    if (health <= 0) return;
    const now = Date.now();
    if (isReloading) return;
    
    if (now - lastShotTime.current < finalFireRate) return;
    
    if (ammo <= 0) {
        reload();
        return;
    }

    lastShotTime.current = now;
    setAmmo(prev => prev - 1);

    const soundPath = weaponConfig.stance === 'TWO_HANDED' ? SOUND_PATHS.SHOTGUN : SOUND_PATHS.SHOOT;
    audioManager.playSFX(soundPath, 0.4);

    let spawnX = 0, spawnY = 0, spawnZ = 0;
    if (muzzleRef.current) {
        muzzleRef.current.getWorldPosition(PROJECTILE_POS);
        spawnX = PROJECTILE_POS.x;
        spawnY = PROJECTILE_POS.y;
        spawnZ = PROJECTILE_POS.z;
    } else if (group.current) {
        spawnX = group.current.position.x;
        spawnY = group.current.position.y + 1.2;
        spawnZ = group.current.position.z;
    }

    const dirX = aimTarget.current.x - spawnX;
    const dirZ = aimTarget.current.z - spawnZ;
    const angle = Math.atan2(dirZ, dirX);

    const pellets = weaponConfig.pelletCount || 1;
    const spread = weaponConfig.spread || 0;

    const newProjectiles: ProjectileData[] = [];

    for(let i=0; i<pellets; i++) {
        const spreadAngle = (Math.random() - 0.5) * spread; // Radians
        const finalAngle = angle + spreadAngle;
        const normX = Math.cos(finalAngle);
        const normZ = Math.sin(finalAngle);

        newProjectiles.push({
            id: Math.random().toString(36),
            position: [spawnX, spawnY, spawnZ],
            direction: [normX, 0, normZ], 
            speed: weaponConfig.projectileSpeed,
            damage: finalDamage, 
            createdAt: now
        });
    }

    setProjectiles(prev => [...prev, ...newProjectiles]);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        isMouseDown.current = true;
        // Immediate shot for responsiveness, rate limited inside shoot()
        if (!isGameFrozen) shoot();
    }
    const handleMouseUp = () => {
        isMouseDown.current = false;
    }
    const handleMouseLeave = () => {
        isMouseDown.current = false;
    }

    gl.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
        gl.domElement.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [ammo, isReloading, projectiles, health, finalDamage, finalFireRate, enemies, isGameFrozen, weaponConfig]);

  const isPositionValid = (x: number, z: number) => {
      for (const b of BUILDINGS) {
        const hw = b.size[0] / 2 + 1;
        const hd = b.size[2] / 2 + 1;
        if (x > b.position[0] - hw && x < b.position[0] + hw && 
            z > b.position[2] - hd && z < b.position[2] + hd) {
          return false;
        }
      }
      return true;
  }

  const getValidSpawnPosition = (): Vector3 => {
      let tries = 0;
      while (tries < 50) {
          const range = 45;
          const x = (Math.random() - 0.5) * range;
          const z = (Math.random() - 0.5) * range;
          if (isPositionValid(x, z)) {
              if (x*x + z*z > 144) return new Vector3(x, 0, z); // Keep away from center
          }
          tries++;
      }
      return new Vector3(20, 0, 20);
  }

  const reload = () => {
      if (isReloading || ammo === weaponConfig.maxAmmo) return;
      setIsReloading(true);
      setTimeout(() => {
          setAmmo(weaponConfig.maxAmmo);
          setIsReloading(false);
      }, weaponConfig.reloadTime);
  }

  useEffect(() => {
      if (controls.reload && !isGameFrozen) reload();
  }, [controls.reload, isGameFrozen]);

  const removeProjectile = (id: string) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  const handleHitEnemy = (enemyId: string) => {
    const targetEnemy = enemies.find(e => e.id === enemyId);
    let dead = false;
    let enemyPos = new Vector3();

    if (enemyPositionsRef.current[enemyId]) {
        enemyPos.copy(enemyPositionsRef.current[enemyId]);
    }

    if (targetEnemy) {
        const willDie = targetEnemy.currentHealth - finalDamage <= 0;
        if (willDie) {
           audioManager.playSFX(SOUND_PATHS.DEAD, 0.5);
           dead = true;
        } else {
           audioManager.playSFX(SOUND_PATHS.HIT, 0.4);
        }
    }

    if (dead) {
        setBones(prev => [...prev, {
            id: Math.random().toString(36),
            position: [enemyPos.x, 0.2, enemyPos.z],
            value: BONE_EXP_VALUE,
            createdAt: Date.now()
        }]);

        enemiesKilledRef.current += 1;
        const earned = MONEY_PER_KILL;
        moneyEarnedRef.current += earned;
        setTimeout(() => setMoney(m => m + earned), 0);
    }

    setEnemies(prev => {
       return prev.map(e => {
           if (e.id === enemyId) {
               return { ...e, currentHealth: e.currentHealth - finalDamage };
           }
           return e;
       }).filter(e => e.currentHealth > 0);
    });
  };

  const handlePlayerHit = () => {
      const now = Date.now();
      if (now - lastHitTime.current < INVULNERABILITY_TIME && health > 0) return;
      
      const hitSounds = [SOUND_PATHS.PLAYER_HIT_1, SOUND_PATHS.PLAYER_HIT_2, SOUND_PATHS.PLAYER_HIT_3];
      const randomSound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
      audioManager.playSFX(randomSound, 0.8);

      lastHitTime.current = now;
      setHealth(prev => {
          const newHealth = prev - ENEMY_DAMAGE;
          if (newHealth <= 0) {
              const survivedSeconds = Math.floor((now - gameStartTime.current) / 1000);
              onGameOver({
                enemiesKilled: enemiesKilledRef.current,
                moneyEarned: moneyEarnedRef.current,
                moneySpent: 0, 
                timeSurvived: survivedSeconds,
                levelReached: level
              });
              return 0;
          }
          return newHealth;
      });
  };

  const triggerLevelUp = (overflowExp: number) => {
      setIsLevelingUp(true);
      const nextLevel = level + 1;
      const nextReq = Math.floor(BASE_EXP_REQ * Math.pow(nextLevel, EXP_EXPONENT));
      setLevel(nextLevel);
      setCurrentExp(overflowExp);
      setExpToNextLevel(nextReq);

      const options: PerkOption[] = [];
      const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
      
      // Determine max weapon level for this character's weapon
      const weaponStats = WEAPON_LEVEL_STATS[characterConfig.weapon];
      const maxWeaponLevel = weaponStats ? weaponStats.length : 1;
      
      // Force Weapon Upgrade if available
      let startIdx = 0;
      if (weaponLevel < maxWeaponLevel) {
          const nextLevel = weaponLevel + 1;
          const nextStats = weaponStats[nextLevel - 1]; // 0-indexed
          options.push({
              id: 'weapon-upgrade',
              type: 'WEAPON_UPGRADE',
              label: `${weaponConfig.name} MK II`,
              description: `Upgrade to Level ${nextLevel}.\nAmmo: ${nextStats.maxAmmo}, Dmg: ${nextStats.damage}, Reload: ${nextStats.reloadTime}ms`,
              rarity: 'EPIC',
              value: 1
          });
          startIdx = 0; // We still need 2 more perks
      } else {
          // If maxed out, add a random perk first
          const base = shuffled[0];
          options.push({ ...base, id: Math.random().toString(36) });
          startIdx = 1;
      }
      
      // Fill the rest
      for(let i = startIdx; i < startIdx + 2; i++) {
          // Use modulus to cycle through perks if we run out (unlikely with just 5)
          const base = shuffled[i % shuffled.length];
          // Ensure we don't add duplicate perks if the forced random one was the same
          options.push({ ...base, id: Math.random().toString(36) }); 
      }
      
      // Keep options at size 3
      while(options.length > 3) options.pop();
      
      uiEvents.dispatchEvent(new CustomEvent('showLevelUp', { detail: { options } }));
  };

  const isColliding = (x: number, z: number): boolean => {
    for (const tree of TREES) {
      const dx = x - tree.position[0];
      const dz = z - tree.position[2];
      const distSq = dx * dx + dz * dz;
      const minDist = PLAYER_RADIUS + TREE_COLLISION_RADIUS;
      if (distSq < minDist * minDist) return true;
    }
    for (const b of BUILDINGS) {
       const hw = b.size[0] / 2;
       const hd = b.size[2] / 2;
       const minX = b.position[0] - hw - PLAYER_RADIUS;
       const maxX = b.position[0] + hw + PLAYER_RADIUS;
       const minZ = b.position[2] - hd - PLAYER_RADIUS;
       const maxZ = b.position[2] + hd + PLAYER_RADIUS;
       if (x > minX && x < maxX && z > minZ && z < maxZ) return true;
    }
    return false;
  };

  useFrame((state, delta) => {
    if (isGameFrozen || !group.current) return;
    const now = Date.now();

    // Automatic Firing
    if (isMouseDown.current && weaponConfig.automatic) {
        shoot();
    }

    // Spawning Logic
    if (now - lastSpawnTime.current > SPAWN_INTERVAL) {
        if (enemies.length < MAX_ENEMIES_CAP) {
            const elapsedMins = (now - gameStartTime.current) / 60000;
            const spawnCount = Math.min(6, Math.floor(1 + elapsedMins * 2));
            const newEnemies: EnemyData[] = [];
            for(let i=0; i<spawnCount; i++) {
                 if (enemies.length + newEnemies.length >= MAX_ENEMIES_CAP) break;
                 newEnemies.push(createEnemy());
            }
            setEnemies(prev => [...prev, ...newEnemies]);
        }
        lastSpawnTime.current = now;
    }

    if (now - lastPowerUpTime.current > POWERUP_INTERVAL) {
        const pos = getValidSpawnPosition();
        setPowerUps(prev => [...prev, {
            id: Math.random().toString(36),
            position: [pos.x, 0.5, pos.z],
            type: 'HEALTH',
            value: HEAL_AMOUNT
        }]);
        lastPowerUpTime.current = now;
    }

    const playerX = group.current.position.x;
    const playerZ = group.current.position.z;
    
    // Pickups
    if (powerUps.length > 0) {
        const pickUpRange = PLAYER_RADIUS + POWERUP_RADIUS;
        let collected = false;
        const remainingPowerUps = powerUps.filter(p => {
            const dx = playerX - p.position[0];
            const dz = playerZ - p.position[2];
            if (dx*dx + dz*dz < pickUpRange * pickUpRange) {
                if (health < effectiveMaxHealth) {
                    setHealth(h => Math.min(effectiveMaxHealth, h + p.value));
                    collected = true;
                    return false;
                }
            }
            return true;
        });
        if (collected) setPowerUps(remainingPowerUps);
    }

    if (bones.length > 0) {
        const pickUpRange = PLAYER_RADIUS + BONE_RADIUS;
        let expGain = 0;
        const remainingBones = bones.filter(b => {
            const dx = playerX - b.position[0];
            const dz = playerZ - b.position[2];
            if (dx*dx + dz*dz < pickUpRange * pickUpRange) {
                expGain += b.value;
                return false;
            }
            return true;
        });
        
        if (expGain > 0) {
            setBones(remainingBones);
            let nextExp = currentExp + expGain;
            if (nextExp >= expToNextLevel) {
                const overflow = nextExp - expToNextLevel;
                triggerLevelUp(overflow);
            } else {
                setCurrentExp(nextExp);
            }
        }
    }

    // Aiming
    state.raycaster.setFromCamera(state.pointer, state.camera);
    state.raycaster.ray.intersectPlane(AIM_PLANE, TARGET_VEC);
    aimTarget.current.copy(TARGET_VEC);
    const lookTargetX = TARGET_VEC.x;
    const lookTargetZ = TARGET_VEC.z;
    group.current.lookAt(lookTargetX, group.current.position.y, lookTargetZ);

    // Movement
    MOVE_DIR.set(0, 0, 0);
    camera.getWorldDirection(CAM_FORWARD);
    CAM_FORWARD.y = 0;
    CAM_FORWARD.normalize();
    CAM_RIGHT.crossVectors(CAM_FORWARD, UP_VEC).normalize();

    if (controls.forward) MOVE_DIR.add(CAM_FORWARD);
    if (controls.backward) MOVE_DIR.sub(CAM_FORWARD);
    if (controls.right) MOVE_DIR.add(CAM_RIGHT);
    if (controls.left) MOVE_DIR.sub(CAM_RIGHT);

    if (MOVE_DIR.lengthSq() > 0) MOVE_DIR.normalize();

    const isMoving = MOVE_DIR.lengthSq() > 0.001;
    
    if (isMoving) {
      const moveDistance = effectiveSpeed * delta;
      const currentX = group.current.position.x;
      const currentZ = group.current.position.z;
      const nextX = currentX + MOVE_DIR.x * moveDistance;
      const nextZ = currentZ + MOVE_DIR.z * moveDistance;

      if (!isColliding(nextX, currentZ)) group.current.position.x = nextX;
      if (!isColliding(group.current.position.x, nextZ)) group.current.position.z = nextZ;
    }

    // Camera follow
    const offset = new Vector3(8, 12, 8); 
    const cameraTargetPos = group.current.position.clone().add(offset);
    camera.position.lerp(cameraTargetPos, 0.1);
    camera.lookAt(group.current.position);
    
    // NOTE: Removed global spotLight logic here to use weapon-mounted lights

    const speedMult = isMoving ? 10 : 2; 
    const newTime = animationTime + delta * speedMult;
    setAnimationTime(newTime);
    const legAmplitude = 0.5;

    // --- Leg Animation ---
    if (leftLeg.current) leftLeg.current.rotation.x = isMoving ? Math.sin(newTime) * legAmplitude : MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.2);
    if (rightLeg.current) rightLeg.current.rotation.x = isMoving ? Math.sin(newTime + Math.PI) * legAmplitude : MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.2);
    group.current.position.y = isMoving ? Math.abs(Math.sin(newTime * 2)) * 0.1 : 0;

    // --- Arm Animation System (Config Driven) ---
    if (rightArm.current && rightForearm.current && leftArm.current && leftForearm.current) {
        
        const aimBob = Math.sin(newTime * 0.5) * 0.05;
        const config = weaponConfig.holdConfig;

        // Use YXZ to make lateral/vertical aiming simpler
        rightArm.current.rotation.order = 'YXZ';
        leftArm.current.rotation.order = 'YXZ';
        rightForearm.current.rotation.order = 'YXZ';
        leftForearm.current.rotation.order = 'YXZ';

        // Right Arm (Dominant/Trigger Hand) Targets
        const rShoulderY = config.rightArm.y + aimBob;
        const rShoulderX = config.rightArm.x;
        const rShoulderZ = config.rightArm.z;
        const rForearmX = config.rightForearm.x;
        
        // Left Arm (Support/Swing Hand) Targets
        let lShoulderX = config.leftArm.x;
        let lShoulderY = config.leftArm.y;
        let lShoulderZ = config.leftArm.z;
        let lForearmX = config.leftForearm.x;

        if (!config.twoHanded) {
             // Apply walking swing if not holding weapon with two hands
             const swing = isMoving ? Math.sin(newTime + Math.PI) * 0.5 : 0;
             lShoulderX += swing;
        }

        // Apply Lerps for smooth stance switching
        const lerpSpeed = 0.15;
        
        rightArm.current.rotation.x = MathUtils.lerp(rightArm.current.rotation.x, rShoulderX, lerpSpeed);
        rightArm.current.rotation.y = MathUtils.lerp(rightArm.current.rotation.y, rShoulderY, lerpSpeed);
        rightArm.current.rotation.z = MathUtils.lerp(rightArm.current.rotation.z, rShoulderZ, lerpSpeed);
        rightForearm.current.rotation.x = MathUtils.lerp(rightForearm.current.rotation.x, rForearmX, lerpSpeed);

        leftArm.current.rotation.x = MathUtils.lerp(leftArm.current.rotation.x, lShoulderX, lerpSpeed);
        leftArm.current.rotation.y = MathUtils.lerp(leftArm.current.rotation.y, lShoulderY, lerpSpeed);
        leftArm.current.rotation.z = MathUtils.lerp(leftArm.current.rotation.z, lShoulderZ, lerpSpeed);
        leftForearm.current.rotation.x = MathUtils.lerp(leftForearm.current.rotation.x, lForearmX, lerpSpeed);
    }
  });

  const modelColors = characterConfig.model;
  // Determine which weapon model component to use
  let CurrentWeaponModel = PistolModel;
  if (characterConfig.weapon === 'SHOTGUN') CurrentWeaponModel = ShotgunModel;
  if (characterConfig.weapon === 'UZI') CurrentWeaponModel = UziModel;
  
  const modelTransform = weaponConfig.holdConfig.model;

  return (
    <>
      <group ref={group} dispose={null}>
        {/* Flashlight removed from head to be on guns */}

        <group position={[0, 0, 0]}> {/* Adjusted from 0.75 to 0 to fix floating */}
          {/* Head */}
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial color={modelColors.skin} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <boxGeometry args={[0.37, 0.15, 0.37]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          {/* Beard Accessory */}
          {modelColors.accessory === 'BEARD' && (
              <mesh position={[0, 1.35, 0.18]} castShadow>
                  <boxGeometry args={[0.36, 0.15, 0.05]} />
                  <meshStandardMaterial color="#222" />
              </mesh>
          )}

          {/* Sunglasses Accessory */}
          {modelColors.accessory === 'SUNGLASSES' && (
              <group position={[0, 1.48, 0.18]}>
                  {/* Lenses */}
                  <mesh position={[0.08, 0, 0]}>
                      <boxGeometry args={[0.12, 0.05, 0.02]} />
                      <meshStandardMaterial color="#000" roughness={0.1} metalness={0.8} />
                  </mesh>
                  <mesh position={[-0.08, 0, 0]}>
                      <boxGeometry args={[0.12, 0.05, 0.02]} />
                      <meshStandardMaterial color="#000" roughness={0.1} metalness={0.8} />
                  </mesh>
                  {/* Bridge */}
                   <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[0.04, 0.01, 0.02]} />
                      <meshStandardMaterial color="#111" />
                  </mesh>
              </group>
          )}
          
          {/* Hair Style: Bob */}
          {modelColors.hairStyle === 'BOB' && (
              <group position={[0, 1.55, 0]}>
                   {/* Top */}
                   <mesh position={[0, 0.1, 0]} castShadow>
                        <boxGeometry args={[0.38, 0.15, 0.38]} />
                        <meshStandardMaterial color={modelColors.hairColor || '#000'} />
                   </mesh>
                   {/* Back */}
                   <mesh position={[0, -0.1, -0.15]} castShadow>
                        <boxGeometry args={[0.38, 0.4, 0.1]} />
                        <meshStandardMaterial color={modelColors.hairColor || '#000'} />
                   </mesh>
                   {/* Sides */}
                   <mesh position={[0.16, -0.05, 0]} castShadow>
                        <boxGeometry args={[0.06, 0.3, 0.38]} />
                        <meshStandardMaterial color={modelColors.hairColor || '#000'} />
                   </mesh>
                   <mesh position={[-0.16, -0.05, 0]} castShadow>
                        <boxGeometry args={[0.06, 0.3, 0.38]} />
                        <meshStandardMaterial color={modelColors.hairColor || '#000'} />
                   </mesh>
              </group>
          )}

          {/* Torso */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.5, 0.25]} />
            <meshStandardMaterial color={modelColors.shirt} />
          </mesh>

          {/* Left Arm (Split) */}
          <group position={[-0.28, 1.2, 0]} ref={leftArm}>
            {/* Upper Arm */}
            <mesh position={[0, -0.125, 0]} castShadow>
              <boxGeometry args={[0.12, 0.25, 0.12]} />
              <meshStandardMaterial color={modelColors.shirt} />
            </mesh>
            {/* Forearm Group */}
            <group position={[0, -0.25, 0]} ref={leftForearm}>
                <mesh position={[0, -0.125, 0]} castShadow>
                  <boxGeometry args={[0.12, 0.25, 0.12]} />
                  <meshStandardMaterial color={modelColors.shirt} />
                </mesh>
                {/* Hand */}
                <mesh position={[0, -0.25, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                  <meshStandardMaterial color={modelColors.skin} />
                </mesh>
            </group>
          </group>

          {/* Right Arm (Split) - MAIN WEAPON HOLDER */}
          <group position={[0.28, 1.2, 0]} ref={rightArm}>
            {/* Upper Arm */}
            <mesh position={[0, -0.125, 0]} castShadow>
              <boxGeometry args={[0.12, 0.25, 0.12]} />
              <meshStandardMaterial color={modelColors.shirt} />
            </mesh>
            {/* Forearm Group */}
            <group position={[0, -0.25, 0]} ref={rightForearm}>
                 <mesh position={[0, -0.125, 0]} castShadow>
                  <boxGeometry args={[0.12, 0.25, 0.12]} />
                  <meshStandardMaterial color={modelColors.shirt} />
                </mesh>
                 {/* Hand */}
                <mesh position={[0, -0.25, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                  <meshStandardMaterial color={modelColors.skin} />
                </mesh>
                
                {/* Weapon Attachment Point: Right Hand */}
                {/* Transform is now controlled by configuration constants */}
                <group 
                    position={modelTransform.pos} 
                    rotation={[modelTransform.rot[0], modelTransform.rot[1], modelTransform.rot[2]]}
                    scale={modelTransform.scale}
                > 
                    <CurrentWeaponModel muzzleRef={muzzleRef} />
                </group>
            </group>
          </group>

          {/* Legs */}
          <group position={[-0.1, 0.75, 0]} ref={leftLeg}>
            <mesh position={[0, -0.375, 0]} castShadow>
              <boxGeometry args={[0.15, 0.75, 0.15]} />
              <meshStandardMaterial color={modelColors.pants} />
            </mesh>
            <mesh position={[0, -0.75, 0.05]} castShadow>
              <boxGeometry args={[0.16, 0.1, 0.25]} />
              <meshStandardMaterial color={COLORS.shoes} />
            </mesh>
          </group>
          <group position={[0.1, 0.75, 0]} ref={rightLeg}>
            <mesh position={[0, -0.375, 0]} castShadow>
              <boxGeometry args={[0.15, 0.75, 0.15]} />
              <meshStandardMaterial color={modelColors.pants} />
            </mesh>
            <mesh position={[0, -0.75, 0.05]} castShadow>
              <boxGeometry args={[0.16, 0.1, 0.25]} />
              <meshStandardMaterial color={COLORS.shoes} />
            </mesh>
          </group>
        </group>
      </group>

      {enemies.map(enemy => (
          <Enemy 
            key={enemy.id} 
            data={enemy} 
            playerRef={group} 
            positionMapRef={enemyPositionsRef}
            onHitPlayer={handlePlayerHit}
            isPaused={isGameFrozen}
          />
      ))}
      {powerUps.map(p => <HealthPack key={p.id} data={p} isPaused={isGameFrozen} />)}
      {bones.map(b => <Bone key={b.id} data={b} isPaused={isGameFrozen} />)}
      {projectiles.map(p => (
        <Bullet 
            key={p.id} 
            data={p} 
            onDelete={removeProjectile} 
            enemyPositionsRef={enemyPositionsRef}
            onHitEnemy={handleHitEnemy}
            isPaused={isGameFrozen}
        />
      ))}
    </>
  );
};
