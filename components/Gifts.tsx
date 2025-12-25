
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  speed: number;
  visible: boolean;
}

// 辅助函数：创建条纹贴图
const createStripeTexture = (color1: string, color2: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = color2;
        const thickness = 16;
        for (let i = -64; i < 128; i += thickness * 2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + thickness, 0);
            ctx.lineTo(i + thickness - 64, 64);
            ctx.lineTo(i - 64, 64);
            ctx.fill();
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4); 
    return texture;
};

const Gifts: React.FC<Props> = ({ speed, visible }) => {
  const groupRef = useRef<THREE.Group>(null!);
  
  // InstancedMesh Refs
  const boxRef = useRef<THREE.InstancedMesh>(null!);
  const ribbonXRef = useRef<THREE.InstancedMesh>(null!);
  const ribbonZRef = useRef<THREE.InstancedMesh>(null!);
  const bowRef = useRef<THREE.InstancedMesh>(null!);
  
  // 糖果棒使用多个实例组，每个组对应一种贴图
  const caneRef1 = useRef<THREE.InstancedMesh>(null!);
  const caneRef2 = useRef<THREE.InstancedMesh>(null!);
  const caneRef3 = useRef<THREE.InstancedMesh>(null!);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bowGeo = useMemo(() => new THREE.BoxGeometry(0.2, 0.2, 0.2), []); // 极简蝴蝶结
  const caneGeo = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 1.0, 0),     
          new THREE.Vector3(0.1, 1.3, 0),   
          new THREE.Vector3(0.35, 1.35, 0), 
          new THREE.Vector3(0.5, 1.1, 0),   
      ]);
      return new THREE.TubeGeometry(curve, 16, 0.06, 8, false);
  }, []);

  const caneTextures = useMemo(() => [
      createStripeTexture('#ffffff', '#dc2626'),
      createStripeTexture('#ffffff', '#15803d'),
      createStripeTexture('#ffffff', '#b45309'),
  ], []);

  const giftData = useMemo(() => {
    const data: any[] = [];
    const wrappingColors = ['#ef4444', '#166534', '#1e40af', '#fbbf24', '#ffffff', '#4c1d95', '#9f1239'];
    const ribbonColors = ['#ffd700', '#c0c0c0', '#ffffff', '#fcd34d'];

    const addGift = (x: number, z: number, yBase: number, scaleMod: number) => {
        const w = (0.5 + Math.random() * 0.6) * scaleMod;
        const h = (0.4 + Math.random() * 0.5) * scaleMod;
        const d = (0.5 + Math.random() * 0.6) * scaleMod;
        data.push({
            pos: [x, yBase + h/2, z],
            rot: [0, Math.random() * Math.PI * 2, 0],
            size: [w, h, d],
            color: new THREE.Color(wrappingColors[Math.floor(Math.random() * wrappingColors.length)]),
            ribbonColor: new THREE.Color(ribbonColors[Math.floor(Math.random() * ribbonColors.length)])
        });
    };

    // 基础层
    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.0 + Math.random() * 5.0;
        addGift(Math.cos(angle) * radius, Math.sin(angle) * radius, -6.01, 1.0);
    }
    // 堆叠层
    for (let i = 0; i < 60; i++) {
        const parent = data[Math.floor(Math.random() * 80)];
        addGift(parent.pos[0] + (Math.random()-0.5)*0.3, parent.pos[2] + (Math.random()-0.5)*0.3, parent.pos[1] + parent.size[1]/2 - 0.05, 0.7);
    }
    return data;
  }, []);

  const caneData = useMemo(() => {
    const data: any[][] = [[], [], []];
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3.0 + Math.random() * 4.0;
        const texIdx = i % 3;
        data[texIdx].push({
            pos: [Math.cos(angle) * radius, -6, Math.sin(angle) * radius],
            rot: [(Math.random()-0.5)*0.5, Math.random()*Math.PI*2, (Math.random()-0.5)*0.5],
            scale: 0.8 + Math.random() * 0.4
        });
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    const temp = new THREE.Object3D();
    giftData.forEach((gift, i) => {
        // Box
        temp.position.set(...gift.pos as [number, number, number]);
        temp.rotation.set(...gift.rot as [number, number, number]);
        temp.scale.set(...gift.size as [number, number, number]);
        temp.updateMatrix();
        boxRef.current.setMatrixAt(i, temp.matrix);
        boxRef.current.setColorAt(i, gift.color);

        // Ribbon X
        temp.scale.set(gift.size[0] + 0.01, gift.size[1] + 0.01, gift.size[2] * 0.15);
        temp.updateMatrix();
        ribbonXRef.current.setMatrixAt(i, temp.matrix);
        ribbonXRef.current.setColorAt(i, gift.ribbonColor);

        // Ribbon Z
        temp.scale.set(gift.size[0] * 0.15, gift.size[1] + 0.01, gift.size[2] + 0.01);
        temp.updateMatrix();
        ribbonZRef.current.setMatrixAt(i, temp.matrix);
        ribbonZRef.current.setColorAt(i, gift.ribbonColor);

        // Bow
        temp.position.set(gift.pos[0], gift.pos[1] + gift.size[1]/2, gift.pos[2]);
        temp.scale.set(1.5, 0.5, 1.5);
        temp.updateMatrix();
        bowRef.current.setMatrixAt(i, temp.matrix);
        bowRef.current.setColorAt(i, gift.ribbonColor);
    });

    [caneRef1, caneRef2, caneRef3].forEach((ref, idx) => {
        caneData[idx].forEach((cane, i) => {
            temp.position.set(...cane.pos as [number, number, number]);
            temp.rotation.set(...cane.rot as [number, number, number]);
            temp.scale.set(cane.scale, cane.scale, cane.scale);
            temp.updateMatrix();
            ref.current.setMatrixAt(i, temp.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    boxRef.current.instanceMatrix.needsUpdate = true;
    ribbonXRef.current.instanceMatrix.needsUpdate = true;
    ribbonZRef.current.instanceMatrix.needsUpdate = true;
    bowRef.current.instanceMatrix.needsUpdate = true;
  }, [giftData, caneData]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1 * speed;
  });

  return (
    <group ref={groupRef} visible={visible}>
        {/* 礼物盒 */}
        <instancedMesh ref={boxRef} args={[boxGeo, undefined, giftData.length]}>
            <meshStandardMaterial roughness={0.3} metalness={0.1} />
        </instancedMesh>
        {/* 丝带 */}
        <instancedMesh ref={ribbonXRef} args={[boxGeo, undefined, giftData.length]}>
            <meshStandardMaterial roughness={0.2} metalness={0.8} />
        </instancedMesh>
        <instancedMesh ref={ribbonZRef} args={[boxGeo, undefined, giftData.length]}>
            <meshStandardMaterial roughness={0.2} metalness={0.8} />
        </instancedMesh>
        {/* 装饰扣 */}
        <instancedMesh ref={bowRef} args={[bowGeo, undefined, giftData.length]}>
            <meshStandardMaterial roughness={0.2} metalness={0.8} />
        </instancedMesh>

        {/* 糖果棒 */}
        <instancedMesh ref={caneRef1} args={[caneGeo, undefined, caneData[0].length]}>
            <meshStandardMaterial map={caneTextures[0]} roughness={0.2} />
        </instancedMesh>
        <instancedMesh ref={caneRef2} args={[caneGeo, undefined, caneData[1].length]}>
            <meshStandardMaterial map={caneTextures[1]} roughness={0.2} />
        </instancedMesh>
        <instancedMesh ref={caneRef3} args={[caneGeo, undefined, caneData[2].length]}>
            <meshStandardMaterial map={caneTextures[2]} roughness={0.2} />
        </instancedMesh>
    </group>
  );
};

export default Gifts;
