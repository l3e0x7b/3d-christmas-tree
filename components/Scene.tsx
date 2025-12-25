import React from 'react';
import { OrbitControls, PerspectiveCamera, Environment as TextureEnvironment } from '@react-three/drei';
import ParticleTree from './ParticleTree';
import TopStar from './TopStar';
import Environment from './Environment';
import { Decorations } from './Decorations';
import Gifts from './Gifts';

interface SceneProps {
  speed: number;
  showGifts: boolean;
  showStockings: boolean;
  showBells: boolean;
  showSnow: boolean;
}

const Scene: React.FC<SceneProps> = ({ speed, showGifts, showStockings, showBells, showSnow }) => {
  return (
    <>
      {/* Moved camera back from z:18 to z:25 and up slightly to y:3 to frame the gifts better */}
      <PerspectiveCamera makeDefault position={[0, 3, 25]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={8}
        maxDistance={40}
        autoRotate
        // Base max speed is 0.5, scaled by the slider value (0 to 1)
        autoRotateSpeed={0.5 * speed}
      />

      {/* 'lobby' provides warm interior reflections perfect for metallic baubles */}
      <TextureEnvironment preset="lobby" background={false} />

      <ambientLight intensity={0.4} />
      
      {/* Warmer main light - Increased intensity for better highlights */}
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#fff7ed" />
      
      {/* Cooler fill light - Increased for volume definition */}
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#1e40af" />
      
      {/* Strong top-down spot light to catch the edges of baubles and tinsel */}
      <spotLight 
        position={[0, 15, 0]} 
        intensity={2.5} 
        angle={0.6} 
        penumbra={0.5} 
        color="#ffffff" 
        distance={40}
        decay={2}
      />

      <group position={[0, 0, 0]}>
        <ParticleTree speed={speed} />
        <Decorations 
            speed={speed} 
            showStockings={showStockings}
            showBells={showBells}
        />
        <TopStar speed={speed} />
        {/* Gifts placed at the base, now rotating with the tree. Visibility controlled by prop. */}
        <Gifts speed={speed} visible={showGifts} />
      </group>
      
      {/* Background Particles/Stars */}
      <Environment showSnow={showSnow} />
    </>
  );
};

export default Scene;