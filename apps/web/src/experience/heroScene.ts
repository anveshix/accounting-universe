/**
 * Hero 3D scene — subtle, professional, experiential.
 * A shallow depth field with floating low-poly books, coins and ledger pages.
 * Respects prefers-reduced-motion and WebGL availability; never blocks content.
 */
import * as THREE from 'three';

export interface HeroHandle { dispose(): void; }

export function mountHeroScene(container: HTMLElement): HeroHandle | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f3d3e, 8, 18);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 1.2, 9);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    const dir = new THREE.DirectionalLight(0xfff7d0, 1.1);
    dir.position.set(4, 6, 3);
    scene.add(ambient, dir);
    const rim = new THREE.PointLight(0x7fd3d6, 1.2, 20);
    rim.position.set(-5, 2, 4);
    scene.add(rim);

    // — floating group (books + coins + pages)
    const group = new THREE.Group();
    scene.add(group);

    const bookGeo = new THREE.BoxGeometry(1.2, 1.55, 0.22);
    const pageGeo = new THREE.BoxGeometry(1.0, 1.3, 0.04);
    const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20);
    const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 10, 28);

    const matBook1 = new THREE.MeshStandardMaterial({ color: 0xf0c75a, roughness: 0.55, metalness: 0.05 });
    const matBook2 = new THREE.MeshStandardMaterial({ color: 0x1d6a6c, roughness: 0.6, metalness: 0.08 });
    const matBook3 = new THREE.MeshStandardMaterial({ color: 0xdfe9ea, roughness: 0.7, metalness: 0.02 });
    const matCoin = new THREE.MeshStandardMaterial({ color: 0xffd86a, roughness: 0.3, metalness: 0.35, emissive: 0x332200, emissiveIntensity: 0.12 });
    const matPage = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0.92 });
    const matRing = new THREE.MeshStandardMaterial({ color: 0x7fd3d6, roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.5 });

    const items: { mesh: THREE.Object3D; drift: THREE.Vector3; spin: THREE.Vector3 }[] = [];

    const mkBook = (x: number, y: number, z: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(bookGeo, mat);
      m.position.set(x, y, z);
      m.rotation.set(Math.random() * 0.6 - 0.3, Math.random() * 0.8 - 0.4, Math.random() * 0.3 - 0.15);
      group.add(m);
      items.push({ mesh: m, drift: new THREE.Vector3((Math.random() - 0.5) * 0.002, (Math.random() - 0.5) * 0.0015, 0), spin: new THREE.Vector3((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.004) });
    };
    const mkCoin = (x: number, y: number, z: number) => {
      const m = new THREE.Mesh(coinGeo, matCoin);
      m.position.set(x, y, z);
      m.rotation.set(Math.PI / 2.2, 0, Math.random() * Math.PI);
      group.add(m);
      items.push({ mesh: m, drift: new THREE.Vector3((Math.random() - 0.5) * 0.0015, Math.sin(Date.now() * 0.001) * 0.0005, 0), spin: new THREE.Vector3(0, 0.012, 0) });
    };
    const mkPage = (x: number, y: number, z: number) => {
      const m = new THREE.Mesh(pageGeo, matPage);
      m.position.set(x, y, z);
      m.rotation.set(0.15, 0.3, -0.12);
      group.add(m);
      items.push({ mesh: m, drift: new THREE.Vector3(0, 0.0006, 0), spin: new THREE.Vector3(0, 0.003, 0.001) });
    };
    const mkRing = (x: number, y: number, z: number) => {
      const m = new THREE.Mesh(ringGeo, matRing);
      m.position.set(x, y, z);
      m.rotation.set(Math.PI / 3, 0, 0);
      group.add(m);
      items.push({ mesh: m, drift: new THREE.Vector3(0, -0.0004, 0), spin: new THREE.Vector3(0.002, 0.004, 0) });
    };

    mkBook(-3.2, 0.7, -1.2, matBook1);
    mkBook(2.9, -0.4, -0.8, matBook2);
    mkBook(0.4, 1.1, -1.6, matBook3);
    mkPage(1.6, 0.9, -0.4);
    mkPage(-1.2, -0.9, -0.6);
    mkCoin(-2.0, -0.6, 0.2);
    mkCoin(2.2, 0.6, 0.4);
    mkCoin(0, -1.0, 0.0);
    mkRing(-0.8, 0.4, -1.0);
    mkRing(2.6, -0.9, -1.2);

    // subtle grid floor
    const grid = new THREE.GridHelper(14, 14, 0xffffff, 0xffffff);
    (grid.material as THREE.Material & { opacity: number }).opacity = 0.06;
    (grid.material as THREE.Material & { transparent: boolean }).transparent = true;
    grid.position.y = -1.8;
    scene.add(grid);

    let raf = 0;
    let t = 0;
    let alive = true;

    const onResize = () => {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 340;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize);

    const tick = () => {
      if (!alive) return;
      t += 0.008;
      group.position.y = Math.sin(t * 0.7) * 0.08;
      group.rotation.y = Math.sin(t * 0.3) * 0.06;
      for (const it of items) {
        it.mesh.position.add(it.drift);
        // gentle bob
        it.mesh.position.y += Math.sin(t * 1.2 + (it.mesh.position.x * 0.5)) * 0.0008;
        it.mesh.rotation.x += it.spin.x;
        it.mesh.rotation.y += it.spin.y;
        it.mesh.rotation.z += it.spin.z;
        // wrap drift
        if (Math.abs(it.mesh.position.x) > 5) it.drift.x *= -1;
        if (it.mesh.position.y > 2 || it.mesh.position.y < -2) it.drift.y *= -1;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // pause when offscreen
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !raf) { raf = requestAnimationFrame(tick); }
        else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0 as unknown as number; }
      }
    }, { threshold: 0 });
    io.observe(container);

    return {
      dispose() {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        io.disconnect();
        // dispose geometries/materials
        renderer.dispose();
        canvas.remove();
        scene.traverse((o: THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
            else o.material.dispose();
          }
        });
      },
    };
  } catch {
    return null;
  }
}
