import { Canvas, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Html, OrbitControls, RoundedBox, SoftShadows, Text } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getStallLevel } from "../glucose";
import type { GlucoseLevel, Stall } from "../types";

type CanteenMapProps = {
  stalls: Stall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const palette = {
  cream: "#f5ead8",
  counter: "#f7f4ee",
  counterTop: "#fff0c9",
  tile: "#ead8bd",
  grout: "#c5ad85",
  wood: "#d9b98a",
  woodLight: "#e8c897",
  wall: "#e8c99e",
  wallUpper: "#f9eddc",
  glass: "#dcefed",
  plant: "#8fc65c",
  plantLight: "#c7e57d",
  sauce: "#6f3518",
  foodOrange: "#ee8a24",
  foodYellow: "#f0c75f",
  foodGreen: "#78b85d"
};

const levelTheme: Record<GlucoseLevel, { sign: string; border: string; text: string; glow: string }> = {
  low: { sign: "#cddfb3", border: "#95b36f", text: "#526c3f", glow: "#c9ef9a" },
  medium: { sign: "#ead07f", border: "#c99e3f", text: "#7a5927", glow: "#ffe29a" },
  high: { sign: "#dfa395", border: "#bf7566", text: "#7a4038", glow: "#ffc0b1" },
  insufficient: { sign: "#dad6ce", border: "#aaa49a", text: "#676158", glow: "#f1eadf" }
};

export function CanteenMap({ stalls, selectedId, onSelect }: CanteenMapProps) {
  const compactRenderer = useMemo(() => {
    if (typeof window === "undefined") return false;
    const mobileAgent = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return mobileAgent || window.innerWidth < 980 || window.innerHeight < 560;
  }, []);

  return (
    <div className="canvas-wrap">
      <Canvas
        shadows={compactRenderer ? false : { type: THREE.PCFSoftShadowMap }}
        dpr={compactRenderer ? [0.55, 0.9] : [0.85, 1.35]}
        gl={{ antialias: !compactRenderer, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 10.2, 12.6], fov: 37 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = compactRenderer ? 1.22 : 1.3;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={["#e4f6ff"]} />
        <ambientLight intensity={compactRenderer ? 0.68 : 0.74} color="#fff1dc" />
        <hemisphereLight args={["#fff8ea", "#d6b98a", compactRenderer ? 0.64 : 0.74]} />
        <directionalLight
          position={[-8, 12, 8]}
          intensity={compactRenderer ? 1.78 : 2.12}
          color="#fff1d6"
          castShadow
          shadow-mapSize={compactRenderer ? [1024, 1024] : [2048, 2048]}
          shadow-radius={18}
          shadow-bias={-0.00012}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-camera-near={1}
          shadow-camera-far={34}
        />
        <directionalLight position={[5, 7, -5]} intensity={0.08} color="#fff7e8" />
        <directionalLight position={[-5, 4, -8]} intensity={0.24} color="#e7fff2" />
        <pointLight position={[-8.5, 3.4, -3]} intensity={0.68} color="#ffd37a" distance={9.2} decay={2} />
        <pointLight position={[5.6, 2.8, -4.6]} intensity={0.38} color="#ffdca0" distance={7.8} decay={2} />
        {!compactRenderer && <SoftShadows size={22} samples={8} focus={0.5} />}
        <SceneRig />
        <SkyWorld />
        <InteriorShell />
        <Floor />
        <WallDetails />
        {!compactRenderer && <Sunbeams />}
        {!compactRenderer && <AmbientLightWash />}
        {stalls.map((stall) => (
          <StallModel key={stall.id} stall={stall} selected={stall.id === selectedId} onSelect={onSelect} />
        ))}
        <SeatingArea />
        <AmbientPlants />
        <PlanterStrip />
        <ContactShadows position={[0, 0.018, 0]} opacity={compactRenderer ? 0.14 : 0.22} scale={31} blur={7.2} far={10} color="#8a6138" />
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={7.5}
          maxDistance={42}
          minPolarAngle={0.42}
          maxPolarAngle={1.34}
          target={[0, 0.18, -1.0]}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <div className="drag-hint">单指拖拽旋转 · 双指平移/缩放 · 点击档口查看记录</div>
    </div>
  );
}

function SceneRig() {
  const { camera, controls } = useThree();
  useEffect(() => {
    const applyResponsiveCamera = () => {
      const landscape = window.innerWidth > window.innerHeight;
      const cramped = landscape && window.innerHeight < 520;
      const wide = window.innerWidth / Math.max(window.innerHeight, 1) > 2.05;
      const y = cramped ? 11.7 : 10.2;
      const z = cramped ? (wide ? 15.8 : 14.6) : 12.6;
      camera.position.set(0, y, z);
      camera.lookAt(0, 0.18, -1.0);
      if (controls && "target" in controls) {
        const orbit = controls as unknown as { target: THREE.Vector3; update: () => void };
        orbit.target.set(0, 0.18, -1.0);
        orbit.update();
      }
    };
    const reset = () => {
      applyResponsiveCamera();
    };
    applyResponsiveCamera();
    window.addEventListener("reset-camera", reset);
    window.addEventListener("resize", applyResponsiveCamera);
    window.addEventListener("orientationchange", applyResponsiveCamera);
    return () => {
      window.removeEventListener("reset-camera", reset);
      window.removeEventListener("resize", applyResponsiveCamera);
      window.removeEventListener("orientationchange", applyResponsiveCamera);
    };
  }, [camera, controls]);
  return null;
}

function SkyWorld() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.055, 0.1]}>
        <planeGeometry args={[48, 32]} />
        <meshStandardMaterial color="#d7eba6" roughness={0.92} metalness={0} envMapIntensity={0.03} />
      </mesh>
      <Cloud position={[-11.2, 4.25, -11.8]} scale={0.9} />
      <Cloud position={[-3.6, 4.9, -12.6]} scale={0.72} />
      <Cloud position={[7.8, 4.45, -12.2]} scale={0.95} />
    </group>
  );
}

function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [-0.56, 0, 0, 0.42],
        [-0.18, 0.1, 0.02, 0.55],
        [0.28, 0.05, 0, 0.48],
        [0.66, -0.02, 0.01, 0.34],
        [0.02, -0.16, 0.02, 0.44]
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]} scale={[1.45, 0.72, 0.42]}>
          <sphereGeometry args={[radius, 18, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} emissive="#fffaf0" emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function matte(color: string, roughness = 0.78) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0} envMapIntensity={0.04} />;
}

function WoodMaterial({ color = palette.woodLight, roughness = 0.62 }: { color?: string; roughness?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < canvas.width; x += 5) {
      const alpha = 0.08 + ((x * 13) % 17) / 220;
      ctx.strokeStyle = `rgba(92, 56, 28, ${alpha})`;
      ctx.lineWidth = x % 3 === 0 ? 1.2 : 0.55;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(x) * 2, 0);
      for (let y = 0; y <= canvas.height; y += 12) {
        ctx.lineTo(x + Math.sin(y * 0.045 + x * 0.08) * 4, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 37) % canvas.width;
      ctx.strokeStyle = "rgba(255, 238, 194, 0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 12, 60, x - 10, 140, x + 8, 256);
      ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1.8, 1.2);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [color]);

  return <meshStandardMaterial color={color} map={texture ?? undefined} roughness={roughness} metalness={0} envMapIntensity={0.05} />;
}

function TileMaterial() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#efdcc0";
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) {
      for (let x = 0; x < 512; x += 64) {
        const warm = 226 + ((x + y) % 4) * 3;
        ctx.fillStyle = `rgba(${warm}, ${212 + ((x * y) % 6)}, ${184 + ((x + y) % 8)}, 0.07)`;
        ctx.fillRect(x + 2, y + 2, 60, 60);
        ctx.strokeStyle = "rgba(150, 117, 75, 0.055)";
        ctx.lineWidth = 0.55;
        ctx.strokeRect(x + 1.5, y + 1.5, 61, 61);
        ctx.strokeStyle = "rgba(255, 250, 235, 0.08)";
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 18 + ((x + y) % 12));
        ctx.bezierCurveTo(x + 22, y + 4, x + 36, y + 58, x + 58, y + 35);
        ctx.stroke();
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(4.5, 2.65);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  return <meshStandardMaterial color="#eedabc" map={texture ?? undefined} roughness={0.66} metalness={0} envMapIntensity={0.1} />;
}

function CeramicMaterial({ color = palette.counterTop }: { color?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 380; i += 1) {
      const x = (i * 47) % 256;
      const y = (i * 83) % 256;
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.18)" : "rgba(171,139,93,0.055)";
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1.2, 1.2);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [color]);

  return <meshStandardMaterial color={color} map={texture ?? undefined} roughness={0.76} metalness={0} envMapIntensity={0.06} />;
}

function WallPaintMaterial({ color = palette.wallUpper }: { color?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i += 1) {
      const x = (i * 31) % 256;
      const y = (i * 67) % 256;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.08)" : "rgba(173,137,88,0.035)";
      ctx.fillRect(x, y, 1, 1);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(5, 2);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [color]);

  return <meshStandardMaterial color={color} map={texture ?? undefined} roughness={0.86} metalness={0} envMapIntensity={0.05} />;
}

function Floor() {
  const xLines = Array.from({ length: 30 }, (_, index) => -14.4 + index);
  const zLines = Array.from({ length: 18 }, (_, index) => -8 + index);
  const microLines = Array.from({ length: 18 }, (_, index) => -8.1 + index * 0.95);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.035, 0.05]}>
        <planeGeometry args={[28.8, 16.6]} />
        <TileMaterial />
      </mesh>
      {xLines.map((x) => (
        <mesh key={`floor-x-${x}`} position={[x, 0.002, 0.05]}>
          <boxGeometry args={[0.018, 0.012, 16.45]} />
          <meshStandardMaterial color={palette.grout} roughness={0.82} metalness={0} transparent opacity={0.12} />
        </mesh>
      ))}
      {zLines.map((z) => (
        <mesh key={`floor-z-${z}`} position={[0, 0.003, z]}>
          <boxGeometry args={[28.65, 0.012, 0.018]} />
          <meshStandardMaterial color={palette.grout} roughness={0.82} metalness={0} transparent opacity={0.12} />
        </mesh>
      ))}
      {[-8.8, -5.2, -1.6, 2, 5.6].map((x, index) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, -0.24]} position={[x, 0.006, -1.6 + index * 1.15]}>
          <planeGeometry args={[4.4, 1.2]} />
          <meshBasicMaterial color="#fff0bf" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ))}
      {microLines.map((z, index) => (
        <mesh key={`floor-soft-grain-${index}`} rotation={[-Math.PI / 2, 0, 0.08]} position={[index % 2 ? 3.2 : -4.4, 0.007, z]}>
          <planeGeometry args={[7.2, 0.028]} />
          <meshBasicMaterial color="#fff8e7" transparent opacity={0.055} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function InteriorShell() {
  return (
    <group>
      <RoundedBox args={[28.8, 3.85, 0.28]} radius={0.14} smoothness={10} position={[0, 1.68, -7.72]} receiveShadow castShadow>
        <WallPaintMaterial color={palette.wallUpper} />
      </RoundedBox>
      <RoundedBox args={[28.6, 1.28, 0.32]} radius={0.12} smoothness={10} position={[0, 0.58, -7.5]} receiveShadow castShadow>
        <WoodMaterial color={palette.wall} roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[28.65, 0.2, 0.2]} radius={0.08} smoothness={8} position={[0, 1.25, -7.28]}>
        {matte(palette.woodLight, 0.68)}
      </RoundedBox>
      <RoundedBox args={[0.28, 3.75, 16.3]} radius={0.14} smoothness={10} position={[-14.1, 1.62, 0.15]} receiveShadow castShadow>
        <WallPaintMaterial color={palette.wallUpper} />
      </RoundedBox>
      <RoundedBox args={[0.32, 1.18, 16.1]} radius={0.12} smoothness={10} position={[-13.9, 0.52, 0.15]} receiveShadow castShadow>
        <WoodMaterial color={palette.wall} roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[0.28, 3.75, 16.3]} radius={0.14} smoothness={10} position={[14.1, 1.62, 0.15]} receiveShadow castShadow>
        <WallPaintMaterial color="#f6e7ce" />
      </RoundedBox>
      <group position={[-13.82, 2.22, -2.35]} rotation-y={Math.PI / 2}>
        <RoundedBox args={[8.2, 2.08, 0.12]} radius={0.1} smoothness={10}>
          <meshStandardMaterial color="#fff6dc" roughness={0.7} metalness={0} emissive="#ffe7ad" emissiveIntensity={0.08} />
        </RoundedBox>
        <WindowGardenView />
        <RoundedBox args={[7.74, 1.72, 0.14]} radius={0.045} smoothness={6} position={[0, 0, 0.085]}>
          <meshStandardMaterial
            color="#eafaff"
            transparent
            opacity={0.24}
            roughness={0.32}
            metalness={0}
            depthWrite={false}
          />
        </RoundedBox>
        <mesh position={[-2.25, 0.08, 0.17]} rotation-z={-0.18}>
          <planeGeometry args={[0.11, 1.48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
        </mesh>
        <mesh position={[1.05, 0.02, 0.171]} rotation-z={-0.18}>
          <planeGeometry args={[0.07, 1.42]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} />
        </mesh>
        {[-2.58, 0, 2.58].map((x) => (
          <mesh key={`window-mullion-${x}`} position={[x, 0, 0.12]}>
            <boxGeometry args={[0.04, 1.64, 0.045]} />
            <meshStandardMaterial color="#f7e8c5" roughness={0.78} metalness={0} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.125]}>
          <boxGeometry args={[7.46, 0.04, 0.045]} />
          <meshStandardMaterial color="#f7e8c5" roughness={0.78} metalness={0} />
        </mesh>
        <RoundedBox args={[8.05, 0.14, 0.2]} radius={0.04} smoothness={8} position={[0, -1.12, 0.08]}>
          <WoodMaterial color="#e6bd80" roughness={0.68} />
        </RoundedBox>
      </group>
      <OutsideTree />
    </group>
  );
}

function WindowGardenView() {
  const foliage = [
    [-2.95, 0.18, 1.06, "#8ec160"],
    [-2.25, 0.42, 1.22, "#b1d879"],
    [-1.45, 0.26, 1.1, "#79b352"],
    [-0.55, 0.48, 1.28, "#a8d66d"],
    [0.35, 0.28, 1.16, "#86bf5a"],
    [1.18, 0.52, 1.26, "#b8dc7b"],
    [2.0, 0.3, 1.14, "#83b957"],
    [2.78, 0.15, 0.98, "#a8d66d"],
    [-2.55, -0.18, 0.86, "#b7d978"],
    [-0.95, -0.12, 0.82, "#91c764"],
    [0.88, -0.16, 0.86, "#b7dc82"],
    [2.42, -0.18, 0.82, "#8ebf58"]
  ] as const;
  const flowers = [-3.25, -2.82, -2.28, -1.72, -1.16, -0.62, -0.08, 0.5, 1.02, 1.58, 2.1, 2.68, 3.18];

  return (
    <group position={[0, 0, 0.045]}>
      <RoundedBox args={[7.52, 1.5, 0.035]} radius={0.035} smoothness={6}>
        <meshBasicMaterial color="#dff3ff" />
      </RoundedBox>
      <mesh position={[-2.7, 0.44, 0.025]} rotation-z={0.08}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#fff1ad" transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, -0.46, 0.026]}>
        <planeGeometry args={[7.18, 0.28]} />
        <meshBasicMaterial color="#d8ecaa" transparent opacity={0.74} />
      </mesh>
      <mesh position={[-0.18, -0.3, 0.035]}>
        <cylinderGeometry args={[0.06, 0.12, 1.28, 10]} />
        <meshBasicMaterial color="#9b6a36" />
      </mesh>
      {foliage.map(([x, y, scale, color], index) => (
        <mesh key={index} position={[x, y - 0.08, 0.04]} scale={[scale * 1.2, scale * 0.72, scale]}>
          <circleGeometry args={[0.42, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      {flowers.map((x, index) => (
        <mesh key={`window-flower-${index}`} position={[x, -0.02 + (index % 5) * 0.13, 0.058]}>
          <circleGeometry args={[0.035, 10]} />
          <meshBasicMaterial color={index % 3 ? "#fffdf2" : "#f7f1d2"} />
        </mesh>
      ))}
      {[0.22, 0.55, 0.82].map((opacity, index) => (
        <mesh key={`window-ray-${index}`} position={[-2.2 + index * 1.5, 0.08 - index * 0.08, 0.06]} rotation-z={-0.26}>
          <planeGeometry args={[0.28, 1.65]} />
          <meshBasicMaterial color="#fff2bd" transparent opacity={opacity * 0.14} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function OutsideTree() {
  return (
    <group position={[-14.85, 0.18, -3.85]}>
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 1.6, 12]} />
        <meshStandardMaterial color="#9b6a36" roughness={0.78} metalness={0} />
      </mesh>
      {[
        [0, 1.72, 0, 0.72],
        [-0.28, 1.5, -0.34, 0.56],
        [0.28, 1.48, 0.34, 0.55],
        [-0.2, 2.02, 0.26, 0.5],
        [0.36, 1.92, -0.18, 0.48],
        [-0.48, 1.82, 0.18, 0.42]
      ].map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} scale={[scale, scale * 0.88, scale]} castShadow>
          <sphereGeometry args={[0.52, 18, 10]} />
          <meshStandardMaterial color={index % 2 ? "#8ebf58" : "#b2d46b"} roughness={0.84} metalness={0} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={`tree-flower-${index}`} position={[-0.38 + index * 0.18, 1.9 + (index % 2) * 0.18, -0.22 + (index % 3) * 0.2]} castShadow>
          <sphereGeometry args={[0.045, 10, 6]} />
          <meshStandardMaterial color="#f2d45a" roughness={0.76} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Sunbeams() {
  const beams = [
    { position: [-8.6, 1.42, -2.9] as [number, number, number], scale: [5.8, 1.3] as [number, number], opacity: 0.1 },
    { position: [-6.2, 1.22, 0.05] as [number, number, number], scale: [6.5, 1.15] as [number, number], opacity: 0.075 },
    { position: [-4.2, 1.05, 2.9] as [number, number, number], scale: [5.7, 1.0] as [number, number], opacity: 0.055 }
  ];
  return (
    <group>
      <mesh position={[-10.6, 2.25, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7.8, 3.2]} />
        <meshBasicMaterial color="#fff0bd" transparent opacity={0.045} depthWrite={false} />
      </mesh>
      {beams.map((beam, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, -0.28]} position={beam.position}>
          <planeGeometry args={beam.scale} />
          <meshBasicMaterial color="#ffe7a7" transparent opacity={beam.opacity} depthWrite={false} />
        </mesh>
      ))}
      {[-6.2, -1.5, 3.2, 7.4].map((x, index) => (
        <mesh key={`counter-warm-halo-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.011, -2.05 + (index % 2) * 2.25]}>
          <circleGeometry args={[1.7, 36]} />
          <meshBasicMaterial color="#ffe3a1" transparent opacity={0.035} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function AmbientLightWash() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, -0.12]} position={[-3.4, 0.012, -1.2]}>
        <planeGeometry args={[12.2, 5.4]} />
        <meshBasicMaterial color="#fff4ce" transparent opacity={0.055} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.18]} position={[4.8, 0.013, 1.8]}>
        <planeGeometry args={[8.2, 4.6]} />
        <meshBasicMaterial color="#dff6df" transparent opacity={0.028} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.55, -7.08]}>
        <planeGeometry args={[22, 1.55]} />
        <meshBasicMaterial color="#fff0bd" transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </group>
  );
}

function WallDetails() {
  const wallLamps = [-10.2, -6.4, -2.6, 1.2, 5, 8.8, 12];
  const posters = [-7.8, -0.8, 6.4];
  return (
    <group>
      {Array.from({ length: 23 }).map((_, index) => (
        <mesh key={`wainscot-${index}`} position={[-13.2 + index * 1.2, 0.62, -7.31]}>
          <boxGeometry args={[0.018, 1.05, 0.035]} />
          <meshStandardMaterial color="#c99d65" roughness={0.76} metalness={0} transparent opacity={0.38} />
        </mesh>
      ))}
      {wallLamps.map((x, index) => (
        <group key={x} position={[x, 2.27, -7.18]}>
          <mesh position={[0, -0.38, -0.01]}>
            <cylinderGeometry args={[0.028, 0.035, 0.58, 10]} />
            <meshStandardMaterial color="#8b5a2d" roughness={0.78} metalness={0} />
          </mesh>
          <RoundedBox args={[0.22, 0.08, 0.08]} radius={0.025} smoothness={6} position={[0, -0.68, 0]}>
            <meshStandardMaterial color="#9a6633" roughness={0.76} metalness={0} />
          </RoundedBox>
          <mesh position={[0, -0.02, -0.02]}>
            <planeGeometry args={[1.08, 1.18]} />
            <meshBasicMaterial color="#ffd37a" transparent opacity={0.2} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.02, -0.021]}>
            <planeGeometry args={[0.62, 0.78]} />
            <meshBasicMaterial color="#fff0ba" transparent opacity={0.24} depthWrite={false} />
          </mesh>
          <RoundedBox args={[0.38, 0.5, 0.12]} radius={0.08} smoothness={10}>
            <meshStandardMaterial color="#fff0c7" roughness={0.58} metalness={0} emissive="#ffbd60" emissiveIntensity={0.55} />
          </RoundedBox>
          <pointLight position={[0, -0.06, 0.22]} intensity={0.28 + (index % 2) * 0.045} color="#ffd37a" distance={3.6} decay={2} />
        </group>
      ))}
      {posters.map((x, index) => (
        <group key={x} position={[x, 1.83, -7.14]}>
          <RoundedBox args={[0.72, 0.86, 0.04]} radius={0.035} smoothness={6}>
            {matte("#f8ead1", 0.8)}
          </RoundedBox>
          <mesh position={[0, 0.12, 0.032]}>
            <circleGeometry args={[0.11, 18]} />
            <meshStandardMaterial color={index % 2 ? palette.plantLight : palette.foodOrange} roughness={0.72} metalness={0} />
          </mesh>
          <mesh position={[-0.12, -0.14, 0.032]}>
            <boxGeometry args={[0.28, 0.05, 0.02]} />
            <meshStandardMaterial color={palette.wood} roughness={0.76} metalness={0} />
          </mesh>
          <mesh position={[0.14, -0.24, 0.032]}>
            <boxGeometry args={[0.24, 0.05, 0.02]} />
            <meshStandardMaterial color={palette.woodLight} roughness={0.76} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StallModel({ stall, selected, onSelect }: { stall: Stall; selected: boolean; onSelect: (id: string) => void }) {
  const level = getStallLevel(stall);
  const theme = levelTheme[level];
  const category = getCategoryTheme(stall);
  const width = stall.size[0];
  const depth = stall.size[2];
  const isLarge = width > 3;
  const foodCount = Math.max(5, Math.min(9, Math.round(width * 1.35)));
  const signOuterWidth = Math.min(width * 0.98, isLarge ? 5.12 : 2.22);
  const signInnerWidth = Math.min(width * 0.9, isLarge ? 4.78 : 2.02);
  const supportX = Math.min(width * 0.36, isLarge ? 1.95 : 0.78);

  return (
    <group position={stall.position} rotation-y={stall.rotation}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <circleGeometry args={[Math.max(width, depth) * 0.68, 40]} />
        <meshBasicMaterial color="#7d5833" transparent opacity={0.055} depthWrite={false} />
      </mesh>
      <RoundedBox args={[width * 1.08, 0.24, depth * 1.16]} radius={0.09} smoothness={10} position={[0, 0.12, 0]} castShadow receiveShadow>
        <WoodMaterial color={palette.wood} roughness={0.66} />
      </RoundedBox>
      <RoundedBox args={[width * 0.98, 0.16, depth * 1.02]} radius={0.085} smoothness={10} position={[0, 0.28, 0.02]} castShadow receiveShadow>
        <WoodMaterial color={palette.woodLight} roughness={0.64} />
      </RoundedBox>
      <RoundedBox args={[width, 0.62, depth]} radius={0.1} smoothness={12} position={[0, 0.48, 0]} castShadow receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(stall.id); }}>
        <CeramicMaterial color={category.body} />
      </RoundedBox>
      <RoundedBox args={[width * 0.88, 0.035, 0.055]} radius={0.025} smoothness={8} position={[0, 0.5, depth * 0.52]}>
        <meshBasicMaterial color="#fff9df" transparent opacity={0.32} />
      </RoundedBox>
      <RoundedBox args={[width * 0.98, 0.13, depth * 0.94]} radius={0.085} smoothness={10} position={[0, 0.84, 0]} castShadow receiveShadow>
        <CeramicMaterial color={palette.counterTop} />
      </RoundedBox>
      <RoundedBox args={[width * 0.92, 0.05, 0.08]} radius={0.035} smoothness={8} position={[0, 0.98, -depth * 0.44]}>
        <meshStandardMaterial color="#fff0bc" roughness={0.6} metalness={0} emissive="#ffd37a" emissiveIntensity={0.38} />
      </RoundedBox>
      <mesh rotation-x={-Math.PI / 2} position={[0, 1.002, -depth * 0.12]}>
        <planeGeometry args={[width * 0.84, depth * 0.74]} />
        <meshBasicMaterial color="#ffe3a1" transparent opacity={isLarge ? 0.09 : 0.07} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1.08, -depth * 0.18]} intensity={isLarge ? 0.32 : 0.22} color="#ffd37a" distance={2.6 + width * 0.32} decay={2} />

      {[-1, 1].map((side) => (
        <group key={`sign-post-${side}`} position={[side * supportX, 1.02, -depth * 0.48]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.58, 14]} />
            <meshStandardMaterial color="#b9a58a" roughness={0.78} metalness={0} />
          </mesh>
          <RoundedBox args={[0.18, 0.08, 0.16]} radius={0.025} smoothness={8} position={[0, -0.31, 0]}>
            {matte(palette.woodLight, 0.72)}
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[signOuterWidth, 0.6, 0.28]} radius={0.085} smoothness={12} position={[0, 1.28, -depth * 0.5]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.border} roughness={0.76} metalness={0} envMapIntensity={0.04} />
      </RoundedBox>
      <RoundedBox args={[signInnerWidth, 0.45, 0.3]} radius={0.075} smoothness={12} position={[0, 1.33, -depth * 0.39]} castShadow receiveShadow>
        <meshStandardMaterial color={level === "insufficient" ? "#dcdcdc" : theme.sign} roughness={0.82} metalness={0} envMapIntensity={0.035} />
      </RoundedBox>
      <RoundedBox args={[Math.min(width * 0.72, isLarge ? 3.85 : 1.5), 0.06, 0.24]} radius={0.025} smoothness={8} position={[0, 1.07, -depth * 0.43]}>
        <meshStandardMaterial color="#d2c7b5" roughness={0.78} metalness={0} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * Math.min(width * 0.39, isLarge ? 2.05 : 0.82), 1.31, -depth * 0.25]}>
          <sphereGeometry args={[0.038, 12, 8]} />
          <meshStandardMaterial color={theme.border} roughness={0.82} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0, 1.44, -depth * 0.27]}>
        <boxGeometry args={[Math.min(width * 0.64, isLarge ? 3.6 : 1.35), 0.032, 0.02]} />
        <meshBasicMaterial color="#fff8d6" transparent opacity={0.24} />
      </mesh>
      <Html
        center
        transform
        occlude
        distanceFactor={7.2}
        position={[0, 1.335, -depth * 0.245]}
      >
        <div
          className="stall-sign-print"
          style={{
            color: theme.text,
            width: `${Math.min(width * 68, isLarge ? 292 : 148)}px`,
            fontSize: `${Math.max(11, Math.min(isLarge ? 19 : 15, (width / Math.max(stall.name.length, 4)) * 46))}px`
          }}
        >
          {stall.name}
        </div>
      </Html>

      <FoodDisplay count={foodCount} width={width} depth={depth} category={category.icon} stallName={stall.name} />
      {isLarge && shouldShowCounterPot(stall.name, category.icon) && (
        <BigCounterPot position={[Math.min(width * 0.34, 1.8), 0.99, depth * 0.14]} />
      )}
      <StallDecor width={width} depth={depth} icon={category.icon} />

      {selected && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[Math.max(width, depth) * 0.5, Math.max(width, depth) * 0.57, 64]} />
          <meshBasicMaterial color={theme.border} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      )}
      <mesh position={[0, 0.6, 0]} onClick={(event) => { event.stopPropagation(); onSelect(stall.id); }}>
        <boxGeometry args={[width * 1.16, 1.35, depth * 1.28]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FoodDisplay({ count, width, depth, category, stallName }: { count: number; width: number; depth: number; category: string; stallName: string }) {
  const items = useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);
  const foodStyle = getStallFoodStyle(stallName, category);
  return (
    <group>
      {items.map((index) => {
        const x = -width * 0.36 + (index / Math.max(count - 1, 1)) * width * 0.72;
        const z = -depth * 0.12 + (index % 2) * depth * 0.22;
        const variant = index % 5;
        return (
          <group key={index} position={[x, 0.92, z]}>
            <RoundedBox args={[0.36, 0.035, 0.25]} radius={0.035} smoothness={8}>
              {matte("#fff7e9", 0.72)}
            </RoundedBox>
            {renderFoodForStyle(foodStyle, variant, category)}
          </group>
        );
      })}
    </group>
  );
}

function renderFoodForStyle(foodStyle: string, variant: number, category: string) {
  if (foodStyle === "burger") {
    return variant % 3 === 0 ? <BurgerSet /> : variant % 3 === 1 ? <DrinkPair /> : <DishPlate />;
  }
  if (foodStyle === "roast") {
    return variant % 4 === 0 ? <RoastChicken /> : variant % 4 === 1 ? <DishPlate /> : variant % 4 === 2 ? <RiceBowl /> : <SoupCup category={category} />;
  }
  if (foodStyle === "noodle") {
    return variant % 4 === 0 ? <NoodleBowl /> : variant % 4 === 1 ? <NoodlePlate /> : variant % 4 === 2 ? <SoupCup category="soup" /> : <DishPlate />;
  }
  if (foodStyle === "hotpot") {
    return variant % 4 === 0 ? <VegPot /> : variant % 4 === 1 ? <DishPlate /> : variant % 4 === 2 ? <SoupCup category="soup" /> : <RiceBowl />;
  }
  if (foodStyle === "rice") {
    return variant % 4 === 0 ? <RiceBowl /> : variant % 4 === 1 ? <DishPlate /> : variant % 4 === 2 ? <RoastChicken /> : <SoupCup category={category} />;
  }
  return variant === 0 ? <DishPlate /> : variant === 1 ? <NoodleBowl /> : variant === 2 ? <VegPot /> : variant === 3 ? <RoastChicken /> : <SoupCup category={category} />;
}

function FoodMounds({ colorA, colorB }: { colorA: string; colorB: string }) {
  return (
    <group>
      {[-0.08, 0, 0.08].map((x, index) => (
        <mesh key={index} position={[x, 0.065 + (index % 2) * 0.012, index === 1 ? 0.035 : -0.025]} scale={[1.12, 0.66, 0.95]} castShadow>
          <sphereGeometry args={[0.055, 16, 8]} />
          <meshStandardMaterial color={index === 1 ? colorB : colorA} roughness={0.62} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function RiceBowl() {
  return (
    <group position={[0, 0.058, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.105, 0.075, 20]} />
        <meshStandardMaterial color="#e7d9bd" roughness={0.72} metalness={0} />
      </mesh>
      <mesh position={[0, 0.055, 0]} scale={[1.1, 0.35, 1.1]} castShadow>
        <sphereGeometry args={[0.075, 16, 8]} />
        <meshStandardMaterial color="#fff8e8" roughness={0.66} metalness={0} />
      </mesh>
    </group>
  );
}

function NoodleBowl() {
  return (
    <group position={[0, 0.058, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.105, 0.12, 0.08, 22]} />
        <meshStandardMaterial color="#ead8b8" roughness={0.72} metalness={0} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.09, 24]} />
        <meshStandardMaterial color="#d78935" roughness={0.7} metalness={0} />
      </mesh>
      {[-0.045, 0, 0.045].map((x, index) => (
        <mesh key={index} position={[x, 0.075, -0.01 + index * 0.018]} rotation={[Math.PI / 2, 0, 0.45]}>
          <torusGeometry args={[0.04, 0.006, 8, 20]} />
          <meshStandardMaterial color="#f3c35b" roughness={0.66} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0.055, 0.095, 0.035]} scale={[1.15, 0.62, 0.86]} castShadow>
        <sphereGeometry args={[0.032, 12, 6]} />
        <meshStandardMaterial color={palette.foodGreen} roughness={0.76} metalness={0} />
      </mesh>
    </group>
  );
}

function DishPlate() {
  return (
    <group position={[0, 0.052, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.12, 26]} />
        <meshStandardMaterial color="#f8eed9" roughness={0.72} metalness={0} />
      </mesh>
      {[[-0.05, 0.025, palette.foodOrange], [0.01, 0.03, palette.sauce], [0.06, -0.025, palette.foodOrange]].map(([x, z, color], index) => (
        <RoundedBox key={index} args={[0.055, 0.035, 0.04]} radius={0.012} smoothness={5} position={[x as number, 0.035, z as number]} castShadow>
          <meshStandardMaterial color={color as string} roughness={0.62} metalness={0} />
        </RoundedBox>
      ))}
      {[[-0.03, -0.045], [0.045, 0.035], [0.0, 0.005]].map(([x, z], index) => (
        <mesh key={`veg-${index}`} position={[x, 0.055, z]} scale={[1.25, 0.62, 0.9]} castShadow>
          <sphereGeometry args={[0.032, 12, 6]} />
          <meshStandardMaterial color={index % 2 ? palette.plantLight : palette.foodGreen} roughness={0.74} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function RoastChicken() {
  return (
    <group position={[0, 0.058, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.115, 24]} />
        <meshStandardMaterial color="#f7ead4" roughness={0.72} metalness={0} />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation-z={-0.18} scale={[1.45, 0.82, 1.05]} castShadow>
        <sphereGeometry args={[0.065, 16, 8]} />
        <meshStandardMaterial color="#c8792e" roughness={0.58} metalness={0} />
      </mesh>
      {[[-0.075, -0.015, -0.55], [0.075, 0.018, 0.55]].map(([x, z, rot], index) => (
        <group key={index} position={[x, 0.055, z]} rotation-y={rot as number}>
          <mesh scale={[1.25, 0.72, 0.8]} castShadow>
            <sphereGeometry args={[0.036, 12, 6]} />
            <meshStandardMaterial color="#d58a3a" roughness={0.58} metalness={0} />
          </mesh>
          <mesh position={[0.035, -0.003, 0]}>
            <cylinderGeometry args={[0.012, 0.016, 0.055, 8]} />
            <meshStandardMaterial color="#f4dfbd" roughness={0.7} metalness={0} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.055, 0.095, 0.025]} scale={[1.1, 0.45, 0.8]}>
        <sphereGeometry args={[0.026, 10, 6]} />
        <meshStandardMaterial color="#f2b352" roughness={0.62} metalness={0} />
      </mesh>
    </group>
  );
}

function BurgerSet() {
  return (
    <group position={[0, 0.055, 0]}>
      <mesh position={[0, 0.035, 0]} scale={[1.38, 0.34, 1.02]} castShadow>
        <sphereGeometry args={[0.07, 18, 8]} />
        <meshStandardMaterial color="#e2a34a" roughness={0.62} metalness={0} />
      </mesh>
      <RoundedBox args={[0.16, 0.022, 0.105]} radius={0.012} smoothness={5} position={[0, 0.036, 0]} castShadow>
        <meshStandardMaterial color="#6f3518" roughness={0.66} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.15, 0.014, 0.095]} radius={0.01} smoothness={5} position={[0, 0.057, 0]} castShadow>
        <meshStandardMaterial color="#f3d35a" roughness={0.7} metalness={0} />
      </RoundedBox>
      <mesh position={[0, 0.078, 0]} scale={[1.45, 0.32, 1.05]} castShadow>
        <sphereGeometry args={[0.07, 18, 8]} />
        <meshStandardMaterial color="#f0b85d" roughness={0.58} metalness={0} />
      </mesh>
      {[-0.045, 0.02, 0.058].map((x, index) => (
        <mesh key={index} position={[x, 0.105, -0.018 + index * 0.014]}>
          <sphereGeometry args={[0.008, 8, 4]} />
          <meshStandardMaterial color="#fff1c2" roughness={0.8} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function VegPot() {
  return (
    <group position={[0, 0.055, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.135, 0.07, 22]} />
        <meshStandardMaterial color="#6f4b2a" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, 0.052, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.106, 22]} />
        <meshStandardMaterial color="#8b3b1b" roughness={0.68} metalness={0} />
      </mesh>
      {[
        [-0.055, 0.078, -0.025, palette.foodGreen],
        [-0.015, 0.087, 0.03, palette.foodOrange],
        [0.04, 0.08, -0.01, palette.plantLight],
        [0.065, 0.086, 0.035, palette.foodYellow]
      ].map(([x, y, z, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]} scale={[1.25, 0.7, 0.95]} castShadow>
          <sphereGeometry args={[0.03, 10, 6]} />
          <meshStandardMaterial color={color as string} roughness={0.7} metalness={0} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.13, 0.035, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.009, 0.009, 0.05, 8]} />
          <meshStandardMaterial color="#d8b06d" roughness={0.72} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function BigCounterPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.16, 28]} />
        <meshStandardMaterial color="#8f5a2c" roughness={0.68} metalness={0} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.225, 28]} />
        <meshStandardMaterial color="#8a351c" roughness={0.64} metalness={0} />
      </mesh>
      {[
        [-0.12, 0.14, -0.05, palette.foodGreen],
        [-0.04, 0.15, 0.06, palette.foodOrange],
        [0.06, 0.14, -0.02, palette.foodYellow],
        [0.13, 0.145, 0.055, "#a94d2a"],
        [0.0, 0.17, -0.09, palette.plantLight]
      ].map(([x, y, z, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]} scale={[1.35, 0.72, 1]} castShadow>
          <sphereGeometry args={[0.052, 14, 7]} />
          <meshStandardMaterial color={color as string} roughness={0.7} metalness={0} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.28, 0.04, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.016, 0.016, 0.09, 10]} />
          <meshStandardMaterial color="#d8b06d" roughness={0.72} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function SoupCup({ category }: { category: string }) {
  return (
    <group position={[0, 0.06, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.085, 0.095, 0.08, 20]} />
        <meshStandardMaterial color="#f2e4c7" roughness={0.72} metalness={0} />
      </mesh>
      <mesh position={[0, 0.052, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.072, 20]} />
        <meshStandardMaterial color={category === "soup" ? palette.foodYellow : palette.sauce} roughness={0.68} metalness={0} />
      </mesh>
    </group>
  );
}

function getStallFoodStyle(stallName: string, category: string) {
  const text = stallName;
  if (/肯德基|KFC/i.test(text)) return "burger";
  if (/烧腊|广味|三宝|潮|扒知味|烤|鹅|鸭/.test(text)) return "roast";
  if (/四川|重庆|小面|粉|面|鱼粉|老碗|腌面/.test(text)) return "noodle";
  if (/餐线|自选|下饭菜|小碗菜|盖浇|关东|炖|客家|壹品|德优/.test(text)) return "hotpot";
  if (/饭|拌饭|日式|东旭/.test(text)) return "rice";
  if (category === "grill") return "roast";
  if (category === "bowl") return "noodle";
  if (category === "soup" || category === "fast") return "hotpot";
  if (category === "rice") return "rice";
  return "mixed";
}

function shouldShowCounterPot(stallName: string, category: string) {
  return /东旭|广味|湘遇|三宝|自选|下饭|德优|关东|小碗|壹品|客家/.test(stallName) || category === "fast" || category === "soup";
}

function NoodlePlate() {
  return (
    <group position={[0, 0.06, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.105, 24]} />
        <meshStandardMaterial color="#f3e7cf" roughness={0.72} metalness={0} />
      </mesh>
      {[-0.05, 0, 0.05].map((x, index) => (
        <mesh key={index} position={[x, 0.04, -0.02 + index * 0.025]} rotation={[Math.PI / 2, 0, 0.5]} castShadow>
          <torusGeometry args={[0.045, 0.008, 8, 18]} />
          <meshStandardMaterial color={index % 2 ? "#f4bd55" : "#e2a53e"} roughness={0.66} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0.06, 0.075, 0.04]} castShadow>
        <sphereGeometry args={[0.03, 12, 6]} />
        <meshStandardMaterial color={palette.foodGreen} roughness={0.74} metalness={0} />
      </mesh>
    </group>
  );
}

function DrinkPair() {
  return (
    <group position={[0, 0.06, 0]}>
      {[-0.04, 0.055].map((x, index) => (
        <group key={x} position={[x, 0, index ? 0.02 : -0.02]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.038, 0.045, 0.095, 16]} />
            <meshStandardMaterial color={index ? "#f7d899" : "#d9edf0"} roughness={0.52} metalness={0} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.012, 16]} />
            <meshStandardMaterial color={index ? palette.foodOrange : palette.foodYellow} roughness={0.65} metalness={0} />
          </mesh>
          <mesh position={[0.032, 0.09, -0.018]} rotation-z={-0.18}>
            <cylinderGeometry args={[0.006, 0.006, 0.14, 8]} />
            <meshStandardMaterial color="#6d472a" roughness={0.78} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StallDecor({ width, depth, icon }: { width: number; depth: number; icon: string }) {
  return (
    <group>
      <TallPlant position={[-width * 0.66, 0.02, depth * 0.58]} scale={0.58} />
      {icon === "soup" || icon === "bowl" ? (
        <SoupPot position={[width * 0.42, 0.96, depth * 0.24]} />
      ) : (
        <CounterSideDish position={[width * 0.42, 0.96, depth * 0.26]} />
      )}
    </group>
  );
}

function MiniPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.2, 0.18, 0.2]} radius={0.04} smoothness={8}>
        {matte("#d9b179", 0.78)}
      </RoundedBox>
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh
          key={index}
          position={[Math.cos(index * 0.68) * (0.08 + (index % 3) * 0.012), 0.16 + (index % 3) * 0.035, Math.sin(index * 0.68) * (0.08 + (index % 2) * 0.014)]}
          rotation={[0.58, index * 0.68, 0.2]}
          scale={[0.78, 1.34, 0.46]}
          castShadow
        >
          <sphereGeometry args={[0.078, 14, 8]} />
          <meshStandardMaterial color={index % 2 ? palette.plant : palette.plantLight} roughness={0.82} metalness={0} />
        </mesh>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh
          key={`flower-${index}`}
          position={[Math.cos(index * 2.1) * 0.09, 0.29 + index * 0.018, Math.sin(index * 2.1) * 0.08]}
          castShadow
        >
          <sphereGeometry args={[0.026, 10, 6]} />
          <meshStandardMaterial color={index === 1 ? "#fff2a4" : "#f3cf54"} roughness={0.78} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function TallPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.34, 0.32, 0.34]} radius={0.07} smoothness={10} position={[0, 0.16, 0]} castShadow receiveShadow>
        {matte("#d8ad72", 0.78)}
      </RoundedBox>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 0.64, 10]} />
        <meshStandardMaterial color="#6f8e45" roughness={0.82} metalness={0} />
      </mesh>
      {Array.from({ length: 14 }).map((_, index) => {
        const angle = index * 0.58;
        const radius = 0.18 + (index % 3) * 0.035;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * radius, 0.72 + (index % 5) * 0.065, Math.sin(angle) * radius]}
            rotation={[0.7, angle, 0.18]}
            scale={[0.95, 1.65, 0.5]}
            castShadow
          >
            <sphereGeometry args={[0.105, 14, 8]} />
            <meshStandardMaterial color={index % 2 ? "#84b85a" : "#b7d978"} roughness={0.84} metalness={0} />
          </mesh>
        );
      })}
      {[0, 1, 2, 3].map((index) => (
        <mesh key={`tall-flower-${index}`} position={[Math.cos(index * 1.45) * 0.18, 1.06 + (index % 2) * 0.08, Math.sin(index * 1.45) * 0.16]} castShadow>
          <sphereGeometry args={[0.035, 10, 6]} />
          <meshStandardMaterial color="#f4d95c" roughness={0.78} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function SoupPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.12, 20]} />
        <meshStandardMaterial color="#efe4d0" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.1, 0.012, 8, 24]} />
        <meshStandardMaterial color={palette.foodYellow} roughness={0.72} metalness={0} />
      </mesh>
      <mesh position={[0.13, 0.13, -0.02]}>
        <boxGeometry args={[0.018, 0.3, 0.018]} />
        <meshStandardMaterial color={palette.sauce} roughness={0.7} metalness={0} />
      </mesh>
    </group>
  );
}

function CounterSideDish({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.12, 20]} />
        <meshStandardMaterial color="#f8ecd6" roughness={0.72} metalness={0} />
      </mesh>
      {[[-0.045, 0.01, palette.foodOrange], [0.025, -0.02, palette.foodYellow], [0.055, 0.035, palette.foodGreen]].map(([x, z, color], index) => (
        <mesh key={index} position={[x as number, 0.045, z as number]} scale={[1.15, 0.72, 0.95]} castShadow>
          <sphereGeometry args={[0.032, 12, 6]} />
          <meshStandardMaterial color={color as string} roughness={0.68} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0.14, 0.045, -0.02]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.08, 14]} />
        <meshStandardMaterial color="#e5c083" roughness={0.72} metalness={0} />
      </mesh>
    </group>
  );
}

function SeatingArea() {
  const seats = [
    [-9.2, 7.15],
    [-5.55, 7.15],
    [-1.85, 7.15],
    [1.85, 7.15],
    [5.55, 7.15],
    [9.2, 7.15]
  ];
  return (
    <group>
      <Billboard position={[0, 0.05, 7.65]}>
        <Text fontSize={0.18} color="#64748b" anchorX="center" anchorY="middle">
          座位区
        </Text>
      </Billboard>
      {seats.map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <RoundedBox args={[1.26, 0.18, 1.0]} radius={0.14} smoothness={14} position={[0, 0.5, 0]} castShadow receiveShadow>
            <WoodMaterial color={palette.woodLight} roughness={0.64} />
          </RoundedBox>
          <RoundedBox args={[1.08, 0.035, 0.82]} radius={0.08} smoothness={10} position={[0, 0.607, 0.01]}>
            <meshBasicMaterial color="#fff0c4" transparent opacity={0.23} />
          </RoundedBox>
          <RoundedBox args={[1.18, 0.045, 0.06]} radius={0.024} smoothness={6} position={[0, 0.61, -0.43]}>
            <meshBasicMaterial color="#fff7df" transparent opacity={0.2} />
          </RoundedBox>
          {[[-0.42, -0.34], [0.42, -0.34], [-0.42, 0.34], [0.42, 0.34]].map(([dx, dz], legIndex) => (
            <mesh key={`table-leg-${legIndex}`} position={[dx, 0.28, dz]} castShadow>
              <cylinderGeometry args={[0.078, 0.09, 0.43, 14]} />
              <meshStandardMaterial color={palette.wood} roughness={0.64} metalness={0} />
            </mesh>
          ))}
          {[[-0.82, 0], [0.82, 0], [0, -0.76], [0, 0.76]].map(([dx, dz], stoolIndex) => (
            <group key={stoolIndex} position={[dx, 0, dz]} rotation-y={stoolIndex > 1 ? Math.PI / 2 : 0}>
              <RoundedBox args={[0.48, 0.145, 0.38]} radius={0.1} smoothness={12} position={[0, 0.31, 0]} castShadow receiveShadow>
                <WoodMaterial color={palette.woodLight} roughness={0.64} />
              </RoundedBox>
              <RoundedBox args={[0.4, 0.025, 0.3]} radius={0.05} smoothness={8} position={[0, 0.395, 0]}>
                <meshBasicMaterial color="#fff0bd" transparent opacity={0.17} />
              </RoundedBox>
              {[[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].map(([lx, lz], legIndex) => (
                <mesh key={legIndex} position={[lx, 0.16, lz]} castShadow>
                  <cylinderGeometry args={[0.04, 0.048, 0.25, 10]} />
                  <meshStandardMaterial color={palette.wood} roughness={0.66} metalness={0} />
                </mesh>
              ))}
              <RoundedBox args={[0.42, 0.04, 0.08]} radius={0.03} smoothness={6} position={[0, 0.08, 0.13]}>
                <meshStandardMaterial color="#c98a43" roughness={0.68} metalness={0} />
              </RoundedBox>
            </group>
          ))}
          <MiniPlant position={[0.18, 0.62, -0.12]} scale={0.54} />
          <group position={[-0.32, 0.62, 0.18]} scale={0.78}>
            <RiceBowl />
          </group>
          <group position={[0.38, 0.62, 0.16]} scale={0.78}>
            <DishPlate />
          </group>
        </group>
      ))}
    </group>
  );
}

function AmbientPlants() {
  const plants: Array<[number, number, number, number]> = [
    [-12.8, 0.18, -1.2, 0.76],
    [-12.9, 0.18, 1.9, 0.72],
    [12.8, 0.18, 2.2, 0.72],
    [12.9, 0.18, -0.8, 0.78],
    [-8.4, 0.18, 3.65, 0.56],
    [-6.2, 0.18, 3.75, 0.62],
    [-3.6, 0.18, 3.9, 0.54],
    [-0.8, 0.18, 3.9, 0.62],
    [2.2, 0.18, 3.82, 0.56],
    [5.2, 0.18, 3.7, 0.64],
    [8.4, 0.18, 3.55, 0.56]
  ];
  return (
    <group>
      {[-12.2, -7.8, -3.6, 0.8, 5.2, 9.6, 12.6].map((x, index) => (
        <ChristmasTree key={`back-tree-${index}`} position={[x, 0.02, -6.48 + (index % 2) * 0.14]} scale={0.72 + (index % 3) * 0.08} />
      ))}
      {plants.map(([x, y, z, scale], index) => (
        <MiniPlant key={index} position={[x, y, z]} scale={scale} />
      ))}
    </group>
  );
}

function ChristmasTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.34, 0.3, 0.34]} radius={0.07} smoothness={8} position={[0, 0.15, 0]} castShadow receiveShadow>
        {matte("#d7ad72", 0.78)}
      </RoundedBox>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.55, 10]} />
        <meshStandardMaterial color="#8b5a2d" roughness={0.78} metalness={0} />
      </mesh>
      {[0, 1, 2].map((layer) => (
        <mesh key={layer} position={[0, 0.55 + layer * 0.28, 0]} castShadow>
          <coneGeometry args={[0.42 - layer * 0.085, 0.58, 18]} />
          <meshStandardMaterial color={layer % 2 ? "#7fb452" : "#9bcf64"} roughness={0.84} metalness={0} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={`tree-dot-${index}`} position={[Math.cos(index * 1.26) * 0.22, 0.68 + (index % 3) * 0.22, Math.sin(index * 1.26) * 0.18]} castShadow>
          <sphereGeometry args={[0.035, 10, 6]} />
          <meshStandardMaterial color={index % 2 ? "#fff4a8" : "#f3cf54"} roughness={0.78} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function PlanterStrip() {
  const clusters = Array.from({ length: 18 }, (_, index) => ({
    x: -10.15 + index * 1.2,
    z: index % 2 ? 0.08 : -0.13,
    scale: 0.9 + (index % 3) * 0.08
  }));
  return (
    <group position={[0, 0, 7.62]}>
      <RoundedBox args={[22.2, 0.38, 0.72]} radius={0.16} smoothness={14} position={[0, 0.19, 0]} castShadow receiveShadow>
        <WoodMaterial color="#d8b078" roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[21.75, 0.1, 0.58]} radius={0.12} smoothness={10} position={[0, 0.42, 0]}>
        <meshStandardMaterial color="#8fb55b" roughness={0.86} metalness={0} />
      </RoundedBox>
      {clusters.map((cluster, index) => (
        <FlowerBush key={index} position={[cluster.x, 0.46, cluster.z]} scale={cluster.scale} seed={index} />
      ))}
    </group>
  );
}

function FlowerBush({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((tier) => (
        <group key={tier} position={[0, tier * 0.055, 0]}>
          {Array.from({ length: 7 }).map((_, leafIndex) => {
            const angle = leafIndex * 0.9 + seed * 0.27 + tier * 0.42;
            const radius = 0.11 + (leafIndex % 3) * 0.035 - tier * 0.012;
            return (
              <mesh
                key={leafIndex}
                position={[Math.cos(angle) * radius, 0.06 + (leafIndex % 2) * 0.025, Math.sin(angle) * radius]}
                rotation={[0.7, angle, 0.25]}
                scale={[0.78, 1.28, 0.42]}
                castShadow
              >
                <sphereGeometry args={[0.13 - tier * 0.014, 14, 8]} />
                <meshStandardMaterial color={(leafIndex + seed + tier) % 3 === 0 ? "#c5e57e" : (leafIndex % 2 ? "#8fc65c" : "#a8d66d")} roughness={0.86} metalness={0} />
              </mesh>
            );
          })}
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((flowerIndex) => {
        const angle = flowerIndex * 1.25 + seed * 0.2;
        return (
          <mesh key={`flower-${flowerIndex}`} position={[Math.cos(angle) * 0.14, 0.24 + (flowerIndex % 2) * 0.03, Math.sin(angle) * 0.12]} castShadow>
            <sphereGeometry args={[0.032, 10, 6]} />
            <meshStandardMaterial color={flowerIndex % 2 ? "#fff9dc" : "#f4d95c"} roughness={0.78} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

function getCategoryTheme(stall: Stall) {
  const text = `${stall.name} ${stall.category}`;
  if (/饮品|好怡|奶|茶/.test(text)) return { body: "#d9e7dd", icon: "drink" };
  if (/轻食|选品|沙拉/.test(text)) return { body: "#d9e5cf", icon: "leaf" };
  if (/烧腊|广味|三宝|扒|肯德基|快餐/.test(text)) return { body: "#e8c8aa", icon: "grill" };
  if (/鱼|鲜|蒸|海/.test(text)) return { body: "#d9e8ea", icon: "fish" };
  if (/粉|面|粿|小面|腌面|老碗/.test(text)) return { body: "#e9d0a9", icon: "bowl" };
  if (/汤|炖|关东/.test(text)) return { body: "#dcdce6", icon: "soup" };
  if (/饭|盖|拌|日式|东旭/.test(text)) return { body: "#e7d4ae", icon: "rice" };
  return { body: "#ddd6c9", icon: "fast" };
}
