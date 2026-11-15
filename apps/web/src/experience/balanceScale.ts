/**
 * 3D Balance Scale — experiential accounting equation.
 * Left pan = Assets, Right pan = Capital + Liabilities.
 * Tilts visibly when unbalanced; settles when balanced. Purely visual —
 * all numbers come from the Ledger engine.
 */
import * as THREE from 'three';

export interface BalanceState {
  assets: number; // paise or rupees, any consistent unit (geometry uses normalized values)
  rhs: number;
  balanced: boolean;
  assetsLabel: string;
  rhsLabel: string;
}

export interface BalanceHandle {
  set(state: BalanceState): void;
  dispose(): void;
}

export function mountBalanceScale(container: HTMLElement, initial: BalanceState): BalanceHandle | null {
  if (typeof window === 'undefined') return null;
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  try {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(0, 3.4, 8.5);
    camera.lookAt(0, 0.2, 0);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xfff3d0, 1.0);
    dir.position.set(5, 8, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xd8eef0, 0.5);
    fill.position.set(-4, 4, -3);
    scene.add(fill);

    // ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.45;
    ground.receiveShadow = true;
    scene.add(ground);

    // pillar
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 2.4, 16), new THREE.MeshStandardMaterial({ color: 0x0f3d3e, roughness: 0.55, metalness: 0.12 }));
    pillar.position.y = -0.25;
    pillar.castShadow = true;
    scene.add(pillar);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.16, 20), new THREE.MeshStandardMaterial({ color: 0x1a2e30, roughness: 0.7 }));
    base.position.y = -1.37;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // beam (pivots)
    const beamGroup = new THREE.Group();
    beamGroup.position.y = 0.95;
    scene.add(beamGroup);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 0.12), new THREE.MeshStandardMaterial({ color: 0xb7791f, roughness: 0.45, metalness: 0.18 }));
    beam.castShadow = true;
    beamGroup.add(beam);

    const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf0c75a, metalness: 0.35, roughness: 0.35 }));
    beamGroup.add(pivot);

    // pans
    const panGeo = new THREE.CylinderGeometry(1.05, 0.85, 0.18, 22);
    const panMatL = new THREE.MeshStandardMaterial({ color: 0x0f6b6e, roughness: 0.55, metalness: 0.08 });
    const panMatR = new THREE.MeshStandardMaterial({ color: 0xb7791f, roughness: 0.55, metalness: 0.08 });

    const panL = new THREE.Mesh(panGeo, panMatL);
    panL.position.set(-2.9, -0.7, 0);
    panL.castShadow = true;
    panL.receiveShadow = true;
    beamGroup.add(panL);

    const panR = new THREE.Mesh(panGeo, panMatR);
    panR.position.set(2.9, -0.7, 0);
    panR.castShadow = true;
    panR.receiveShadow = true;
    beamGroup.add(panR);

    // chains (lines)
    const chainMat = new THREE.LineBasicMaterial({ color: 0x5a6a6e, transparent: true, opacity: 0.7 });
    const mkChains = (x: number) => {
      const g = new THREE.Group();
      for (const dx of [-0.5, 0.5])
        for (const dz of [-0.4, 0.4]) {
          const pts = [new THREE.Vector3(x, -0.05, 0), new THREE.Vector3(x + dx * 0.35, -0.62, dz * 0.35)];
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          g.add(new THREE.Line(geo, chainMat));
        }
      return g;
    };
    beamGroup.add(mkChains(-2.9), mkChains(2.9));

    // weights — stacked boxes whose height reflects value
    const stackL = new THREE.Group();
    stackL.position.copy(panL.position);
    stackL.position.y += 0.16;
    const stackR = new THREE.Group();
    stackR.position.copy(panR.position);
    stackR.position.y += 0.16;
    beamGroup.add(stackL, stackR);

    let current: BalanceState = initial;
    let targetTilt = 0;
    let curTilt = 0;

    const blockMats = [
      new THREE.MeshStandardMaterial({ color: 0x0f6b6e }),
      new THREE.MeshStandardMaterial({ color: 0x1a8a8e }),
      new THREE.MeshStandardMaterial({ color: 0x2ea8ac }),
      new THREE.MeshStandardMaterial({ color: 0xb7791f }),
      new THREE.MeshStandardMaterial({ color: 0xd99a2f }),
    ];

    const rebuildStacks = (assets: number, rhs: number) => {
      // clear
      for (const g of [stackL, stackR]) {
        while (g.children.length) g.remove(g.children[0]!);
      }
      const max = Math.max(1, assets, rhs);
      const mk = (group: THREE.Group, value: number, colorIdx: number) => {
        if (value <= 0) return;
        const h = Math.max(0.12, Math.min(1.1, (value / max) * 1.0));
        const w = 0.78 - h * 0.08;
        const d = 0.78 - h * 0.08;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), blockMats[colorIdx % blockMats.length]!);
        m.position.y = h / 2;
        // lift subsequent blocks
        let y = 0;
        for (const c of group.children) {
          const child = c as THREE.Mesh;
          const h2 = (child.geometry as THREE.BoxGeometry).parameters?.height ?? 0;
          y += h2 + 0.04;
        }
        m.position.y = y + h / 2;
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
      };
      // For simplicity, one block per side sized by total (keeps it readable; detailed composition is in the DOM list)
      mk(stackL, assets, 0);
      mk(stackR, rhs, 3);
      // add a small marker when unbalanced
      if (!current.balanced) {
        const warn = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x4a0a00, emissiveIntensity: 0.3 }));
        warn.position.y = 1.15;
        (assets > rhs ? stackL : stackR).add(warn);
      }
    };

    const applyTilt = (balanced: boolean, assets: number, rhs: number) => {
      if (balanced) targetTilt = 0;
      else {
        const diff = (assets - rhs) / Math.max(1, Math.max(assets, rhs));
        targetTilt = Math.max(-0.35, Math.min(0.35, diff * 0.55)); // radians
      }
    };

    rebuildStacks(initial.assets, initial.rhs);
    applyTilt(initial.balanced, initial.assets, initial.rhs);

    let raf = 0;
    let alive = true;
    const onResize = () => {
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 320;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize);

    const tick = () => {
      if (!alive) return;
      // smooth tilt
      if (!prefersReduced) {
        curTilt += (targetTilt - curTilt) * 0.06;
        beamGroup.rotation.z = curTilt;
        // keep pans level (counter-rotate)
        panL.rotation.z = -curTilt;
        stackL.rotation.z = -curTilt;
        panR.rotation.z = -curTilt;
        stackR.rotation.z = -curTilt;
      } else {
        beamGroup.rotation.z = targetTilt;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && !raf) raf = requestAnimationFrame(tick);
          else if (!e.isIntersecting && raf) {
            cancelAnimationFrame(raf);
            raf = 0 as unknown as number;
          }
        }
      },
      { threshold: 0 },
    );
    io.observe(container);

    return {
      set(next: BalanceState) {
        current = next;
        rebuildStacks(next.assets, next.rhs);
        applyTilt(next.balanced, next.assets, next.rhs);
      },
      dispose() {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        io.disconnect();
        renderer.dispose();
        canvas.remove();
        scene.traverse((o: THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
            else o.material.dispose();
          }
        });
      },
    };
  } catch {
    return null;
  }
}
