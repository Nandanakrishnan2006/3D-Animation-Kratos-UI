import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import {
  Suspense,
  createContext,
  useContext,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import * as THREE from "three";

import { ACTS, easeInOut, easeOut, lerp, pulse, seg } from "./progress";

import lionAsset from "@/assets/lion.png.asset.json";
import laptopAsset from "@/assets/laptop.png.asset.json";
import robotAsset from "@/assets/robot.png.asset.json";
import brainAsset from "@/assets/brain.png.asset.json";
import vrAsset from "@/assets/vr.png.asset.json";
import chipAsset from "@/assets/chip.png.asset.json";
import satelliteAsset from "@/assets/satellite.png.asset.json";
import controllerAsset from "@/assets/controller.png.asset.json";
import booksAsset from "@/assets/books.png.asset.json";

const ProgressCtx = createContext<RefObject<number>>({ current: 0 });
const useProgress = () => useContext(ProgressCtx);

type Vec = [number, number, number];

type FloaterProps = {
  url: string;
  window: readonly [number, number];
  from: Vec;
  to: Vec;
  height: number;
  spin?: number;
  tilt?: number;
  floatSpeed?: number;
  glow?: string;
};

const LAYERS = 12;

/**
 * Builds a real volumetric slab out of the object's silhouette: the lit front
 * face plus stacked, darkened shells behind it that read as bevelled thickness
 * when the object rotates. alphaTest keeps the true silhouette — no boxes.
 */
function Slab({
  tex,
  w,
  h,
  depth,
  matRef,
}: {
  tex: THREE.Texture;
  w: number;
  h: number;
  depth: number;
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const shells = useMemo(() => Array.from({ length: LAYERS }, (_, i) => i), []);
  return (
    <group>
      {shells.map((i) => {
        const t = i / (LAYERS - 1);
        const front = i === 0;
        return (
          <mesh
            key={i}
            position={[0, 0, -t * depth]}
            scale={1 - t * 0.02}
            castShadow={front}
          >
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial
              ref={front ? matRef : null}
              map={tex}
              alphaTest={0.45}
              transparent={false}
              color={front ? "#ffffff" : new THREE.Color().setScalar(0.18 - t * 0.12)}
              metalness={front ? 0.65 : 0.35}
              roughness={front ? 0.28 : 0.75}
              envMapIntensity={front ? 1.25 : 0.35}
              emissive={front ? new THREE.Color("#20090a") : new THREE.Color("#000000")}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** A large 3D object that sweeps through the scene with real depth + rotation. */
function Floater({
  url,
  window: win,
  from,
  to,
  height,
  spin = 0.6,
  tilt = -0.25,
  floatSpeed = 1,
  glow = "#ff3b12",
}: FloaterProps) {
  const tex = useTexture(url);
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const progress = useProgress();

  const aspect = useMemo(() => {
    const img = tex.image as { width: number; height: number } | undefined;
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return img ? img.width / img.height : 1;
  }, [tex]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = seg(progress.current, win[0], win[1]);
    const live = t > 0.001 && t < 0.999;
    g.visible = live;
    if (!live) return;

    const e = easeInOut(t);
    const time = state.clock.elapsedTime;

    g.position.set(
      lerp(from[0], to[0], e),
      lerp(from[1], to[1], e) + Math.sin(time * floatSpeed + from[0]) * 0.22,
      lerp(from[2], to[2], e),
    );
    g.rotation.z = tilt + Math.sin(time * 0.5 * floatSpeed) * 0.06 + (e - 0.5) * spin;
    g.rotation.y = Math.sin(time * 0.35 * floatSpeed + 1.2) * 0.32 + (e - 0.5) * spin * 0.9;
    g.rotation.x = Math.sin(time * 0.3 * floatSpeed) * 0.1;

    const p = pulse(t, 0.22, 0.72);
    const s = 0.72 + easeOut(p) * 0.28;
    g.scale.setScalar(s);
    if (mat.current) mat.current.envMapIntensity = 0.8 + p * 0.8;
    if (light.current) light.current.intensity = p * 22;
  });

  return (
    <group ref={group}>
      <Slab
        tex={tex}
        w={height * aspect}
        h={height}
        depth={height * 0.09}
        matRef={mat}
      />
      <pointLight
        ref={light}
        color={glow}
        distance={height * 2.4}
        intensity={0}
        position={[0, 0, height * 0.35]}
      />
    </group>
  );
}

/** The lion — original artwork, never recoloured. Main character of the sequence. */
function Lion() {
  const tex = useTexture(lionAsset.url);
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const auraMat = useRef<THREE.MeshBasicMaterial>(null);
  const progress = useProgress();
  const { viewport } = useThree();

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current;
    const time = state.clock.elapsedTime;

    // Act 1 — emerges out of pure darkness, huge and slowly drifting toward camera.
    const wake = seg(p, ACTS.awaken[0], ACTS.awaken[1]);
    // Acts 2-6 — the lion prowls the edges of the scene between the tech objects.
    const mid = seg(p, ACTS.awaken[1], ACTS.hero[0]);
    // Act 7 — settles beside the KRATOS title.
    const home = easeInOut(seg(p, ACTS.hero[0], ACTS.hero[0] + 0.09));

    const halfW = viewport.width / 2;
    const finalX = -Math.min(halfW * 0.46, 5.2);
    const finalScale = Math.min(viewport.height * 0.62, 6.2);

    // prowl path across the middle acts (left -> right -> left, swinging in depth)
    const prowlX = Math.sin(mid * Math.PI * 2.2) * halfW * 0.72;
    const prowlY = Math.sin(mid * Math.PI * 3.1) * 1.1 - 0.2;
    const prowlZ = -6 + Math.sin(mid * Math.PI * 1.6) * 3.5;
    const prowlScale = 3.4 + Math.sin(mid * Math.PI) * 1.4;

    const wakeE = easeOut(wake);
    const x = lerp(lerp(0, prowlX, wake), finalX, home);
    const y = lerp(lerp(0.1, prowlY, wake), 0.15, home);
    const z = lerp(lerp(-9, prowlZ, wake), 0.6, home);
    const scale = lerp(lerp(2.2, prowlScale, wake), finalScale, home);

    g.position.set(x, y + Math.sin(time * 0.7) * 0.12 * (1 - home * 0.7), z);
    g.scale.setScalar(scale);

    const swing = Math.sin(mid * Math.PI * 4) * 0.22 * (1 - home);
    g.rotation.z = swing + Math.sin(time * 0.6) * 0.02;
    g.rotation.y = lerp(Math.sin(mid * Math.PI * 2) * 0.4, 0, home) + Math.sin(time * 0.4) * 0.04;

    const opacity = Math.min(1, wakeE * 1.2);
    if (mat.current) mat.current.opacity = opacity;
    if (auraMat.current)
      auraMat.current.opacity = opacity * (0.28 + Math.sin(time * 1.6) * 0.06);
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.05]} scale={1.28}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={auraMat}
          map={tex}
          color="#ff5a1a"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={mat}
          map={tex}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function emberTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,196,72,0.9)");
  grd.addColorStop(0.6, "rgba(226,58,17,0.35)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Controlled red/gold embers drifting through the dark. */
function Embers({ count = 260 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const tex = useMemo(emberTexture, []);
  const { positions, seeds, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const gold = new THREE.Color("#ffc23c");
    const red = new THREE.Color("#e0290f");
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = -12 + Math.random() * 16;
      seeds[i * 3] = 0.25 + Math.random() * 0.8;
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 2] = 0.4 + Math.random() * 1.6;
      const c = Math.random() > 0.45 ? gold : red;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, seeds, colors };
  }, [count]);

  useFrame((state) => {
    const pts = points.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const rise = seeds[i * 3] ?? 1;
      const phase = seeds[i * 3 + 1] ?? 0;
      const baseX = positions[i * 3] ?? 0;
      const baseY = positions[i * 3 + 1] ?? 0;
      const baseZ = positions[i * 3 + 2] ?? 0;
      let y = baseY + ((t * rise) % 24);
      if (y > 9.5) y -= 20;
      attr.setXYZ(i, baseX + Math.sin(t * 0.35 * rise + phase) * 0.9, y, baseZ);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={0.22}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Slow cinematic dolly + subtle mouse parallax. */
function CameraRig() {
  const progress = useProgress();
  const mouse = useRef({ x: 0, y: 0 });
  useFrame((state, delta) => {
    const p = progress.current;
    const cam = state.camera;
    mouse.current.x = state.pointer.x;
    mouse.current.y = state.pointer.y;

    const push = Math.sin(p * Math.PI * 6) * 0.9;
    const targetZ = lerp(15.5, 12.2, easeInOut(Math.min(1, p * 1.6))) + push;
    const targetX = mouse.current.x * 0.55 + Math.sin(p * Math.PI * 3) * 0.5;
    const targetY = -mouse.current.y * 0.35 + Math.cos(p * Math.PI * 2) * 0.25;

    const k = 1 - Math.exp(-3.5 * delta);
    cam.position.x += (targetX - cam.position.x) * k;
    cam.position.y += (targetY - cam.position.y) * k;
    cam.position.z += (targetZ - cam.position.z) * k;
    cam.rotation.z = lerp(cam.rotation.z, Math.sin(p * Math.PI * 4) * 0.02, k);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

const OBJECTS: FloaterProps[] = [
  // TECHNICAL — laptop + processor
  {
    url: laptopAsset.url,
    window: [0.15, 0.33],
    from: [-16, -5, -10],
    to: [7.5, 3.4, 2],
    height: 8.5,
    spin: 1.1,
    tilt: 0.22,
  },
  {
    url: chipAsset.url,
    window: [0.19, 0.35],
    from: [13, 6, -12],
    to: [-8.5, -3.6, 1],
    height: 7,
    spin: -1.4,
    tilt: -0.3,
    glow: "#ffb02e",
    floatSpeed: 1.3,
  },
  // SPARK — neural brain + AI robot
  {
    url: brainAsset.url,
    window: [0.32, 0.49],
    from: [0, -14, -14],
    to: [-6.8, 4.2, 2.4],
    height: 9,
    spin: 0.9,
    tilt: -0.18,
    glow: "#ffcf4d",
  },
  {
    url: robotAsset.url,
    window: [0.35, 0.5],
    from: [15, -8, -9],
    to: [6.6, -3.2, 1.5],
    height: 8.6,
    spin: -0.7,
    tilt: 0.16,
    floatSpeed: 0.8,
  },
  // ONLINE — VR headset + satellite dish
  {
    url: vrAsset.url,
    window: [0.47, 0.63],
    from: [-15, 7, -12],
    to: [5.8, 3.2, 2.2],
    height: 8,
    spin: 1.3,
    tilt: 0.25,
    glow: "#ff4b1a",
  },
  {
    url: satelliteAsset.url,
    window: [0.5, 0.64],
    from: [12, -9, -13],
    to: [-7.4, -3.4, 1.2],
    height: 8.4,
    spin: -1,
    tilt: -0.22,
    glow: "#ffc23c",
    floatSpeed: 1.2,
  },
  // PLAYGROUND — gaming controller
  {
    url: controllerAsset.url,
    window: [0.61, 0.76],
    from: [-4, -16, -12],
    to: [4.4, 1.4, 3],
    height: 9.5,
    spin: 1.6,
    tilt: 0.3,
    glow: "#ff2e0f",
  },
  {
    url: chipAsset.url,
    window: [0.63, 0.75],
    from: [14, 8, -14],
    to: [-7.8, -2.6, -1],
    height: 6,
    spin: -1.2,
    tilt: -0.4,
    glow: "#ffb02e",
    floatSpeed: 1.4,
  },
  // HACKATHON — laptop + brain + knowledge stack
  {
    url: laptopAsset.url,
    window: [0.74, 0.88],
    from: [-15, 6, -11],
    to: [-6.2, 2.6, 1.8],
    height: 7.6,
    spin: 0.8,
    tilt: -0.2,
  },
  {
    url: booksAsset.url,
    window: [0.76, 0.88],
    from: [13, -10, -12],
    to: [6.4, -3, 1.6],
    height: 7.4,
    spin: -0.9,
    tilt: 0.18,
    glow: "#ffc23c",
  },
  {
    url: brainAsset.url,
    window: [0.78, 0.88],
    from: [2, 15, -16],
    to: [0.6, 4.6, -3],
    height: 6.4,
    spin: 1.1,
    tilt: 0.1,
    glow: "#ffcf4d",
    floatSpeed: 1.1,
  },
];

function SceneContents() {
  return (
    <>
      <CameraRig />
      <Embers />
      <Suspense fallback={null}>
        {OBJECTS.map((o, i) => (
          <Floater key={i} {...o} />
        ))}
        <Lion />
      </Suspense>
    </>
  );
}

export function Scene3D({ progress }: { progress: RefObject<number> }) {
  return (
    <ProgressCtx.Provider value={progress}>
      <Canvas
        camera={{ fov: 45, position: [0, 0, 15.5] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneContents />
      </Canvas>
    </ProgressCtx.Provider>
  );
}
