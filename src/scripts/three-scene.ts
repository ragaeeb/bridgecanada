import * as THREE from 'three';

export interface ThreeSceneController {
  updateScroll(progress: number): void;
  updatePointer(x: number, y: number): void;
  setVisibility(visible: boolean): void;
  destroy(): void;
  resize(): void;
}

export function computeResponsiveGlobeLayout(width: number, height: number) {
  const aspect = Math.max(0.01, width) / Math.max(1, height);
  return {
    scale: THREE.MathUtils.clamp(aspect / 0.9, 0.58, 1),
    horizontalOffsetScale: THREE.MathUtils.clamp((aspect - 0.45) / 0.8, 0, 1),
  };
}

// Convert Lat/Lng to 3D Cartesian coordinates on sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Cities for delegations and trade routes
const HUBS = {
  // Canadian Gateways
  ottawa: { name: 'Ottawa', lat: 45.4215, lng: -75.6972, isCanadian: true },
  toronto: { name: 'Toronto', lat: 43.6532, lng: -79.3832, isCanadian: true },
  montreal: { name: 'Montreal', lat: 45.5017, lng: -73.5673, isCanadian: true },
  vancouver: { name: 'Vancouver', lat: 49.2827, lng: -123.1207, isCanadian: true },
  // International Delegation Origins
  dhaka: { name: 'Dhaka', lat: 23.8103, lng: 90.4125, isCanadian: false },
  london: { name: 'London', lat: 51.5074, lng: -0.1278, isCanadian: false },
  dubai: { name: 'Dubai', lat: 25.2048, lng: 55.2708, isCanadian: false },
  singapore: { name: 'Singapore', lat: 1.3521, lng: 103.8198, isCanadian: false },
  tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, isCanadian: false },
};

const ROUTES = [
  { from: HUBS.dhaka, to: HUBS.ottawa, color: 0x10b981 }, // Green / Emerald
  { from: HUBS.dhaka, to: HUBS.montreal, color: 0xe8c889 }, // Gold
  { from: HUBS.london, to: HUBS.toronto, color: 0x38bdf8 }, // Sky blue
  { from: HUBS.dubai, to: HUBS.toronto, color: 0xe8c889 }, // Gold
  { from: HUBS.singapore, to: HUBS.vancouver, color: 0x10b981 }, // Emerald
  { from: HUBS.tokyo, to: HUBS.vancouver, color: 0xf43f5e }, // Crimson
  { from: HUBS.toronto, to: HUBS.ottawa, color: 0xffffff }, // Internal Canada
  { from: HUBS.ottawa, to: HUBS.montreal, color: 0xffffff }, // Internal Canada
];

export function initThreeScene(container: HTMLElement): ThreeSceneController | null {
  try {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return null;
    }

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // Track disposables for complete cleanup (BR-002)
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 14);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // BR-035: WebGL renderer initialization failure fails gracefully
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const canvas = renderer.domElement;
    canvas.className = 'three-canvas';
    container.appendChild(canvas);

    // Group for the 3D globe and routes
    const globeGroup = new THREE.Group();
    globeGroup.position.set(2.4, -0.4, 0); // Position to the right-side of the stage
    scene.add(globeGroup);

    const GLOBE_RADIUS = 3.6;

    // 1. Globe wireframe / dot matrix mesh
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 36);
    geometriesToDispose.push(globeGeo);
    const globeWireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    materialsToDispose.push(globeWireMat);
    const globeWire = new THREE.Mesh(globeGeo, globeWireMat);
    globeGroup.add(globeWire);

    // Inner core glow
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 24);
    geometriesToDispose.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x052e24,
      transparent: true,
      opacity: 0.65,
    });
    materialsToDispose.push(coreMat);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Outer atmospheric halo
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 32, 24);
    geometriesToDispose.push(haloGeo);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.06, 0.72, 0.51, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    materialsToDispose.push(haloMat);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // 2. City Hub Pins & Pulsing Rings
    const hubPointers: { mesh: THREE.Mesh; ring: THREE.Mesh; baseScale: number }[] = [];

    Object.values(HUBS).forEach((hub) => {
      const pos = latLngToVector3(hub.lat, hub.lng, GLOBE_RADIUS);

      // Marker dot
      const pinGeo = new THREE.SphereGeometry(hub.isCanadian ? 0.09 : 0.06, 16, 16);
      geometriesToDispose.push(pinGeo);
      const pinMat = new THREE.MeshBasicMaterial({
        color: hub.isCanadian ? 0xf43f5e : 0xe8c889,
      });
      materialsToDispose.push(pinMat);
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      globeGroup.add(pin);

      // Outer ripple ring
      const ringGeo = new THREE.RingGeometry(0.08, 0.14, 24);
      geometriesToDispose.push(ringGeo);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hub.isCanadian ? 0xf43f5e : 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      materialsToDispose.push(ringMat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos.clone().multiplyScalar(1.01));
      ring.lookAt(pos.clone().multiplyScalar(2));
      globeGroup.add(ring);

      hubPointers.push({ mesh: pin, ring, baseScale: hub.isCanadian ? 1.4 : 1.0 });
    });

    // 3. Curved Flight / Trade Arcs with Animated Light Pulses
    const pulseBeacons: { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh; speed: number; progress: number }[] =
      [];

    ROUTES.forEach((route) => {
      const vFrom = latLngToVector3(route.from.lat, route.from.lng, GLOBE_RADIUS);
      const vTo = latLngToVector3(route.to.lat, route.to.lng, GLOBE_RADIUS);

      // Calculate elevated midpoint for 3D trajectory
      const distance = vFrom.distanceTo(vTo);
      const midPoint = vFrom.clone().add(vTo).multiplyScalar(0.5);
      const altitude = GLOBE_RADIUS + Math.min(distance * 0.42, 1.8);
      midPoint.normalize().multiplyScalar(altitude);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, midPoint, vTo);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      geometriesToDispose.push(curveGeo);

      // BR-066: LineBasicMaterial standard lines without unsupported linewidth
      const curveMat = new THREE.LineBasicMaterial({
        color: route.color,
        transparent: true,
        opacity: 0.45,
      });
      materialsToDispose.push(curveMat);
      const arcLine = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(arcLine);

      // Pulse bead traveling along curve
      const pulseGeo = new THREE.SphereGeometry(0.05, 12, 12);
      geometriesToDispose.push(pulseGeo);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      materialsToDispose.push(pulseMat);
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      globeGroup.add(pulseMesh);

      pulseBeacons.push({
        curve,
        mesh: pulseMesh,
        speed: 0.2 + Math.random() * 0.15, // Units per second for delta-time
        progress: Math.random(),
      });
    });

    // 4. Ambient 3D Particle Nebula
    const PARTICLE_COUNT = 550;
    const particleGeo = new THREE.BufferGeometry();
    geometriesToDispose.push(particleGeo);
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    const colorEmerald = new THREE.Color(0x10b981);
    const colorGold = new THREE.Color(0xe8c889);
    const colorCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 28;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 16 - 2;

      const chosenColor = Math.random() > 0.5 ? colorEmerald : Math.random() > 0.5 ? colorGold : colorCyan;
      particleColors[i3] = chosenColor.r;
      particleColors[i3 + 1] = chosenColor.g;
      particleColors[i3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    materialsToDispose.push(particleMat);

    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // Dynamic state
    let scrollProgress = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;
    let isVisible = true;
    let isContextLost = false;
    let animationFrameId = 0;
    let lastTime = 0;
    let totalTime = 0;
    let responsiveLayout = computeResponsiveGlobeLayout(width, height);

    // BR-039: Handle context loss & restoration gracefully
    const onContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    const onContextRestored = () => {
      isContextLost = false;
      requestFrame();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // BR-004 / BR-028 / BR-097: Time-based animation loop with bounded delta
    const animate = (timestamp: number) => {
      animationFrameId = 0;

      if (!isVisible || isContextLost) {
        return;
      }

      if (!lastTime) {
        lastTime = timestamp;
      }

      // Compute delta-time bounded to max 0.1s to prevent jump after background tab suspension
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      totalTime += dt;

      // Pointer smoothing
      const pointerSmoothing = 1 - Math.exp(-12 * dt);
      currentPointerX += (targetPointerX - currentPointerX) * pointerSmoothing;
      currentPointerY += (targetPointerY - currentPointerY) * pointerSmoothing;

      // Animate flight arc pulse beads (BR-026: avoid per-frame vector allocation by passing target)
      pulseBeacons.forEach((beacon) => {
        beacon.progress = (beacon.progress + beacon.speed * dt) % 1;
        beacon.curve.getPointAt(beacon.progress, beacon.mesh.position);
      });

      // Animate city rings pulsing
      hubPointers.forEach((hub, idx) => {
        const scale = hub.baseScale * (1 + 0.3 * Math.sin(totalTime * 3 + idx * 0.8));
        hub.ring.scale.set(scale, scale, scale);
      });

      // Globe rotation & orientation
      const baseRotationY = totalTime * 0.15;
      const scrollAngleY = scrollProgress * Math.PI * 1.6;
      globeGroup.rotation.y = baseRotationY + scrollAngleY + currentPointerX * 0.25;
      globeGroup.rotation.x = 0.22 + scrollProgress * 0.18 + currentPointerY * 0.15;

      // Choreograph Camera & Group Position along scroll timeline
      // BR-024: Ensure scale is always accurately restored when reverse-scrolling
      if (scrollProgress < 0.25) {
        const t = scrollProgress / 0.25;
        globeGroup.position.x = (2.4 - t * 0.4) * responsiveLayout.horizontalOffsetScale;
        globeGroup.position.y = -0.4 - t * 0.2;
        globeGroup.scale.setScalar(responsiveLayout.scale);
        camera.position.z = 14 + t * 1.5;
      } else if (scrollProgress < 0.65) {
        const t = (scrollProgress - 0.25) / 0.4;
        globeGroup.position.x = (2.0 - t * 4.2) * responsiveLayout.horizontalOffsetScale;
        globeGroup.position.y = -0.6 + t * 0.4;
        globeGroup.scale.setScalar(responsiveLayout.scale);
        camera.position.z = 15.5 - t * 1.2;
      } else {
        const t = (scrollProgress - 0.65) / 0.35;
        globeGroup.position.x = (-2.2 + t * 1.8) * responsiveLayout.horizontalOffsetScale;
        globeGroup.position.y = -0.2 - t * 0.8;
        globeGroup.scale.setScalar(Math.max(0.65, 1 - t * 0.35) * responsiveLayout.scale);
        camera.position.z = 14.3 + t * 2.5;
      }

      // Gentle particle drift
      particleField.rotation.y = totalTime * 0.03 + currentPointerX * 0.08;
      particleField.rotation.x = totalTime * 0.02 + currentPointerY * 0.05;

      renderer.render(scene, camera);

      // Schedule next frame only while active
      if (isVisible && !isContextLost) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    function requestFrame() {
      if (!animationFrameId && isVisible && !isContextLost) {
        lastTime = 0;
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    requestFrame();

    return {
      updateScroll(progress: number) {
        scrollProgress = Math.max(0, Math.min(1, progress));
        requestFrame();
      },
      updatePointer(x: number, y: number) {
        targetPointerX = x;
        targetPointerY = y;
        requestFrame();
      },
      // BR-042: Visibility controlled by lifecycle coordinator
      setVisibility(visible: boolean) {
        if (isVisible !== visible) {
          isVisible = visible;
          if (isVisible) {
            requestFrame();
          } else if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
          }
        }
      },
      // BR-060: Recompute clamped pixel ratio on resize
      resize() {
        const w = container.clientWidth || window.innerWidth || 800;
        const h = container.clientHeight || window.innerHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        responsiveLayout = computeResponsiveGlobeLayout(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        requestFrame();
      },
      // BR-002: Dispose all tracked geometries, materials, listeners, and renderer
      destroy() {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }

        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);

        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }

        geometriesToDispose.forEach((geo) => geo.dispose());
        materialsToDispose.forEach((mat) => mat.dispose());

        renderer.dispose();
      },
    };
  } catch {
    // BR-035: Fail gracefully to photographic/CSS experience
    return null;
  }
}
