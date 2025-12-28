
import React from 'react';
import { COLORS } from '../constants';
import { useMap } from '../contexts/MapContext';
import { DEFAULT_MAP_CONFIG } from '../utils/mapGenerator';
import type {
  GeneratedBuilding,
  GeneratedObstacle,
  GeneratedStreetLamp,
} from '../utils/mapGenerator';

// ============================================
// TREE COMPONENTS
// ============================================

const DeadTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.2, 1.5, 6]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
      {/* Dead Branches */}
      <mesh position={[0, 1.6, 0]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.08, 0.8]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[-0.5, 1, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.08, 0.7]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
      <mesh position={[0, 1.8, 0]} rotation={[0.2, 2, 0.3]} castShadow>
        <cylinderGeometry args={[0.01, 0.06, 0.6]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
    </group>
  );
};

const BurntTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Charred trunk */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.25, 1, 5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      {/* Broken top */}
      <mesh position={[0.1, 1.1, 0]} rotation={[0.3, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.06, 0.4]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
    </group>
  );
};

const TwistedTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Twisted trunk */}
      <mesh position={[0, 0.6, 0]} rotation={[0.1, 0, 0.15]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.18, 1.2, 6]} />
        <meshStandardMaterial color="#2a2520" roughness={1} />
      </mesh>
      {/* Gnarled branches */}
      <mesh position={[0.2, 1.2, 0]} rotation={[0.8, 0.5, 0.3]} castShadow>
        <cylinderGeometry args={[0.02, 0.05, 0.6]} />
        <meshStandardMaterial color="#252015" roughness={1} />
      </mesh>
      <mesh position={[-0.15, 1.0, 0.1]} rotation={[-0.6, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.05, 0.5]} />
        <meshStandardMaterial color="#252015" roughness={1} />
      </mesh>
    </group>
  );
};

// ============================================
// BUILDING COMPONENT
// ============================================

const Building: React.FC<{ data: GeneratedBuilding }> = ({ data }) => {
  const { position, size, color, variant, rotation } = data;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main structure */}
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>

      {/* Roof */}
      {variant !== 'ruined' && (
        <mesh position={[0, size[1] + 0.1, 0]} castShadow>
          <boxGeometry args={[size[0] + 0.2, 0.2, size[2] + 0.2]} />
          <meshStandardMaterial color="#171717" />
        </mesh>
      )}

      {/* Door (Boarded up) */}
      <mesh position={[0, 0.75, size[2] / 2 + 0.01]}>
        <planeGeometry args={[0.8, 1.5]} />
        <meshStandardMaterial color="#3f1d0b" />
      </mesh>

      {/* Boards on door */}
      <mesh position={[0, 0.5, size[2] / 2 + 0.02]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[1, 0.1, 0.05]} />
        <meshStandardMaterial color="#523a28" />
      </mesh>
      <mesh position={[0, 1.0, size[2] / 2 + 0.02]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[1, 0.1, 0.05]} />
        <meshStandardMaterial color="#523a28" />
      </mesh>

      {/* Windows (boarded) */}
      {size[1] > 3 && (
        <>
          <mesh position={[size[0] / 4, size[1] * 0.6, size[2] / 2 + 0.01]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-size[0] / 4, size[1] * 0.6, size[2] / 2 + 0.01]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </>
      )}

      {/* Ruined variant: debris */}
      {variant === 'ruined' && (
        <>
          <mesh position={[size[0] / 3, 0.2, size[2] / 3]} rotation={[0.3, 0.5, 0]}>
            <boxGeometry args={[1, 0.4, 0.8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[-size[0] / 4, 0.15, -size[2] / 4]} rotation={[0.1, 0.8, 0.2]}>
            <boxGeometry args={[0.8, 0.3, 0.6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </>
      )}
    </group>
  );
};

// ============================================
// OBSTACLE COMPONENTS
// ============================================

const BrokenCar: React.FC<{ position: [number, number, number]; rotation: number; scale: number }> = ({
  position,
  rotation,
  scale,
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* Car body */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      {/* Car top */}
      <mesh position={[0.2, 0.9, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.9]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      {/* Wheels */}
      {[[-0.6, 0.15, 0.5], [-0.6, 0.15, -0.5], [0.6, 0.15, 0.5], [0.6, 0.15, -0.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* Broken window */}
      <mesh position={[0.2, 0.9, 0.46]}>
        <planeGeometry args={[0.8, 0.35]} />
        <meshStandardMaterial color="#1a3040" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const Debris: React.FC<{ position: [number, number, number]; rotation: number; scale: number }> = ({
  position,
  rotation,
  scale,
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* Scattered rubble */}
      <mesh position={[0, 0.15, 0]} rotation={[0.2, 0, 0.1]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.6]} />
        <meshStandardMaterial color="#3a3a3a" roughness={1} />
      </mesh>
      <mesh position={[0.4, 0.1, 0.3]} rotation={[0.1, 0.5, 0.2]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#2d2d2d" roughness={1} />
      </mesh>
      <mesh position={[-0.3, 0.08, -0.2]} rotation={[0, 0.8, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.15, 0.25]} />
        <meshStandardMaterial color="#404040" roughness={1} />
      </mesh>
    </group>
  );
};

const Barricade: React.FC<{ position: [number, number, number]; rotation: number; scale: number }> = ({
  position,
  rotation,
  scale,
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* Wooden planks */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.15, 0.1]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[1.8, 0.15, 0.1]} />
        <meshStandardMaterial color="#3d2a18" roughness={0.9} />
      </mesh>
      {/* Support posts */}
      <mesh position={[-0.7, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#2a1d10" roughness={0.9} />
      </mesh>
      <mesh position={[0.7, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#2a1d10" roughness={0.9} />
      </mesh>
    </group>
  );
};

const Dumpster: React.FC<{ position: [number, number, number]; rotation: number; scale: number }> = ({
  position,
  rotation,
  scale,
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color="#2d4a2d" roughness={0.8} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 1.05, 0.3]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#1d3a1d" roughness={0.8} />
      </mesh>
    </group>
  );
};

const Barrel: React.FC<{ position: [number, number, number]; rotation: number; scale: number }> = ({
  position,
  rotation,
  scale,
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 1, 12]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
      {/* Bands */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.32, 0.02, 8, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.32, 0.02, 8, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const Obstacle: React.FC<{ data: GeneratedObstacle }> = ({ data }) => {
  const { position, type, rotation, scale } = data;

  switch (type) {
    case 'car':
      return <BrokenCar position={position} rotation={rotation} scale={scale} />;
    case 'debris':
      return <Debris position={position} rotation={rotation} scale={scale} />;
    case 'barricade':
      return <Barricade position={position} rotation={rotation} scale={scale} />;
    case 'dumpster':
      return <Dumpster position={position} rotation={rotation} scale={scale} />;
    case 'barrel':
      return <Barrel position={position} rotation={rotation} scale={scale} />;
    default:
      return null;
  }
};

// ============================================
// STREET LAMP COMPONENT
// ============================================

const StreetLamp: React.FC<{ data: GeneratedStreetLamp }> = ({ data }) => {
  const { position, rotation, working } = data;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Arm */}
      <mesh position={[0.4, 2.9, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0.8, 2.8, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#333"
          emissive={working ? '#ffaaaa' : '#222'}
          emissiveIntensity={working ? 0.5 : 0.1}
        />
      </mesh>
      {/* Light */}
      {working && (
        <pointLight position={[0.8, 2.6, 0]} intensity={0.8} distance={8} decay={2} color="#ffaaaa" />
      )}
    </group>
  );
};

// ============================================
// RED MOON COMPONENT
// ============================================

const RedMoon: React.FC = () => {
  return (
    <group position={[-30, 40, -30]}>
      {/* Moon sphere with glow */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#cc1111" />
      </mesh>
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#ff2222" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.1} />
      </mesh>
      {/* Moon light */}
      <pointLight intensity={5} distance={200} color="#ff3333" decay={0.5} />
    </group>
  );
};

// ============================================
// MAIN ENVIRONMENT COMPONENT
// ============================================

export const Environment: React.FC = () => {
  const { map } = useMap();

  return (
    <group>
      {/* Red Moon in the sky */}
      <RedMoon />

      {/* Ground Plane (Dead Grass/Dirt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[DEFAULT_MAP_CONFIG.worldSize, DEFAULT_MAP_CONFIG.worldSize]} />
        <meshStandardMaterial color={COLORS.grass} roughness={1} />
      </mesh>

      {/* Streets */}
      {map.streets.map((street, i) => (
        <mesh
          key={`street-${i}`}
          rotation={[-Math.PI / 2, 0, street.rotation]}
          position={street.position}
          receiveShadow
        >
          <planeGeometry args={street.size} />
          <meshStandardMaterial color={COLORS.road} roughness={0.8} />
        </mesh>
      ))}

      {/* Buildings */}
      {map.buildings.map((building, i) => (
        <Building key={`building-${i}`} data={building} />
      ))}

      {/* Trees */}
      {map.trees.map((tree, i) => {
        switch (tree.variant) {
          case 'burnt':
            return <BurntTree key={`tree-${i}`} position={tree.position} scale={tree.scale} />;
          case 'twisted':
            return <TwistedTree key={`tree-${i}`} position={tree.position} scale={tree.scale} />;
          default:
            return <DeadTree key={`tree-${i}`} position={tree.position} scale={tree.scale} />;
        }
      })}

      {/* Obstacles */}
      {map.obstacles.map((obstacle, i) => (
        <Obstacle key={`obstacle-${i}`} data={obstacle} />
      ))}

      {/* Street Lamps */}
      {map.streetLamps.map((lamp, i) => (
        <StreetLamp key={`lamp-${i}`} data={lamp} />
      ))}
    </group>
  );
};
