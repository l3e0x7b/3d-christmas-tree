import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper to get tree radius at a specific height
const getTreeRadius = (y: number, height: number, maxRadius: number) => {
  const yBase = y + height / 2;
  const normalizedY = yBase / height;
  return Math.max(0, (1 - normalizedY) * maxRadius);
};

// --- Fabric/Knitted Texture Generator ---
const createKnittedTexture = (color1: string, color2: string, type: 'striped' | 'solid' | 'pattern') => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 128, 128);

        // Add subtle "wool" noise to everything
        for(let i=0; i<4000; i++) {
             const x = Math.random() * 128;
             const y = Math.random() * 128;
             ctx.fillStyle = 'rgba(255,255,255,0.05)';
             ctx.fillRect(x,y,2,2);
        }
        
        if (type === 'striped') {
            ctx.fillStyle = color2;
            const stripeHeight = 16;
            for(let y=0; y<128; y+=stripeHeight*2) {
                ctx.fillRect(0, y, 128, stripeHeight);
            }
        } else if (type === 'pattern') {
            ctx.fillStyle = color2;
            // Simple polka dots or snowflakes pattern
            for(let i=0; i<8; i++) {
                for(let j=0; j<8; j++) {
                     if ((i+j)%2===0) {
                         ctx.beginPath();
                         ctx.arc(i*16+8, j*16+8, 4, 0, Math.PI*2);
                         ctx.fill();
                     }
                }
            }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}


interface Props {
  speed: number;
  showStockings: boolean;
  showBells: boolean;
}

// Sub-component for a single Stocking to allow unique materials
const StockingMesh: React.FC<{ 
    position: [number, number, number], 
    rotation: [number, number, number],
    scale: number,
    texture: THREE.CanvasTexture
}> = ({ position, rotation, scale, texture }) => {
    
    // Geometry reuse via useMemo within the component logic or global is fine.
    // Defining here to ensure it's available.
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        // Modern sock shape
        s.moveTo(-0.12, 0.3);
        s.lineTo(0.12, 0.3);
        s.lineTo(0.12, -0.05); // Ankle
        s.quadraticCurveTo(0.12, -0.2, 0.25, -0.25); // Heel curve
        s.lineTo(0.28, -0.28);
        s.quadraticCurveTo(0.35, -0.38, 0.2, -0.38); // Toe
        s.lineTo(-0.08, -0.38);
        s.quadraticCurveTo(-0.18, -0.38, -0.18, -0.25); // Heel back
        s.lineTo(-0.12, 0.3);
        return s;
    }, []);

    const geometry = useMemo(() => {
        const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;
    }, [shape]);
    
    // Cuff Geometry
    const cuffGeo = useMemo(() => new THREE.BoxGeometry(0.32, 0.12, 0.16), []);

    return (
        <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Sock Body */}
            <mesh geometry={geometry}>
                 <meshStandardMaterial 
                    map={texture} 
                    roughness={0.9} // Wooly
                    metalness={0.0} 
                 />
            </mesh>
            {/* White Fluffy Cuff */}
            <mesh geometry={cuffGeo} position={[0, 0.28, 0]}>
                 <meshStandardMaterial 
                    color="#f8fafc"
                    roughness={1.0} 
                    metalness={0.0}
                 />
            </mesh>
        </group>
    )
}

export const Decorations: React.FC<Props> = ({ speed, showStockings, showBells }) => {
  const lightsRef = useRef<THREE.Points>(null!);
  const tinselRef = useRef<THREE.Mesh>(null!);
  const baublesRef = useRef<THREE.InstancedMesh>(null!);
  const bellsRef = useRef<THREE.InstancedMesh>(null!);
  // Stockings now handled as individual components
  
  const tempObject = new THREE.Object3D();
  
  // Settings
  const height = 12;
  const maxRadius = 4.5;

  // --- Geometries ---
  const bellGeometry = useMemo(() => {
    const points = [];
    points.push(new THREE.Vector2(0, 0.25)); 
    points.push(new THREE.Vector2(0.08, 0.22)); 
    points.push(new THREE.Vector2(0.12, 0.0)); 
    points.push(new THREE.Vector2(0.2, -0.2)); 
    points.push(new THREE.Vector2(0.18, -0.2)); 
    const geo = new THREE.LatheGeometry(points, 24);
    return geo;
  }, []);

  // --- Textures for Stockings ---
  const stockingTextures = useMemo(() => [
      createKnittedTexture('#dc2626', '#ffffff', 'solid'),  // Red Solid
      createKnittedTexture('#16a34a', '#ffffff', 'solid'),  // Green Solid
      createKnittedTexture('#dc2626', '#ffffff', 'striped'),// Red/White Stripes
      createKnittedTexture('#16a34a', '#dc2626', 'striped'),// Green/Red Stripes
      createKnittedTexture('#ffffff', '#dc2626', 'pattern'),// White with Red Polka
  ], []);

  // --- 1. Blinking Lights (Points) ---
  const lightCount = 500;
  const lightsData = useMemo(() => {
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const sizes = new Float32Array(lightCount);
    const speeds = new Float32Array(lightCount);
    const offsets = new Float32Array(lightCount);

    const palette = [
      new THREE.Color('#ff0000'), new THREE.Color('#00ffff'), 
      new THREE.Color('#ffff00'), new THREE.Color('#ff00ff'), new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < lightCount; i++) {
        const yNorm = Math.pow(Math.random(), 0.7); 
        const y = (1 - yNorm) * height - (height / 2);
        const r = getTreeRadius(y, height, maxRadius);
        const angle = Math.random() * Math.PI * 2;
        const radius = r + 0.1 + Math.random() * 0.4; 
        
        positions[i*3] = Math.cos(angle) * radius;
        positions[i*3+1] = y;
        positions[i*3+2] = Math.sin(angle) * radius;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;

        sizes[i] = Math.random() * 0.4 + 0.2;
        speeds[i] = Math.random() * 3 + 1; 
        offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, sizes, speeds, offsets };
  }, []);

  // --- 2. Instance Data Generation ---
  const baubleCount = 45;
  const bellCount = 20;
  
  // Stockings Data
  const stockingsData = useMemo(() => {
      const data = [];
      const count = 18;
      for(let i=0; i<count; i++){
          const yNorm = 0.1 + (Math.random() * 0.6); 
          const y = (1 - yNorm) * height - (height / 2);
          const r = getTreeRadius(y, height, maxRadius);
          const angle = Math.random() * Math.PI * 2;
          const radius = r - 0.2; 
          
          const scale = 0.8 + Math.random() * 0.4; // Vary size
          const texture = stockingTextures[Math.floor(Math.random() * stockingTextures.length)];

          data.push({
              position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
              rotation: [0, -angle, 0] as [number, number, number], // Face outward
              scale,
              texture
          });
      }
      return data;
  }, [stockingTextures]);

  // Layout Effects for Instanced Meshes
  React.useLayoutEffect(() => {
    // Baubles
    if(baublesRef.current) {
        const baubleColors = [
            new THREE.Color("#ef4444"), new THREE.Color("#fbbf24"), new THREE.Color("#3b82f6"),
            new THREE.Color("#ec4899"), new THREE.Color("#8b5cf6"), new THREE.Color("#10b981"),
            new THREE.Color("#f43f5e"),
        ];
        for(let i=0; i<baubleCount; i++){
            const minH = 0.15;
            const yNorm = minH + (Math.pow(Math.random(), 0.9) * (1 - minH));
            const y = (1 - yNorm) * height - (height / 2);
            const r = getTreeRadius(y, height, maxRadius);
            const angle = Math.random() * Math.PI * 2;
            const radius = r - 0.3; 
            
            tempObject.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
            const scale = Math.random() * 0.15 + 0.15;
            tempObject.scale.set(scale, scale, scale);
            tempObject.rotation.set(0, 0, 0);
            tempObject.updateMatrix();
            baublesRef.current.setMatrixAt(i, tempObject.matrix);
            baublesRef.current.setColorAt(i, baubleColors[Math.floor(Math.random() * baubleColors.length)]);
        }
        baublesRef.current.instanceMatrix.needsUpdate = true;
        if (baublesRef.current.instanceColor) baublesRef.current.instanceColor.needsUpdate = true;
    }

    // Bells
    if(bellsRef.current) {
        for(let i=0; i<bellCount; i++){
            const yNorm = 0.2 + (Math.random() * 0.7); 
            const y = (1 - yNorm) * height - (height / 2);
            const r = getTreeRadius(y, height, maxRadius);
            const angle = Math.random() * Math.PI * 2;
            const radius = r - 0.2; 
            
            tempObject.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
            const scale = 1.0; 
            tempObject.scale.set(scale, scale, scale);
            tempObject.rotation.set(0.1, Math.random() * Math.PI, 0.1); 
            
            tempObject.updateMatrix();
            bellsRef.current.setMatrixAt(i, tempObject.matrix);
            bellsRef.current.setColorAt(i, new THREE.Color("#FFD700"));
        }
        bellsRef.current.instanceMatrix.needsUpdate = true;
        if (bellsRef.current.instanceColor) bellsRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  // --- 3. Tinsel ---
  const tinselGeometry = useMemo(() => {
      const points = [];
      const loops = 9;
      const pointsPerLoop = 40;
      const totalPoints = loops * pointsPerLoop;
      
      const topOffset = 1.0; 
      const startY = (height / 2) - topOffset;
      const endY = -(height / 2);
      const totalH = startY - endY;

      for(let i=0; i<=totalPoints; i++) {
          const t = i / totalPoints;
          const y = startY - (t * totalH); 
          const r = getTreeRadius(y, height, maxRadius) + 0.2; 
          const angle = t * loops * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 400, 0.08, 16, false);
  }, []);

  // Animation Loop
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const rotationStep = delta * 0.15 * speed;

    if (lightsRef.current) {
        lightsRef.current.rotation.y += rotationStep;
        const sizes = lightsRef.current.geometry.attributes.size.array as Float32Array;
        for (let i = 0; i < lightCount; i++) {
            const blink = Math.sin(time * lightsData.speeds[i] + lightsData.offsets[i]);
            sizes[i] = lightsData.sizes[i] * (blink > 0 ? 1 : 0.2); 
        }
        lightsRef.current.geometry.attributes.size.needsUpdate = true;
    }
    if (baublesRef.current) baublesRef.current.rotation.y += rotationStep;
    if (bellsRef.current) bellsRef.current.rotation.y += rotationStep;
    if (tinselRef.current) tinselRef.current.rotation.y += rotationStep;
  });

  // Calculate Stocking Group Rotation manually to match scene rotation
  const stockingGroupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
      if(stockingGroupRef.current) {
          stockingGroupRef.current.rotation.y += delta * 0.15 * speed;
      }
  });

  return (
    <group>
        {/* Lights */}
        <points ref={lightsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={lightsData.positions.length / 3} array={lightsData.positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={lightsData.colors.length / 3} array={lightsData.colors} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={lightsData.sizes.length} array={lightsData.sizes} itemSize={1} />
            </bufferGeometry>
            <pointsMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation map={getGlowTexture()} alphaTest={0.01} opacity={0.9} />
        </points>

        {/* Baubles */}
        <instancedMesh ref={baublesRef} args={[undefined, undefined, baubleCount]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.1} metalness={1.0} clearcoat={1.0} clearcoatRoughness={0.1} envMapIntensity={2.5} />
        </instancedMesh>

        {/* Bells - Conditionally Visible */}
        <instancedMesh ref={bellsRef} args={[undefined, undefined, bellCount]} visible={showBells}>
            <primitive object={bellGeometry} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={1.0} envMapIntensity={2.0} />
        </instancedMesh>

        {/* Stockings - Rendered individually for variance - Conditionally Visible */}
        <group ref={stockingGroupRef} visible={showStockings}>
            {stockingsData.map((data, index) => (
                <StockingMesh 
                    key={`stocking-${index}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    texture={data.texture}
                />
            ))}
        </group>

        {/* Tinsel */}
        <mesh ref={tinselRef} geometry={tinselGeometry}>
            <meshPhysicalMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} roughness={0.15} metalness={1.0} clearcoat={1.0} clearcoatRoughness={0.1} envMapIntensity={3.0} iridescence={0.2} iridescenceIOR={1.4} />
        </mesh>
    </group>
  );
};

function getGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if(context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}