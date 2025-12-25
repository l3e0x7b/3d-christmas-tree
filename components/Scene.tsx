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
      <PerspectiveCamera makeDefault position={[0, 3, 25]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={8}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.5 * speed}
      />

      <TextureEnvironment preset="lobby" background={false} />

      <ambientLight intensity={0.4} />
      
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#fff7ed" />
      
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#1e40af" />
      
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
        <Gifts speed={speed} visible={showGifts} />
      </group>
      
      {/* 移除了 Room 背景与墙面挂灯 */}
      
      <Environment showSnow={showSnow} />
    </>
  );
};

export default Scene;