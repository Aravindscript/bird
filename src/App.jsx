
import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import Phoenix from "./Phoenix";
import "./style.css";

function FireTrail({ bird }) {
  const COUNT = 160;
  const particles = useRef([]);
  const nextParticle = useRef(0);
  const lastPosition = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((state, delta) => {
    if (!bird.current) return;

    const pos = bird.current.position;
    const facingLeft =
      Math.cos(bird.current.rotation.y) < 0;
    const tailDir = facingLeft ? 1 : -1;

    if (!initialized.current) {
      lastPosition.current.copy(pos);
      initialized.current = true;
    }

    const distance = pos.distanceTo(lastPosition.current);

    if (distance > 0.012) {
      const p = particles.current[nextParticle.current];

      if (p) {
        p.age = 0;
        p.life = 0.65 + Math.random() * 0.9;
        p.mesh.visible = true;

        p.mesh.position.set(
          pos.x + tailDir * (0.3 + Math.random() * 0.15),
          pos.y - 0.08 + (Math.random() - 0.5) * 0.2,
          pos.z - 0.12
        );

        p.velocity.set(
          tailDir * (0.5 + Math.random() * 1.2),
          (Math.random() - 0.5) * 0.65,
          (Math.random() - 0.5) * 0.2
        );

        p.initialScale = 0.5 + Math.random() * 1.4;
        p.mesh.scale.setScalar(p.initialScale);

        p.material.color.set(
          Math.random() > 0.55
            ? "#ff2200"
            : Math.random() > 0.5
            ? "#ff7620"
            : "#ffd166"
        );

        nextParticle.current =
          (nextParticle.current + 1) % COUNT;
      }

      lastPosition.current.copy(pos);
    }

    particles.current.forEach((p) => {
      if (!p || !p.mesh.visible) return;

      p.age += delta;

      if (p.age >= p.life) {
        p.mesh.visible = false;
        return;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      const fade = 1 - p.age / p.life;
      p.material.opacity = fade;
      p.mesh.scale.setScalar(
        p.initialScale * (0.35 + fade * 0.65)
      );
    });
  });

  return (
    <group>
      {Array.from({ length: COUNT }, (_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(mesh) => {
            if (mesh && !particles.current[i]) {
              particles.current[i] = {
                mesh,
                material: mesh.material,
                velocity: new THREE.Vector3(),
                age: 0,
                life: 1,
                initialScale: 1,
              };
            }
          }}
        >
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial
            color="#ff6b16"
            transparent
            opacity={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ pointer }) {
  const bird = useRef();
  const ball = useRef();
  const tailLight = useRef();

  const { viewport } = useThree();
  const direction = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Adjust these two values to fine-tune the mouth alignment.
  const MOUTH_OFFSET_X = 0.45;
  const MOUTH_OFFSET_Y = 0.05;

  useFrame((state, delta) => {
    if (!bird.current || !ball.current) return;

    const targetX =
      pointer.current.x * viewport.width / 2;
    const targetY =
      pointer.current.y * viewport.height / 2;

    if (!initialized.current) {
      bird.current.position.set(
        targetX - 0.7,
        targetY,
        -0.3
      );
      initialized.current = true;
    }

    // Determine which side the Phoenix is facing.
    const dx = targetX - bird.current.position.x;
    const facingLeft = dx < 0;

    // Position the Phoenix so its mouth approaches the ball.
    const offsetX = facingLeft
      ? MOUTH_OFFSET_X
      : -MOUTH_OFFSET_X;

    const chaseX = targetX + offsetX;
    const chaseY = targetY - MOUTH_OFFSET_Y;

    bird.current.position.x = THREE.MathUtils.damp(
      bird.current.position.x,
      chaseX,
      3.2,
      delta
    );

    bird.current.position.y = THREE.MathUtils.damp(
      bird.current.position.y,
      chaseY,
      3.2,
      delta
    );

    // Face the golden ball.
    const desiredYaw = facingLeft ? Math.PI : 0;

    bird.current.rotation.y = THREE.MathUtils.damp(
      bird.current.rotation.y,
      desiredYaw,
      5,
      delta
    );

    direction.current.set(
      targetX - bird.current.position.x,
      targetY - bird.current.position.y,
      0
    );

    const desiredTilt = THREE.MathUtils.clamp(
      Math.atan2(
        direction.current.y,
        Math.abs(direction.current.x)
      ),
      -0.35,
      0.35
    );

    bird.current.rotation.z = THREE.MathUtils.damp(
      bird.current.rotation.z,
      desiredTilt,
      3,
      delta
    );

    // Golden ball stays at the mouse target.
    ball.current.position.set(targetX, targetY, 0);

    // Red light follows the Phoenix tail.
    if (tailLight.current) {
      const actualFacingLeft =
        Math.cos(bird.current.rotation.y) < 0;
      const tailDir = actualFacingLeft ? 1 : -1;

      tailLight.current.position.set(
        bird.current.position.x + tailDir * 0.9,
        bird.current.position.y - 0.12,
        bird.current.position.z + 0.25
      );
    }
  });

  return (
    <>
      <color attach="background" args={["#020102"]} />
      <fog attach="fog" args={["#020102", 10, 26]} />

      <ambientLight intensity={0.8} />

      <directionalLight
        position={[3, 4, 5]}
        intensity={2.5}
        color="#ffd5a0"
      />

      <pointLight
        position={[-3, 0, 1]}
        intensity={4}
        distance={8}
        color="#ff1608"
      />

      <pointLight
        ref={tailLight}
        color="#ff2608"
        intensity={8}
        distance={4}
        decay={2}
      />

      <Phoenix
        ref={bird}
        modelScale={viewport.width > 12 ? 0.005 : 0.004}
      />

      <FireTrail bird={bird} />

      <group ref={ball}>
        <mesh>
          <sphereGeometry args={[0.065, 32, 32]} />
          <meshStandardMaterial
            color="#fff0a0"
            emissive="#ffae00"
            emissiveIntensity={5}
            metalness={0.3}
            roughness={0.12}
          />
        </mesh>

        <pointLight
          color="#ffb21b"
          intensity={5}
          distance={3}
        />
      </group>

      <Environment preset="sunset" />
    </>
  );
}

export default function App() {
  const pointer = useRef({ x: 0, y: 0 });

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    pointer.current.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.current.y =
      1 -
      ((event.clientY - rect.top) / rect.height) * 2;
  }

  return (
    <main className="app">
      <header className="heading">
        <h1>PHOENIX</h1>
        
      </header>

      <div
        className="scene"
        onPointerMove={handlePointerMove}
      >
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          dpr={[1, 1.5]}
        >
          <Scene pointer={pointer} />
        </Canvas>
      </div>

      
    </main>
  );
}