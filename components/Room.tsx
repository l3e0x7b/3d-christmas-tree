import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper to create a catenary-like curve for the lights
const createDrapedCurve = (start: THREE.Vector3, end: THREE.Vector3, drop: number) => {
    const points = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Linear interpolation
        const p = new THREE.Vector3().lerpVectors(start, end, t);
        // Parabolic drop
        // 4 * t * (1-t) peaks at t=0.5 with value 1
        const yDrop = 4 * t * (1 - t) * drop;
        p.y -= yDrop;
        points.push(p);
    }
    return new THREE.CatmullRomCurve3(points);
};

const StringLights: React.FC<{
    start: [number, number, number];
    end: [number, number, number];
    drop: number;
    count: number;
    speedOffset: number;
}> = ({ start, end, drop, count, speedOffset }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    
    // Geometry and Material
    // Use a simple sphere for the bulb
    const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);
    // Use a cylinder for the wire
    const wireGeo = useMemo(() => new THREE.TubeGeometry(
        createDrapedCurve(new THREE.Vector3(...start), new THREE.Vector3(...end), drop),
        20, 0.01, 4, false
    ), [start, end, drop]);

    const { curve, colors, offsets } = useMemo(() => {
        const s = new THREE.Vector3(...start);
        const e = new THREE.Vector3(...end);
        const c = createDrapedCurve(s, e, drop);
        
        const palette = [
            new THREE.Color('#ff0000'), // Red
            new THREE.Color('#00ff00'), // Green
            new THREE.Color('#0000ff'), // Blue
            new THREE.Color('#ffff00'), // Yellow
            new THREE.Color('#ff00ff'), // Magenta
            new THREE.Color('#ffaa00'), // Warm White
        ];

        const colorsArr = new Float32Array(count * 3);
        const offsetsArr = new Float32Array(count);

        for(let i=0; i<count; i++) {
            const col = palette[i % palette.length];
            colorsArr[i*3] = col.r;
            colorsArr[i*3+1] = col.g;
            colorsArr[i*3+2] = col.b;
            offsetsArr[i] = Math.random() * 10;
        }

        return { curve: c, colors: colorsArr, offsets: offsetsArr };
    }, [start, end, drop, count]);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        
        const time = clock.getElapsedTime();
        const tempColor = new THREE.Color();
        const dummy = new THREE.Object3D();

        // Update bulb colors/intensity
        for(let i=0; i<count; i++) {
            const t = (i / (count - 1));
            const point = curve.getPointAt(t);
            
            dummy.position.copy(point);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Blinking effect
            const blink = Math.sin(time * 3 + offsets[i] + speedOffset) > 0 ? 1.5 : 0.2;
            
            tempColor.setRGB(
                colors[i*3],
                colors[i*3+1],
                colors[i*3+2]
            );
            // Boost emission
            tempColor.multiplyScalar(blink); 
            
            meshRef.current.setColorAt(i, tempColor);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <group>
            {/* The Wire */}
            <mesh geometry={wireGeo}>
                <meshBasicMaterial color="#222" />
            </mesh>
            {/* The Bulbs */}
            <instancedMesh ref={meshRef} args={[bulbGeo, undefined, count]}>
                <meshStandardMaterial 
                    roughness={0.2} 
                    metalness={0.5} 
                    emissive="white" // Base emissive, color overridden by instance
                    emissiveIntensity={1}
                />
            </instancedMesh>
        </group>
    );
};

const Room: React.FC = () => {
  // Wall Dimensions
  const floorY = -6;
  const wallHeight = 25;
  const wallWidth = 40;
  
  // Positions
  const backZ = -12;
  const leftX = -12;
  
  // Center Y for the wall geometry
  const wallCenterY = floorY + (wallHeight / 2);

  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, wallCenterY, backZ]} receiveShadow>
        <planeGeometry args={[wallWidth, wallHeight]} />
        <meshStandardMaterial 
            color="#111827" // Dark slate/gray
            roughness={0.9} 
            metalness={0.1} 
        />
      </mesh>

      {/* Left Wall */}
      <mesh position={[leftX, wallCenterY, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[wallWidth, wallHeight]} />
        <meshStandardMaterial 
            color="#0f172a" // Slightly different dark tone
            roughness={0.9} 
            metalness={0.1} 
        />
      </mesh>

      {/* --- String Lights Setup --- */}
      
      {/* Back Wall Swags */}
      <StringLights start={[-12, 8, backZ + 0.2]} end={[-4, 7, backZ + 0.2]} drop={1.5} count={12} speedOffset={0} />
      <StringLights start={[-4, 7, backZ + 0.2]} end={[4, 8, backZ + 0.2]} drop={1.5} count={12} speedOffset={1} />
      <StringLights start={[4, 8, backZ + 0.2]} end={[12, 7, backZ + 0.2]} drop={1.5} count={12} speedOffset={2} />

      <StringLights start={[-8, 4, backZ + 0.2]} end={[0, 3, backZ + 0.2]} drop={1.2} count={10} speedOffset={3} />
      <StringLights start={[0, 3, backZ + 0.2]} end={[8, 4, backZ + 0.2]} drop={1.2} count={10} speedOffset={4} />

      {/* Left Wall Swags */}
      <StringLights start={[leftX + 0.2, 9, -12]} end={[leftX + 0.2, 7.5, -4]} drop={2} count={14} speedOffset={5} />
      <StringLights start={[leftX + 0.2, 7.5, -4]} end={[leftX + 0.2, 8.5, 4]} drop={2} count={14} speedOffset={6} />
      
      <StringLights start={[leftX + 0.2, 5, -8]} end={[leftX + 0.2, 4, 0]} drop={1.5} count={10} speedOffset={7} />
      <StringLights start={[leftX + 0.2, 4, 0]} end={[leftX + 0.2, 5, 8]} drop={1.5} count={10} speedOffset={8} />

    </group>
  );
};

export default Room;