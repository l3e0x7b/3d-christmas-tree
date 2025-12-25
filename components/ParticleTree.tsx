import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  speed: number;
}

const ParticleTree: React.FC<Props> = ({ speed }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Tree Parameters
  const count = 25000; // Increased count for better density to support rich layering
  const height = 12;
  const maxRadius = 4.5;
  
  // Generate particles
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Animation phases
    const speeds = new Float32Array(count); 
    const offsets = new Float32Array(count); 
    
    // --- Rich Layered Color Palette ---
    // 1. Deepest Core: Almost black-green, provides volume and shadow depth
    const colorDeep = new THREE.Color('#011406'); 
    // 2. Mid Shadow: Rich pine green
    const colorShadow = new THREE.Color('#0a4f18'); 
    // 3. Main Body: Vibrant natural green
    const colorMain = new THREE.Color('#20a334'); 
    // 4. Outer Highlight: Neon/Electric green for the glow effect
    const colorVibrant = new THREE.Color('#55ff6e'); 
    // 5. Tips: Frosty pale mint for the very edges
    const colorFrost = new THREE.Color('#d4ffdc'); 
    
    // Reusable color object and HSL target to avoid GC thrashing in loop
    const tempColor = new THREE.Color();
    const hsl = { h: 0, s: 0, l: 0 };

    for (let i = 0; i < count; i++) {
      // Geometry distribution
      const yNorm = Math.pow(Math.random(), 0.45); 
      const y = (1 - yNorm) * height - (height / 2);
      const rAtHeight = (1 - (y + height/2) / height) * maxRadius;
      
      // Radius distribution with slight bias towards surface
      const rNorm = Math.pow(Math.random(), 0.4); 
      const r = rNorm * rAtHeight;
      
      const angle = Math.random() * Math.PI * 2;
      const spiralAngle = y * 2.5 + (i % 8) * 0.5; 
      const x = Math.cos(angle + spiralAngle) * r;
      const z = Math.sin(angle + spiralAngle) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // --- Advanced Coloring Logic ---
      
      // 1. Calculate mix factor based on depth (rNorm) plus random noise
      // This prevents the layers from looking like perfect onion rings
      const noise = (Math.random() - 0.5) * 0.2; // +/- 0.1 jitter
      const mix = Math.max(0, Math.min(1, rNorm + noise));

      // 2. Multi-stage Gradient Interpolation
      if (mix < 0.25) {
          // Inner Core: Deep -> Shadow
          tempColor.copy(colorDeep).lerp(colorShadow, mix / 0.25);
      } else if (mix < 0.6) {
          // Mid Layer: Shadow -> Main
          tempColor.copy(colorShadow).lerp(colorMain, (mix - 0.25) / 0.35);
      } else if (mix < 0.85) {
          // Outer Layer: Main -> Vibrant
          tempColor.copy(colorMain).lerp(colorVibrant, (mix - 0.6) / 0.25);
      } else {
          // Tips: Vibrant -> Frost
          tempColor.copy(colorVibrant).lerp(colorFrost, (mix - 0.85) / 0.15);
      }

      // 3. Vertical Gradient Influence
      // Top of the tree is generally younger/lighter
      const hNorm = (y + height/2) / height; 
      tempColor.lerp(colorVibrant, hNorm * 0.15); 

      // 4. Organic Variance (HSL Jitter)
      // Adds subtle hue shifts (some yellower, some bluer) and lightness variations
      tempColor.getHSL(hsl);
      
      // Randomize:
      // Hue: +/- 0.03 (subtle shift)
      // Lightness: +/- 0.08 (creates contrast between leaves)
      const randomHue = (Math.random() - 0.5) * 0.06; 
      const randomLight = (Math.random() - 0.5) * 0.16;

      tempColor.setHSL(
          hsl.h + randomHue,
          hsl.s, 
          THREE.MathUtils.clamp(hsl.l + randomLight, 0, 1)
      );

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
      
      // Size Logic: Inner particles slightly larger to fill volume, outer smaller for detail
      const baseSize = 0.05 + Math.random() * 0.15;
      sizes[i] = baseSize * (1.3 - rNorm * 0.5); 
      
      speeds[i] = Math.random() * 0.2 + 0.1;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, sizes, speeds, offsets };
  }, []);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y += delta * 0.1 * speed;

    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    for(let i=0; i<count; i++) {
        // Shimmer effect
        const shimmer = Math.sin(time * particles.speeds[i] + particles.offsets[i]) * 0.15;
        sizes[i] = particles.sizes[i] * (1 + shimmer);
    }
    pointsRef.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15} 
        vertexColors
        transparent
        opacity={1.0} 
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.NormalBlending} 
      />
    </points>
  );
};

export default ParticleTree;