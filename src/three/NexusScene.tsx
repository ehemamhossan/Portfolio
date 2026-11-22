import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeScrollCameraState, type CameraPreset } from '../utils/portfolioLogic';

interface NexusSceneProps {
  scrollProgress: number;
  preset: CameraPreset;
  autoRotate: boolean;
}

const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 0, 0);
const _tempVecA = new THREE.Vector3();
const _tempVecB = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Generates a subtle latitude/longitude meridian and dot-matrix surface texture
 * for the global network sphere—clean, restrained, and zero-404 procedural.
 */
function createGlobeNetworkTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#0a1222';
    ctx.fillRect(0, 0, width, height);

    // Subtle latitude & longitude hairline meridians
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.16)';
    ctx.lineWidth = 1;
    const lonSteps = 18;
    for (let i = 0; i <= lonSteps; i++) {
      const x = (i / lonSteps) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const latSteps = 9;
    for (let j = 1; j < latSteps; j++) {
      const y = (j / latSteps) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Subtle regional cluster dot-matrix representing global markets (Americas, EMEA, South/East Asia)
    const clusters = [
      // North America
      { cx: 0.22, cy: 0.34, rx: 0.09, ry: 0.11 },
      // Europe / EMEA
      { cx: 0.52, cy: 0.31, rx: 0.08, ry: 0.09 },
      // South Asia / Dhaka / APAC
      { cx: 0.72, cy: 0.42, rx: 0.09, ry: 0.11 },
      // Oceania / SE Asia
      { cx: 0.82, cy: 0.62, rx: 0.05, ry: 0.06 },
    ];

    ctx.fillStyle = 'rgba(147, 197, 253, 0.42)';
    for (let x = 8; x < width; x += 14) {
      for (let y = 8; y < height; y += 14) {
        const u = x / width;
        const v = y / height;
        let inside = false;
        for (const c of clusters) {
          const dx = (u - c.cx) / c.rx;
          const dy = (v - c.cy) / c.ry;
          if (dx * dx + dy * dy <= 1.0) {
            inside = true;
            break;
          }
        }
        if (inside) {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function latLonToVec3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - latDeg);
  const theta = THREE.MathUtils.degToRad(lonDeg + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export default function NexusScene({ scrollProgress, preset, autoRotate }: NexusSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const stateRef = useRef({
    scrollProgress,
    preset,
    autoRotate,
    pointerX: 0,
    pointerY: 0,
  });

  stateRef.current.scrollProgress = scrollProgress;
  stateRef.current.preset = preset;
  stateRef.current.autoRotate = autoRotate;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight,
    );

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x070a12;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
      0.1,
      100,
    );

    // Procedural Studio IBL reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Warm key + cool sky/ground fill + cobalt rim lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0b1020, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.9);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    const accentPoint = new THREE.PointLight(0x2563eb, 3.4, 16, 2);
    accentPoint.position.set(2.2, 1.4, 3.2);
    scene.add(accentPoint);

    // Materials with crisp roughness/metalness contrast
    const globeTexture = createGlobeNetworkTexture();
    globeTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const globeCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: globeTexture,
      roughness: 0.72,
      metalness: 0.22,
    });

    const wireframeShellMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });

    const brushedSilverMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 0.35,
    });

    const arcMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.65,
      roughness: 0.32,
      metalness: 0.5,
      transparent: true,
      opacity: 0.78,
    });

    const dotNodeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.5,
      metalness: 0.45,
      roughness: 0.25,
    });

    const hubBeaconMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.6,
    });

    const pulsePacketMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x60a5fa,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.2,
    });

    // Composite Global Connecting-Dots Network Group
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    const GLOBE_RADIUS = 1.62;

    // 1. Primary Globe Core
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 32);
    const globeMesh = new THREE.Mesh(globeGeo, globeCoreMat);
    networkGroup.add(globeMesh);

    // 2. Subtle outer icosahedral wireframe geodesic mesh ("Connecting Dots" lattice)
    const geoLattice = new THREE.IcosahedronGeometry(GLOBE_RADIUS + 0.04, 2);
    const latticeMesh = new THREE.Mesh(geoLattice, wireframeShellMat);
    networkGroup.add(latticeMesh);

    // 3. Two delicate brushed-platinum orbital rings (representing global outreach channels)
    const orbitRingGeoA = new THREE.TorusGeometry(2.38, 0.018, 12, 96);
    const orbitRingA = new THREE.Mesh(orbitRingGeoA, brushedSilverMat);
    orbitRingA.rotation.x = Math.PI * 0.38;
    orbitRingA.rotation.y = Math.PI * 0.12;
    networkGroup.add(orbitRingA);

    const orbitRingGeoB = new THREE.TorusGeometry(2.72, 0.014, 12, 96);
    const orbitRingB = new THREE.Mesh(orbitRingGeoB, arcMat);
    orbitRingB.rotation.x = -Math.PI * 0.28;
    orbitRingB.rotation.z = Math.PI * 0.22;
    networkGroup.add(orbitRingB);

    // 4. Key International Career Hubs (Dhaka HQ, New York / US Remote, London / EU, Dubai / MENA, Singapore / APAC)
    const hubs = [
      { name: 'Dhaka', lat: 23.8, lon: 90.4 },
      { name: 'USA', lat: 39.8, lon: -78.5 },
      { name: 'London', lat: 51.5, lon: -0.1 },
      { name: 'Dubai', lat: 25.2, lon: 55.3 },
      { name: 'Singapore', lat: 1.35, lon: 103.8 },
      { name: 'Toronto', lat: 43.7, lon: -79.4 },
    ];

    const hubBeaconGeo = new THREE.SphereGeometry(0.068, 16, 16);
    const hubHaloGeo = new THREE.RingGeometry(0.095, 0.13, 24);
    const hubPositions: THREE.Vector3[] = [];

    for (const hub of hubs) {
      const pos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS + 0.03);
      hubPositions.push(pos);

      const beacon = new THREE.Mesh(hubBeaconGeo, hubBeaconMat);
      beacon.position.copy(pos);
      networkGroup.add(beacon);

      const halo = new THREE.Mesh(hubHaloGeo, brushedSilverMat);
      halo.position.copy(pos).multiplyScalar(1.015);
      halo.lookAt(pos.clone().multiplyScalar(2));
      networkGroup.add(halo);
    }

    // 5. Curved Connection Arcs linking Dhaka <-> Global Markets + Traveling Signal Packets
    const arcPairs: Array<[number, number]> = [
      [0, 1], // Dhaka -> USA
      [0, 2], // Dhaka -> London
      [0, 3], // Dhaka -> Dubai
      [0, 4], // Dhaka -> Singapore
      [1, 2], // USA -> London
      [2, 3], // London -> Dubai
      [1, 5], // USA -> Toronto
    ];

    const arcGeometries: THREE.TubeGeometry[] = [];
    const arcCurves: THREE.QuadraticBezierCurve3[] = [];
    const packetMeshes: THREE.Mesh[] = [];
    const packetGeo = new THREE.SphereGeometry(0.042, 12, 12);

    for (let i = 0; i < arcPairs.length; i++) {
      const [aIdx, bIdx] = arcPairs[i];
      const start = hubPositions[aIdx];
      const end = hubPositions[bIdx];

      const mid = _tempVecA.addVectors(start, end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      const lift = GLOBE_RADIUS + 0.25 + dist * 0.28;
      mid.normalize().multiplyScalar(lift);

      const curve = new THREE.QuadraticBezierCurve3(start.clone(), mid.clone(), end.clone());
      arcCurves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.012, 8, false);
      arcGeometries.push(tubeGeo);
      const tubeMesh = new THREE.Mesh(tubeGeo, arcMat);
      networkGroup.add(tubeMesh);

      const packet = new THREE.Mesh(packetGeo, pulsePacketMat);
      networkGroup.add(packet);
      packetMeshes.push(packet);
    }

    // 6. "Connecting Dots" Fibonacci Constellation + Ambient Starfield Nodes (InstancedMesh, 96 instances)
    const dotCount = 96;
    const dotGeo = new THREE.SphereGeometry(0.036, 10, 10);
    const dotInstanced = new THREE.InstancedMesh(dotGeo, dotNodeMat, dotCount);
    dotInstanced.frustumCulled = false;

    const dummy = new THREE.Object3D();
    const dotData: Array<{
      baseDir: THREE.Vector3;
      radius: number;
      speed: number;
      phase: number;
      scale: number;
    }> = [];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2;
      const rSlice = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const dir = new THREE.Vector3(
        Math.cos(theta) * rSlice,
        y,
        Math.sin(theta) * rSlice,
      ).normalize();

      const isOuter = i % 3 === 0;
      const radius = isOuter ? 2.65 + (i % 5) * 0.38 : 1.98 + (i % 4) * 0.14;
      const scale = isOuter ? 0.68 + (i % 3) * 0.22 : 0.85 + (i % 4) * 0.14;

      dotData.push({
        baseDir: dir,
        radius,
        speed: 0.08 + (i % 4) * 0.04,
        phase: i * 0.37,
        scale,
      });

      dummy.position.copy(dir).multiplyScalar(radius);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      dotInstanced.setMatrixAt(i, dummy.matrix);
    }
    dotInstanced.instanceMatrix.needsUpdate = true;
    dotInstanced.computeBoundingSphere();
    networkGroup.add(dotInstanced);

    // 7. Subtle LineSegments network chords connecting nearby outer dots for authentic "connecting dots" feel
    const linePositions: number[] = [];
    for (let i = 0; i < 36; i++) {
      const a = dotData[i];
      const b = dotData[(i + 5) % 36];
      _tempVecA.copy(a.baseDir).multiplyScalar(a.radius);
      _tempVecB.copy(b.baseDir).multiplyScalar(b.radius);
      if (_tempVecA.distanceTo(_tempVecB) < 2.2) {
        linePositions.push(
          _tempVecA.x,
          _tempVecA.y,
          _tempVecA.z,
          _tempVecB.x,
          _tempVecB.y,
          _tempVecB.z,
        );
      }
    }
    const chordGeo = new THREE.BufferGeometry();
    chordGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const chordMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.22,
    });
    const chordLines = new THREE.LineSegments(chordGeo, chordMat);
    networkGroup.add(chordLines);

    // Initial camera pose
    const initialCam = computeScrollCameraState(
      stateRef.current.scrollProgress,
      stateRef.current.preset,
    );
    camera.position.set(...initialCam.cameraPosition);
    _currentLookAt.set(...initialCam.lookAtTarget);
    camera.lookAt(_currentLookAt);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      stateRef.current.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };

    const onContextRestored = () => {
      renderer.setSize(
        container.clientWidth || window.innerWidth,
        container.clientHeight || window.innerHeight,
      );
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const {
        scrollProgress: sp,
        preset: pr,
        autoRotate: ar,
        pointerX,
        pointerY,
      } = stateRef.current;
      const shouldSpin = ar && !prefersReducedMotion;
      if (shouldSpin) {
        elapsed += delta;
      }

      const target = computeScrollCameraState(sp, pr);

      _desiredCamPos.set(
        target.cameraPosition[0] + pointerX * 0.25,
        target.cameraPosition[1] + pointerY * 0.18,
        target.cameraPosition[2],
      );
      _desiredLookAt.set(...target.lookAtTarget);

      const dampLambda = prefersReducedMotion ? 18 : 4.5;
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        _desiredCamPos.x,
        dampLambda,
        delta,
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        _desiredCamPos.y,
        dampLambda,
        delta,
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        _desiredCamPos.z,
        dampLambda,
        delta,
      );

      _currentLookAt.x = THREE.MathUtils.damp(
        _currentLookAt.x,
        _desiredLookAt.x,
        dampLambda,
        delta,
      );
      _currentLookAt.y = THREE.MathUtils.damp(
        _currentLookAt.y,
        _desiredLookAt.y,
        dampLambda,
        delta,
      );
      _currentLookAt.z = THREE.MathUtils.damp(
        _currentLookAt.z,
        _desiredLookAt.z,
        dampLambda,
        delta,
      );
      camera.lookAt(_currentLookAt);

      // Rotate global network smoothly with scroll + idle spin
      const targetRotY = -0.7 + target.sculptureRotationY + (shouldSpin ? elapsed * 0.16 : 0);
      networkGroup.rotation.y = THREE.MathUtils.damp(
        networkGroup.rotation.y,
        targetRotY,
        4.5,
        delta,
      );
      networkGroup.rotation.x = THREE.MathUtils.damp(
        networkGroup.rotation.x,
        target.sculptureTiltX * 0.65,
        4.5,
        delta,
      );

      // Scroll expansion gently breathes the outer constellation & orbital rings
      const spreadScale = 1 + target.ringSpread * 0.18;
      orbitRingA.scale.setScalar(
        THREE.MathUtils.damp(orbitRingA.scale.x, spreadScale, 5, delta),
      );
      orbitRingB.scale.setScalar(
        THREE.MathUtils.damp(orbitRingB.scale.x, 1 + target.ringSpread * 0.25, 5, delta),
      );
      orbitRingA.rotation.z = shouldSpin ? elapsed * 0.12 : sp * 0.8;
      orbitRingB.rotation.y = shouldSpin ? -elapsed * 0.1 : -sp * 0.6;

      // Animate traveling signal packets along the connection arcs
      for (let i = 0; i < arcCurves.length; i++) {
        const t = ((elapsed * 0.28 + i * 0.17 + sp * 0.5) % 1 + 1) % 1;
        arcCurves[i].getPointAt(t, _tempVecA);
        packetMeshes[i].position.copy(_tempVecA);
      }

      // Gently float outer constellation dots
      if (shouldSpin) {
        for (let i = 0; i < dotCount; i++) {
          const d = dotData[i];
          const breathe = 1 + Math.sin(elapsed * d.speed * 4 + d.phase) * 0.04 + target.ringSpread * 0.16;
          dummy.position.copy(d.baseDir).multiplyScalar(d.radius * breathe);
          dummy.scale.setScalar(d.scale);
          dummy.updateMatrix();
          dotInstanced.setMatrixAt(i, dummy.matrix);
        }
        dotInstanced.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      globeGeo.dispose();
      geoLattice.dispose();
      orbitRingGeoA.dispose();
      orbitRingGeoB.dispose();
      hubBeaconGeo.dispose();
      hubHaloGeo.dispose();
      packetGeo.dispose();
      dotGeo.dispose();
      chordGeo.dispose();
      for (const g of arcGeometries) g.dispose();

      globeCoreMat.dispose();
      wireframeShellMat.dispose();
      brushedSilverMat.dispose();
      arcMat.dispose();
      dotNodeMat.dispose();
      hubBeaconMat.dispose();
      pulsePacketMat.dispose();
      chordMat.dispose();
      globeTexture.dispose();
      envTarget.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_72%_38%,rgba(37,99,235,0.22),transparent_55%),#070A12]"
      />
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="three-canvas-host"
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
