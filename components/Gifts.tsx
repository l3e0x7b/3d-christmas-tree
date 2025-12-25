import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  speed: number;
  visible: boolean;
}

// Helper to create a striped texture dynamically with custom colors
const createStripeTexture = (color1: string, color2: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = color2;
        
        // Draw diagonal stripes
        const w = 64;
        const h = 64;
        const thickness = 16;
        
        // Draw multiple lines to cover the tile
        for (let i = -w; i < w * 2; i += thickness * 2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + thickness, 0);
            ctx.lineTo(i + thickness - h, h);
            ctx.lineTo(i - h, h);
            ctx.fill();
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4); 
    return texture;
};

// --- New Component: Floor Decorations (Confetti & Ribbons) ---
const FloorDecorations: React.FC = () => {
    const confettiRef = useRef<THREE.InstancedMesh>(null!);
    const ribbonCount = 120; // Increased count
    const confettiCount = 2000; // Increased count

    useLayoutEffect(() => {
        if (!confettiRef.current) return;
        
        const temp = new THREE.Object3D();
        const colors = [
            new THREE.Color('#ff0000'), new THREE.Color('#00ff00'), new THREE.Color('#0000ff'),
            new THREE.Color('#ffff00'), new THREE.Color('#ff00ff'), new THREE.Color('#00ffff'),
            new THREE.Color('#ffffff'), new THREE.Color('#ffaa00'), new THREE.Color('#ef4444'),
            new THREE.Color('#3b82f6'), new THREE.Color('#10b981')
        ];

        for(let i=0; i < confettiCount; i++) {
             const angle = Math.random() * Math.PI * 2;
             // Spread logic: mostly 2.5-7.5, some inner
             const r = 2.0 + Math.random() * 6.5;
             const x = Math.cos(angle) * r;
             const z = Math.sin(angle) * r;
             
             // Tiny height variation to prevent z-fighting, sitting right on top of floor (-6)
             const y = -6 + 0.01 + (Math.random() * 0.015);

             temp.position.set(x, y, z);
             // Random rotation flat on ground
             temp.rotation.set(-Math.PI/2, 0, Math.random() * Math.PI * 2); 
             
             // Increased scale variety
             const scale = 0.12 + Math.random() * 0.20;
             temp.scale.set(scale, scale, scale);
             
             temp.updateMatrix();
             confettiRef.current.setMatrixAt(i, temp.matrix);
             confettiRef.current.setColorAt(i, colors[Math.floor(Math.random()*colors.length)]);
        }
        confettiRef.current.instanceMatrix.needsUpdate = true;
        if (confettiRef.current.instanceColor) confettiRef.current.instanceColor.needsUpdate = true;
    }, []);

    const ribbons = useMemo(() => {
        const els = [];
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffdd00', '#ff00ff', '#00eaff', '#fbbf24', '#f43f5e'];
        
        for(let i=0; i<ribbonCount; i++) {
             // Create a random curly/serpentine curve
             const pts = [];
             const type = Math.random();
             let geo: THREE.BufferGeometry;
             
             // Random scale for size variety (thickness and length)
             const scale = 0.6 + Math.random() * 0.9; 
             const tubeRadius = 0.03;

             if (type > 0.5) {
                // Spiral Shape
                const rotations = 1.5 + Math.random() * 2;
                const radius = 0.2 + Math.random() * 0.3;
                for(let j=0; j<=30; j++) {
                    const t = j/30;
                    const angle = t * Math.PI * 2 * rotations;
                    const r = radius * (1 - t*0.3); // Slight taper
                    const lx = Math.cos(angle) * r;
                    const lz = Math.sin(angle) * r;
                    // Add subtle waviness in Y
                    const ly = (Math.random() - 0.5) * 0.02;
                    pts.push(new THREE.Vector3(lx, ly, lz));
                }
             } else {
                 // Wavy Snake Shape
                 const length = 0.5 + Math.random() * 0.8;
                 for(let j=0; j<=20; j++) {
                     const t = j/20;
                     const lx = (t - 0.5) * length;
                     const lz = Math.sin(t * Math.PI * 4) * 0.15;
                     pts.push(new THREE.Vector3(lx, 0, lz));
                 }
             }

             const curve = new THREE.CatmullRomCurve3(pts);
             geo = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);
             
             const angle = Math.random() * Math.PI * 2;
             const dist = 2.5 + Math.random() * 5.5;
             const x = Math.cos(angle) * dist;
             const z = Math.sin(angle) * dist;
             
             // Calculate Y to ensure it doesn't sink.
             // Floor is -6.
             // Ribbon radius when scaled is tubeRadius * scale.
             // Some curves dip slightly by +/- 0.01 (local Y), scaled by scale.
             // Safe Y = -6 + (tubeRadius * scale) + (maxDip * scale) + epsilon
             const y = -6 + (tubeRadius * scale) + (0.01 * scale) + 0.005;

             els.push(
                 <mesh key={i} geometry={geo} position={[x, y, z]} rotation={[0, Math.random()*Math.PI*2, 0]} scale={[scale, scale, scale]}>
                     <meshStandardMaterial color={colors[Math.floor(Math.random()*colors.length)]} roughness={0.4} metalness={0.3} side={THREE.DoubleSide} />
                 </mesh>
             )
        }
        return els;
    }, []);

    return (
        <group>
            <instancedMesh ref={confettiRef} args={[undefined, undefined, confettiCount]}>
                 <planeGeometry args={[1,1]} />
                 <meshStandardMaterial side={THREE.DoubleSide} roughness={0.3} metalness={0.5} />
            </instancedMesh>
            {ribbons}
        </group>
    )
}


const Gifts: React.FC<Props> = ({ speed, visible }) => {
  const groupRef = useRef<THREE.Group>(null!);
  
  // 1. Textures
  const caneTextures = useMemo(() => [
      createStripeTexture('#ffffff', '#dc2626'), // Classic Red/White
      createStripeTexture('#ffffff', '#15803d'), // Green/White
      createStripeTexture('#ffffff', '#b45309'), // Gold/White
      createStripeTexture('#dc2626', '#15803d'), // Red/Green
      createStripeTexture('#e0f2fe', '#0284c7'), // Icy Blue/White
  ], []);

  // 2. Geometries
  const caneGeometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 1.0, 0),     
          new THREE.Vector3(0.1, 1.3, 0),   
          new THREE.Vector3(0.35, 1.35, 0), 
          new THREE.Vector3(0.5, 1.1, 0),   
      ]);
      return new THREE.TubeGeometry(curve, 32, 0.06, 12, false);
  }, []);

  const unitBoxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bowKnotGeo = useMemo(() => new THREE.SphereGeometry(0.07, 16, 16), []);
  const bowLoopGeo = useMemo(() => new THREE.TorusGeometry(0.10, 0.035, 8, 16, Math.PI * 2), []);
  const bowTailGeo = useMemo(() => new THREE.BoxGeometry(0.04, 0.35, 0.01), []);
  
  const { gifts, candyCanes } = useMemo(() => {
    const tempGifts: any[] = [];
    const tempCanes: any[] = [];
    
    const wrappingColors = [
      '#ef4444', '#166534', '#1e40af', '#fbbf24', 
      '#ffffff', '#4c1d95', '#9f1239', '#0891b2',
    ];

    const ribbonColors = [
      '#ffd700', '#c0c0c0', '#ff0000', '#fcd34d', '#ffffff'
    ];

    const createGift = (x: number, z: number, yBase: number, scaleMod: number = 1.0) => {
        const w = (0.5 + Math.random() * 0.6) * scaleMod;
        const h = (0.4 + Math.random() * 0.5) * scaleMod;
        const d = (0.5 + Math.random() * 0.6) * scaleMod;
        
        const y = yBase + (h / 2);

        const rotY = Math.random() * Math.PI * 2;
        const rotX = (Math.random() - 0.5) * 0.05; 
        const rotZ = (Math.random() - 0.5) * 0.05;
        
        const bowRotation = Math.random() * Math.PI;

        return {
            position: [x, y, z] as [number, number, number],
            rotation: [rotX, rotY, rotZ] as [number, number, number],
            size: [w, h, d] as [number, number, number],
            color: wrappingColors[Math.floor(Math.random() * wrappingColors.length)],
            ribbonColor: ribbonColors[Math.floor(Math.random() * ribbonColors.length)],
            hasRibbon: true,
            bowRotation: bowRotation
        };
    };

    const baseGifts: any[] = [];

    // --- Phase 1: Base Layer (Floor) ---
    const baseCount = 70; 
    for (let i = 0; i < baseCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.0 + Math.random() * 5.5; 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const floorY = -6 + 0.02;
        const gift = createGift(x, z, floorY, 1.0); 
        tempGifts.push(gift);
        baseGifts.push(gift);
    }

    // --- Phase 2: Stacking ---
    const stackCount = 80; 
    for (let i = 0; i < stackCount; i++) {
        if (baseGifts.length === 0) break;
        const parent = baseGifts[Math.floor(Math.random() * baseGifts.length)];
        const parentTopY = parent.position[1] + (parent.size[1] / 2);
        const offsetX = (Math.random() - 0.5) * (parent.size[0] * 0.5);
        const offsetZ = (Math.random() - 0.5) * (parent.size[2] * 0.5);

        const gift = createGift(
            parent.position[0] + offsetX, 
            parent.position[2] + offsetZ, 
            parentTopY - 0.05, 
            0.6 + Math.random() * 0.4 
        );
        tempGifts.push(gift);
        
        if (Math.random() > 0.3) baseGifts.push(gift);
    }

    // --- Phase 3: Tiny Fillers ---
    for (let i = 0; i < 30; i++) {
         const angle = Math.random() * Math.PI * 2;
         const radius = 3.5 + Math.random() * 4.5;
         const x = Math.cos(angle) * radius;
         const z = Math.sin(angle) * radius;
         const gift = createGift(x, z, -6 + 0.02, 0.4); 
         tempGifts.push(gift);
    }

    // --- Phase 4: Candy Canes ---
    for (let i = 0; i < 35; i++) {
        const type = Math.random(); 
        let x, y, z, rotX, rotY, rotZ;
        const scale = 0.7 + Math.random() * 0.5;

        if (type < 0.3) {
            // Stand upright(ish) on the floor
            const angle = Math.random() * Math.PI * 2;
            const radius = 4.0 + Math.random() * 3.0;
            x = Math.cos(angle) * radius;
            z = Math.sin(angle) * radius;
            y = -6; // Fixed: Set exactly to floor level so tip is on ground
            rotX = (Math.random() - 0.5) * 0.5;
            rotZ = (Math.random() - 0.5) * 0.5;
            rotY = Math.random() * Math.PI * 2;
        } else if (type < 0.6) {
             // Lying flat on floor
             const angle = Math.random() * Math.PI * 2;
             const radius = 3.0 + Math.random() * 4.0;
             x = Math.cos(angle) * radius;
             z = Math.sin(angle) * radius;
             // Fixed: Tube radius is 0.06. Lift by radius * scale + epsilon
             y = -6 + (0.07 * scale); 
             rotX = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
             rotY = Math.random() * Math.PI * 2;
             rotZ = (Math.random() - 0.5) * 0.5; 
        } else {
            // On top of gifts
            const targetGift = tempGifts[Math.floor(Math.random() * tempGifts.length)];
            const topY = targetGift.position[1] + targetGift.size[1] / 2;
            y = topY + 0.02;
            x = targetGift.position[0] + (Math.random() - 0.5) * (targetGift.size[0] * 0.7);
            z = targetGift.position[2] + (Math.random() - 0.5) * (targetGift.size[2] * 0.7);
            rotX = Math.PI / 2 + (Math.random() - 0.5) * 0.8; 
            rotY = Math.random() * Math.PI * 2;
            rotZ = (Math.random() - 0.5) * 0.8;
        }
        
        tempCanes.push({
            position: [x, y, z],
            rotation: [rotX, rotY, rotZ],
            scale: scale,
            textureIndex: Math.floor(Math.random() * caneTextures.length),
            ribbonColor: ribbonColors[Math.floor(Math.random() * ribbonColors.length)],
            bowRotation: Math.random() * Math.PI
        });
    }

    return { gifts: tempGifts, candyCanes: tempCanes };
  }, [caneTextures]);

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.1 * speed;
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      
      {/* Floor Elements - Now part of the rotating group */}
      <FloorDecorations />

      {/* Gifts */}
      {gifts.map((gift, index) => {
        const [w, h, d] = gift.size;
        return (
            <group key={`gift-${index}`} position={gift.position} rotation={new THREE.Euler(...gift.rotation)}>
                <mesh castShadow receiveShadow geometry={unitBoxGeo} scale={[w, h, d]}>
                    <meshStandardMaterial color={gift.color} roughness={0.3} metalness={0.1} />
                </mesh>
                
                <mesh geometry={unitBoxGeo} scale={[w + 0.01, h + 0.01, d * 0.15]}>
                    <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} emissive={gift.ribbonColor} emissiveIntensity={0.1} />
                </mesh>
                <mesh geometry={unitBoxGeo} scale={[w * 0.15, h + 0.01, d + 0.01]}>
                    <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} emissive={gift.ribbonColor} emissiveIntensity={0.1} />
                </mesh>
                
                <group position={[0, h/2, 0]} rotation={[0, gift.bowRotation, 0]}>
                    <mesh geometry={bowKnotGeo} position={[0, 0.04, 0]} scale={[1, 0.7, 1]}>
                        <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowLoopGeo} position={[-0.08, 0.06, 0]} rotation={[0, -Math.PI/6, -Math.PI/4]}>
                        <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowLoopGeo} position={[0.08, 0.06, 0]} rotation={[0, Math.PI/6, Math.PI/4]}>
                        <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowTailGeo} position={[-0.08, 0.0, 0.05]} rotation={[0, 0, Math.PI/6]}>
                        <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowTailGeo} position={[0.08, 0.0, -0.05]} rotation={[0, 0, -Math.PI/6]}>
                        <meshStandardMaterial color={gift.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                </group>
            </group>
        );
      })}

      {/* Candy Canes */}
      {candyCanes.map((cane, index) => (
          <group key={`cane-${index}`} position={cane.position} rotation={new THREE.Euler(...cane.rotation)} scale={[cane.scale, cane.scale, cane.scale]}>
              <mesh geometry={caneGeometry}>
                  <meshStandardMaterial map={caneTextures[cane.textureIndex]} roughness={0.2} metalness={0.1} emissive="#ffffff" emissiveIntensity={0.05} />
              </mesh>
              <group position={[0, 0.7, 0]} rotation={[0, cane.bowRotation, 0]} scale={[0.8, 0.8, 0.8]}>
                    <mesh geometry={bowKnotGeo} position={[0, 0, 0.05]} scale={[1, 0.7, 1]}>
                        <meshStandardMaterial color={cane.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowLoopGeo} position={[-0.08, 0.02, 0.05]} rotation={[0, -Math.PI/6, -Math.PI/4]}>
                        <meshStandardMaterial color={cane.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowLoopGeo} position={[0.08, 0.02, 0.05]} rotation={[0, Math.PI/6, Math.PI/4]}>
                        <meshStandardMaterial color={cane.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowTailGeo} position={[-0.06, -0.1, 0.08]} rotation={[0, 0, Math.PI/12]}>
                        <meshStandardMaterial color={cane.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh geometry={bowTailGeo} position={[0.06, -0.1, 0.08]} rotation={[0, 0, -Math.PI/12]}>
                        <meshStandardMaterial color={cane.ribbonColor} roughness={0.2} metalness={0.8} />
                    </mesh>
              </group>
          </group>
      ))}

    </group>
  );
};

export default Gifts;