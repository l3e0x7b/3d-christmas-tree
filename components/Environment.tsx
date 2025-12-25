import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars, MeshReflectorMaterial } from '@react-three/drei';

interface Props {
  showSnow: boolean;
}

const FallingSnow: React.FC<{ count: number }> = ({ count }) => {
    const pointsRef = useRef<THREE.Points>(null!);
    
    // Custom soft circle texture for snow
    const snowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(16,16,12,0,Math.PI*2);
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }, []);

    const { positions, velocities, randomOffsets } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vels = new Float32Array(count);
        const offsets = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Wide area distribution
            pos[i * 3] = (Math.random() - 0.5) * 60;     // x
            pos[i * 3 + 1] = Math.random() * 30 - 5;     // y (start at various heights)
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60; // z
            
            // Speed variance
            vels[i] = 0.4 + Math.random() * 0.8; 
            
            // Random sway
            offsets[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, velocities: vels, randomOffsets: offsets };
    }, [count]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        
        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < count; i++) {
            // Update Y: Fall downwards
            posArray[i * 3 + 1] -= velocities[i] * delta;

            // Add slight wind sway on X and Z
            const sway = Math.sin(state.clock.elapsedTime * 0.5 + randomOffsets[i]) * 0.02;
            posArray[i * 3] += sway;
            posArray[i * 3 + 2] += sway;

            // Reset if below ground
            if (posArray[i * 3 + 1] < -8) {
                posArray[i * 3 + 1] = 20 + Math.random() * 5; 
                posArray[i * 3] = (Math.random() - 0.5) * 60;
                posArray[i * 3 + 2] = (Math.random() - 0.5) * 60;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={count} 
                    array={positions} 
                    itemSize={3} 
                />
            </bufferGeometry>
            <pointsMaterial 
                map={snowTexture}
                size={0.25} 
                color="white" 
                transparent 
                opacity={0.8} 
                alphaTest={0.1}
                depthWrite={false}
            />
        </points>
    );
};

const Environment: React.FC<Props> = ({ showSnow }) => {
  return (
    <>
        {/* Distant Stars */}
        <Stars 
            radius={100} 
            depth={50} 
            count={8000} 
            factor={6}   
            saturation={0} 
            fade 
            speed={0.5}  
        />
        
        {/* Custom Falling Snow */}
        {showSnow && <FallingSnow count={2500} />}

        {/* High Quality Reflective Icy Floor - Radius focused to 14 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
            <circleGeometry args={[14, 64]} />
            <MeshReflectorMaterial
                blur={[400, 400]} 
                mixBlur={1} 
                mixStrength={40} 
                mixContrast={1} 
                resolution={1024} 
                mirror={0.7} 
                depthScale={1.2} 
                minDepthThreshold={0.4} 
                maxDepthThreshold={1.4} 
                depthToBlurRatioBias={0.25} 
                distortion={0.2} 
                reflectorOffset={0.2} 
                color="#1a1a1a" 
                metalness={0.6}
                roughness={0.4} 
            />
        </mesh>
        
        {/* Subtle dark vignette ring to fade floor edges - Adjusted to 11-14 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.99, 0]}>
             <ringGeometry args={[11, 14, 64]} />
             <meshBasicMaterial color="#000000" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
    </>
  );
};

export default Environment;