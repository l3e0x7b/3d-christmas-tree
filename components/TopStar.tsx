import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  speed: number;
}

const TopStar: React.FC<Props> = ({ speed }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.6; 
    const innerRadius = 0.25; 
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.25, 
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      // Rotate based on delta for smooth speed control
      // Base speed was 0.5 rad/s
      groupRef.current.rotation.y += delta * 0.5 * speed;
      
      // Float animation remains time-based for consistency
      groupRef.current.position.y = 6.0 + Math.sin(clock.getElapsedTime() * 2) * 0.05; 
    }
  });

  return (
    <group ref={groupRef} position={[0, 6.0, 0]}>
        {/* Core Star - More realistic material */}
        <mesh geometry={starGeometry}>
            <meshStandardMaterial 
                color="#ffd700"  // Rich Gold
                emissive="#ff8c00" // Deep Orange-Gold Glow
                emissiveIntensity={0.6} 
                roughness={0.2} 
                metalness={0.8} 
                envMapIntensity={1.2} 
            />
        </mesh>
        
        {/* Inner intense glow core (The bulb itself) */}
        <mesh position={[0, 0, 0.15]}>
             <circleGeometry args={[0.25, 32]} />
             <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Removed Outer Halo Mesh per request */}
        
        {/* Lighting from the star */}
        <pointLight intensity={3} distance={15} color="#ffaa00" decay={2} />
    </group>
  );
};

export default TopStar;