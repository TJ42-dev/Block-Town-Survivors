
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../constants';
import { useMap } from '../contexts/MapContext';
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

const StreetLamp: React.FC<{ data: GeneratedStreetLamp; index: number }> = ({ data, index }) => {
  const { position, rotation, working } = data;
  const lightRef = useRef<THREE.PointLight>(null);
  const [intensity, setIntensity] = useState(working ? 2.5 : 0);
  const [emissiveIntensity, setEmissiveIntensity] = useState(working ? 1.5 : 0.1);

  // Determine if this lamp should flicker (roughly 30% of working lamps)
  const shouldFlicker = working && (index % 3 === 0);
  const flickerSpeed = useRef(2 + (index % 5) * 0.5); // Vary flicker speed
  const flickerOffset = useRef(index * 1.7); // Phase offset

  useFrame((state) => {
    if (!working) return;

    if (shouldFlicker) {
      const time = state.clock.elapsedTime * flickerSpeed.current + flickerOffset.current;

      // Create irregular flickering pattern
      const flicker1 = Math.sin(time * 3.7) * 0.5 + 0.5;
      const flicker2 = Math.sin(time * 7.3 + 1.3) * 0.5 + 0.5;
      const flicker3 = Math.sin(time * 11.1 + 2.7) * 0.5 + 0.5;

      // Combine for irregular pattern, occasionally going very dim
      let flickerValue = (flicker1 * 0.5 + flicker2 * 0.3 + flicker3 * 0.2);

      // Random chance to briefly go out
      if (flicker1 < 0.1 && flicker2 < 0.3) {
        flickerValue = 0.1;
      }

      const newIntensity = 1.0 + flickerValue * 2.0;
      const newEmissive = 0.5 + flickerValue * 1.5;

      setIntensity(newIntensity);
      setEmissiveIntensity(newEmissive);

      if (lightRef.current) {
        lightRef.current.intensity = newIntensity * 3; // Match the main light multiplier
      }
    }
  });

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
      {/* Lamp housing */}
      <mesh position={[0.8, 2.8, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.35]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      {/* Light bulb/lens - core */}
      <mesh position={[0.8, 2.7, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={working ? '#ffffee' : '#333'}
          emissive={working ? '#ffcc88' : '#111'}
          emissiveIntensity={emissiveIntensity * 2}
          transparent
          opacity={working ? 0.95 : 0.5}
        />
      </mesh>
      {/* Bloom glow layer 1 - inner */}
      {working && (
        <mesh position={[0.8, 2.7, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshBasicMaterial
            color="#ffcc66"
            transparent
            opacity={0.4 * (emissiveIntensity / 1.5)}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Bloom glow layer 2 - mid */}
      {working && (
        <mesh position={[0.8, 2.7, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshBasicMaterial
            color="#ffaa44"
            transparent
            opacity={0.2 * (emissiveIntensity / 1.5)}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Bloom glow layer 3 - outer */}
      {working && (
        <mesh position={[0.8, 2.7, 0]}>
          <sphereGeometry args={[0.55, 12, 12]} />
          <meshBasicMaterial
            color="#ff8833"
            transparent
            opacity={0.1 * (emissiveIntensity / 1.5)}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Main light - warm yellow with high intensity and soft falloff */}
      {working && (
        <pointLight
          ref={lightRef}
          position={[0.8, 2.5, 0]}
          intensity={intensity * 3}
          distance={25}
          decay={1.2}
          color="#ffcc88"
          castShadow
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />
      )}
      {/* Secondary fill light - softer, wider reach */}
      {working && (
        <pointLight
          position={[0.8, 2.5, 0]}
          intensity={intensity * 1.5}
          distance={20}
          decay={1}
          color="#ffaa77"
        />
      )}
      {/* Downward spotlight for focused ground illumination */}
      {working && (
        <spotLight
          position={[0.8, 2.5, 0]}
          angle={Math.PI / 3}
          penumbra={1}
          intensity={intensity * 2}
          distance={15}
          decay={1}
          color="#ffddaa"
          target-position={[0.8, 0, 0]}
        />
      )}
      {/* Ground light pool - gradient rings for natural falloff */}
      {working && (
        <>
          {/* Core bright center */}
          <mesh position={[0.8, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.5, 32]} />
            <meshBasicMaterial
              color="#ffcc88"
              transparent
              opacity={0.25 * (intensity / 2.5)}
              depthWrite={false}
            />
          </mesh>
          {/* Ring 1 */}
          <mesh position={[0.8, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 3, 32]} />
            <meshBasicMaterial
              color="#ffbb77"
              transparent
              opacity={0.18 * (intensity / 2.5)}
              depthWrite={false}
            />
          </mesh>
          {/* Ring 2 */}
          <mesh position={[0.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3, 5, 32]} />
            <meshBasicMaterial
              color="#ffaa66"
              transparent
              opacity={0.12 * (intensity / 2.5)}
              depthWrite={false}
            />
          </mesh>
          {/* Ring 3 */}
          <mesh position={[0.8, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5, 7, 32]} />
            <meshBasicMaterial
              color="#ff9955"
              transparent
              opacity={0.07 * (intensity / 2.5)}
              depthWrite={false}
            />
          </mesh>
          {/* Ring 4 - outer fade */}
          <mesh position={[0.8, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[7, 10, 32]} />
            <meshBasicMaterial
              color="#ff8844"
              transparent
              opacity={0.03 * (intensity / 2.5)}
              depthWrite={false}
            />
          </mesh>
        </>
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
  const { map, config } = useMap();

  return (
    <group>
      {/* Red Moon in the sky */}
      <RedMoon />

      {/* Ground Plane (Dead Grass/Dirt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[config.worldSize, config.worldSize]} />
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
        <StreetLamp key={`lamp-${i}`} data={lamp} index={i} />
      ))}
    </group>
  );
};
