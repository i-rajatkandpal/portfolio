/**
 * PARTICLE WAVE — Interactive 3D hero background
 * An ocean of 10,000 particles arranged in a grid,
 * undulating with overlapping sine waves.
 * Mouse hover creates ripples. Camera slowly orbits.
 */

(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    camera.position.set(0, 28, 42);
    camera.lookAt(0, 0, 0);

    function resize() {
        const w = canvas.parentElement.clientWidth;
        const h = canvas.parentElement.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── Particle grid ── */
    const COLS = 100, ROWS = 100;
    const SPACING = 0.55;
    const TOTAL = COLS * ROWS;

    const positions = new Float32Array(TOTAL * 3);
    const colors = new Float32Array(TOTAL * 3);
    const sizes = new Float32Array(TOTAL);

    const offW = (COLS - 1) * SPACING * 0.5;
    const offD = (ROWS - 1) * SPACING * 0.5;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            positions[i * 3] = c * SPACING - offW;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = r * SPACING - offD;
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.42;
            colors[i * 3 + 2] = 0.21;
            sizes[i] = 2.0;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    /* ── Shader material — round glowing dots ── */
    const mat = new THREE.ShaderMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float alpha = 1.0 - smoothstep(0.4, 1.0, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ── Mouse ripple tracking ── */
    const mouse = { x: 0.5, y: 0.5 };   // normalised 0-1
    const mouseW = { x: 0, z: 0 };        // world-space approximation

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
        // Map to grid world coords
        mouseW.x = (mouse.x - 0.5) * COLS * SPACING;
        mouseW.z = (mouse.y - 0.5) * ROWS * SPACING;
    });

    /* ── Color helpers ── */
    const ORANGE = new THREE.Color(0xff6b35);
    const PEAK = new THREE.Color(0xffffff);
    const TROUGH = new THREE.Color(0x1a0a00);
    const tmpCol = new THREE.Color();

    /* ── Clock & orbit ── */
    const clock = new THREE.Clock();
    let camAngle = 0;

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        /* slow camera orbit */
        camAngle += 0.0008;
        camera.position.x = Math.sin(camAngle) * 44;
        camera.position.z = Math.cos(camAngle) * 44;
        camera.position.y = 24 + Math.sin(camAngle * 0.4) * 6;
        camera.lookAt(0, 0, 0);

        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        const sz = geo.attributes.size;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const i = r * COLS + c;
                const wx = positions[i * 3];       // base x
                const wz = positions[i * 3 + 2];  // base z

                /* layered sine waves */
                const wave1 = Math.sin(wx * 0.35 + t * 1.4) * 2.2;
                const wave2 = Math.cos(wz * 0.28 + t * 1.0) * 1.8;
                const wave3 = Math.sin((wx + wz) * 0.22 + t * 0.7) * 1.2;

                /* mouse ripple — distance-based ring wave */
                const dx = wx - mouseW.x;
                const dz = wz - mouseW.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const ripple = Math.sin(dist * 0.6 - t * 4.0) * (2.8 / (dist * 0.18 + 1.0));

                const y = wave1 + wave2 + wave3 + ripple;
                pos.setY(i, y);

                /* colour by height: orange at mid, white at peak, dark at trough */
                const n = (y + 7) / 14;   // normalise roughly 0-1
                if (n > 0.5) {
                    tmpCol.lerpColors(ORANGE, PEAK, (n - 0.5) * 2);
                } else {
                    tmpCol.lerpColors(TROUGH, ORANGE, n * 2);
                }
                col.setXYZ(i, tmpCol.r, tmpCol.g, tmpCol.b);

                /* size: bigger at peaks */
                sz.setX(i, 1.5 + Math.max(0, n - 0.5) * 5);
            }
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;
        sz.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();
})();
