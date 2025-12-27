
import React from 'react';
import { COLORS, BUILDINGS, TREES } from '../constants';

const Tree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk - Twisted and Dark */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.2, 1.5, 6]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
      {/* Dead Branches - No leaves, just spiky geometry */}
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

const BrokenStreetLamp: React.FC<{ position: [number, number, number], rotation?: number, flickering?: boolean }> = ({ position, rotation = 0, flickering = false }) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
       <mesh position={[0, 1.5, 0]} castShadow>
         <cylinderGeometry args={[0.05, 0.05, 3]} />
         <meshStandardMaterial color="#111" />
       </mesh>
       <mesh position={[0.4, 2.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8]} />
          <meshStandardMaterial color="#111" />
       </mesh>
       <mesh position={[0.8, 2.8, 0]}>
         <boxGeometry args={[0.3, 0.1, 0.3]} />
         <meshStandardMaterial color="#333" emissive="#555" emissiveIntensity={0.2} />
       </mesh>
       {/* Weak, cold light - slightly reddish now */}
       {!flickering && (
         <pointLight position={[0.8, 2.6, 0]} intensity={0.5} distance={5} decay={2} color="#ffaaaa" />
       )}
    </group>
  )
}

const BuildingBlock: React.FC<{ position: [number, number, number], size: [number, number, number], color?: string }> = ({ position, size, color = "#262626" }) => {
    return (
        <group position={position}>
            <mesh position={[0, size[1]/2, 0]} castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, size[1] + 0.1, 0]} castShadow>
                <boxGeometry args={[size[0] + 0.2, 0.2, size[2] + 0.2]} />
                <meshStandardMaterial color="#171717" />
            </mesh>
             {/* Door (Boarded up) */}
            <mesh position={[0, 0.75, size[2]/2 + 0.01]}>
                <planeGeometry args={[0.8, 1.5]} />
                <meshStandardMaterial color="#3f1d0b" />
            </mesh>
            {/* Boards */}
            <mesh position={[0, 0.5, size[2]/2 + 0.02]} rotation={[0,0,0.1]}>
                <boxGeometry args={[1, 0.1, 0.05]} />
                <meshStandardMaterial color="#523a28" />
            </mesh>
             <mesh position={[0, 1.0, size[2]/2 + 0.02]} rotation={[0,0,-0.1]}>
                <boxGeometry args={[1, 0.1, 0.05]} />
                <meshStandardMaterial color="#523a28" />
            </mesh>
        </group>
    )
}

const RedMoon: React.FC = () => {
    return (
        <mesh position={[-20, 30, -20]}>
            <sphereGeometry args={[4, 16, 16]} />
            <meshBasicMaterial color="#ff2222" />
        </mesh>
    );
}

export const Environment: React.FC = () => {
  return (
    <group>
      {/* Red Moon in the sky */}
      <RedMoon />

      {/* --- Ground Plane (Dead Grass/Dirt) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={COLORS.grass} roughness={1} />
      </mesh>

      {/* --- Streets --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 100]} />
        <meshStandardMaterial color={COLORS.road} roughness={0.8} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]} receiveShadow>
        <planeGeometry args={[100, 6]} />
        <meshStandardMaterial color={COLORS.road} roughness={0.8} />
      </mesh>

       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -20]} receiveShadow>
        <planeGeometry args={[100, 6]} />
        <meshStandardMaterial color={COLORS.road} roughness={0.8} />
      </mesh>

      {/* --- Curbs --- */}
      <mesh position={[3.2, 0.1, 0]} receiveShadow castShadow>
         <boxGeometry args={[0.4, 0.2, 100]} />
         <meshStandardMaterial color={COLORS.curb} />
      </mesh>
      <mesh position={[-3.2, 0.1, 0]} receiveShadow castShadow>
         <boxGeometry args={[0.4, 0.2, 100]} />
         <meshStandardMaterial color={COLORS.curb} />
      </mesh>

      {/* --- Decorations --- */}
      
      {TREES.map((tree, i) => (
        <Tree key={`tree-${i}`} position={tree.position} scale={tree.scale} />
      ))}

      {BUILDINGS.map((b, i) => (
        <BuildingBlock key={`bldg-${i}`} position={b.position} size={b.size} color={b.color} />
      ))}

      <BrokenStreetLamp position={[3.5, 0, 0]} rotation={-Math.PI / 2} />
      <BrokenStreetLamp position={[-3.5, 0, 10]} rotation={Math.PI / 2} flickering={true} />
      <BrokenStreetLamp position={[3.5, 0, 20]} rotation={-Math.PI / 2} />

    </group>
  );
};
