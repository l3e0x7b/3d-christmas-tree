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
            
            // Speed variance - SLOWED DOWN FURTHER
            // Previous: 0.8 + Math.random() * 1.5
            // New: 0.4 + Math.random() * 0.8 (Range 0.4 - 1.2)
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
            // Use delta to make it framerate independent
            posArray[i * 3 + 1] -= velocities[i] * delta;

            // Add slight wind sway on X and Z
            // Slower sway frequency (0.5 multiplier) to match slower fall
            const sway = Math.sin(state.clock.elapsedTime * 0.5 + randomOffsets[i]) * 0.02;
            posArray[i * 3] += sway;
            posArray[i * 3 + 2] += sway;

            // Reset if below ground
            if (posArray[i * 3 + 1] < -8) {
                posArray[i * 3 + 1] = 20 + Math.random() * 5; // Reset to top
                posArray[i * 3] = (Math.random() - 0.5) * 60; // Random X
                posArray[i * 3 + 2] = (Math.random() - 0.5) * 60; // Random Z
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

        {/* High Quality Reflective Icy Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
            <circleGeometry args={[50, 64]} />
            <MeshReflectorMaterial
                blur={[400, 400]} // Blur ground reflections (width, height), 0 skips blur
                mixBlur={1} // How much blur mixes with surface roughness (default = 1)
                mixStrength={40} // Strength of the reflection
                mixContrast={1} // Contrast of the reflections
                resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality, slower
                mirror={0.7} // Mirror intensity, 0 - 1
                depthScale={1.2} // Scale the depth factor (0 = no depth, default = 0)
                minDepthThreshold={0.4} // Lower edge for the depthTexture interpolation (default = 0)
                maxDepthThreshold={1.4} // Upper edge for the depthTexture interpolation (default = 0)
                depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
                distortion={0.2} // Amount of distortion based on the distortionMap texture
                reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
                color="#1a1a1a" // Dark grey base
                metalness={0.6}
                roughness={0.4} // Icy roughness
            />
        </mesh>
        
        {/* Subtle dark vignette ring to fade floor edges */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.99, 0]}>
             <ringGeometry args={[45, 50, 64]} />
             <meshBasicMaterial color="#000000" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
    </>
  );
};

export default Environment;