/**
 * Clebsch Robotics - Full-Page 3D Robot Lab
 * Always-dark canvas with high-contrast silver/titanium materials
 * Solid / Wireframe / Hologram X-Ray + Auto-Spin + Speed slider
 */

class ClebschRobotLab {
  constructor() {
    this.instances = {};
    this.initTabSwitcher();
    this.waitAndInit();
  }

  waitAndInit() {
    if (typeof THREE !== "undefined") { this.initAll(); }
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.onload = () => this.initAll();
      document.head.appendChild(s);
    }
  }

  initAll() {
    this.initCombat();
    this.initDrone();
    this.initArm();
    this.initPrototypes();
  }

  initTabSwitcher() {
    const tabs = document.querySelectorAll(".rlab-tab");
    const panels = document.querySelectorAll(".rlab-full-panel");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const bot = tab.dataset.bot;
        tabs.forEach(t => t.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        const panel = document.getElementById("panel-" + bot);
        if (panel) panel.classList.add("active");
        const inst = this.instances[bot];
        if (inst) setTimeout(() => {
          const c = inst.renderer.domElement.parentElement;
          inst.camera.aspect = c.clientWidth / c.clientHeight;
          inst.camera.updateProjectionMatrix();
          inst.renderer.setSize(c.clientWidth, c.clientHeight);
        }, 60);
        });
    });
  }

  isCanvasVisible(canvas) {
    if (!canvas) return false;
    const panel = canvas.closest(".rlab-full-panel");
    if (panel && !panel.classList.contains("active") && window.getComputedStyle(panel).display === "none") {
      return false;
    }
    const rect = canvas.getBoundingClientRect();
    return (
      rect.bottom >= -80 &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 80 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  makeScene() {
    const scene = new THREE.Scene();
    return scene;
  }

  makeRenderer(canvas) {
    const container = canvas.parentElement;
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 280;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    return { renderer, w, h };
  }

  addLights(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(8, 14, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 2.2);
    fill.position.set(-8, 6, -6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.5);
    rim.position.set(0, -4, -8);
    scene.add(rim);
  }

  makeMaterials() {
    return {
      // Pure White / Silver Titanium Studio Finish
      body:      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.25, metalness: 0.85 }),
      titanium:  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.95 }),
      dark:      new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.35, metalness: 0.75 }),
      joint:     new THREE.MeshStandardMaterial({ color: 0xbbbbcc, roughness: 0.2,  metalness: 0.9 }),
      accent:    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1,  metalness: 0.95 }),
      // Pure White Wireframe
      wire:      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
      // Pure White Hologram X-Ray
      xray:      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.75, opacity: 0.65, transparent: true, roughness: 0.1, emissive: 0x555555, emissiveIntensity: 0.3 }),
    };
  }

  addDragControls(canvas, group, camera, lookAt) {
    let isDragging = false, prev = { x: 0, y: 0 };
    canvas.addEventListener("mousedown", e => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("mouseup", () => isDragging = false);
    window.addEventListener("mousemove", e => {
      if (!isDragging) return;
      group.rotation.y += (e.clientX - prev.x) * 0.008;
      camera.position.y = Math.max(0.5, Math.min(10, camera.position.y - (e.clientY - prev.y) * 0.025));
      camera.lookAt(...lookAt);
      prev = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("touchstart", e => { isDragging = true; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    canvas.addEventListener("touchend", () => isDragging = false, { passive: true });
    canvas.addEventListener("touchmove", e => {
      if (!isDragging) return;
      group.rotation.y += (e.touches[0].clientX - prev.x) * 0.008;
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
  }

  bindModeButtons(selector, group, mats) {
    document.querySelectorAll("[" + selector + "]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[" + selector + "]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.getAttribute(selector);
        group.traverse(c => {
          if (!c.isMesh) return;
          if (mode === "wireframe")    c.material = mats.wire;
          else if (mode === "xray")    c.material = mats.xray;
          else                         c.material = c.userData.origMat || mats.body;
        });
      });
    });
    group.traverse(c => { if (c.isMesh && !c.userData.origMat) c.userData.origMat = c.material; });
  }

  bindSpinSpeed(spinId, speedId, getSpeed, setSpeed, getRotating, setRotating) {
    const spinBtn = document.getElementById(spinId);
    if (spinBtn) spinBtn.addEventListener("click", () => {
      setRotating(!getRotating());
      spinBtn.classList.toggle("active", getRotating());
    });
    const slider = document.getElementById(speedId);
    if (slider) slider.addEventListener("input", () => setSpeed(slider.value * 0.0015));
  }

  // ============================================================
  // COMBAT BOT (Project Vortex)
  // ============================================================
  initCombat() {
    const canvas = document.getElementById("canvas-combat-lab");
    if (!canvas) return;

    const scene = this.makeScene(0x0a0a10);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3.5, 7);
    camera.lookAt(0, 0.8, 0);

    // Grid with visible lines on dark bg
    const grid = new THREE.GridHelper(14, 20, 0x334455, 0x223344);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const group = new THREE.Group();
    scene.add(group);

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 2.0), mats.body);
    chassis.position.y = 0.5;
    group.add(chassis);

    // Front wedge
    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.3, 2.0, 3), mats.titanium);
    wedge.rotateZ(Math.PI / 2);
    wedge.position.set(0, 0.45, 1.15);
    group.add(wedge);

    // Drum weapon
    const drumGrp = new THREE.Group();
    drumGrp.position.set(0, 0.6, 1.35);
    group.add(drumGrp);

    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.65, 22), mats.dark);
    drum.rotateZ(Math.PI / 2);
    drumGrp.add(drum);

    for (let t = 0; t < 5; t++) {
      const ang = (t / 5) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.12), mats.titanium);
      tooth.position.set(Math.cos(ang) * 0.38, Math.sin(ang) * 0.38, t % 2 === 0 ? 0.5 : -0.5);
      drumGrp.add(tooth);
    }

    // 4 Wheels
    [[-1.2, 0.35, 0.65],[1.2, 0.35, 0.65],[-1.2, 0.35, -0.65],[1.2, 0.35, -0.65]].forEach(pos => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 18), mats.dark);
      wh.rotateZ(Math.PI / 2);
      wh.position.set(...pos);
      group.add(wh);
    });

    // Side plates
    [-1.15, 1.15].forEach(x => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 1.8), mats.titanium);
      plate.position.set(x, 0.7, 0);
      group.add(plate);
    });

    this.bindModeButtons("data-combat-mode", group, mats);
    this.addDragControls(canvas, group, camera, [0, 0.8, 0]);

    let isRotating = true, rotSpeed = 0.006;
    this.bindSpinSpeed("combat-spin-btn", "combat-speed",
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    this.instances.combat = { renderer, camera };

    const volt = document.getElementById("c-volt");
    const temp = document.getElementById("c-temp");
    const rpm  = document.getElementById("c-rpm");
    const gyro = document.getElementById("c-gyro");
    const amp  = document.getElementById("c-amp");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      if (isRotating) group.rotation.y += rotSpeed;
      drumGrp.rotation.x += 0.35;
      const t = Date.now() * 0.001;
      if (Math.random() < 0.04) {
        if (volt) volt.textContent = (24.0 + Math.sin(t * 0.3) * 0.4).toFixed(1) + " V";
        if (temp) temp.textContent = (33 + Math.sin(t * 0.5) * 1.2).toFixed(1) + " °C";
        if (rpm)  rpm.textContent  = (10050 + Math.floor(Math.random() * 300)).toLocaleString() + " RPM";
        if (gyro) gyro.textContent = "P: " + (15 + Math.sin(t) * 0.8).toFixed(1) + "° | R: " + (-8.3 + Math.cos(t * 1.3) * 0.5).toFixed(1) + "°";
        if (amp)  amp.textContent  = (40 + Math.sin(t * 2) * 3).toFixed(1) + " A";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // ============================================================
  // UAV DRONE (Project SkyGuardian)
  // ============================================================
  initDrone() {
    const canvas = document.getElementById("canvas-drone-lab");
    if (!canvas) return;

    const scene = this.makeScene(0x080812);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 4.5, 8.5);
    camera.lookAt(0, 1.5, 0);

    const grid = new THREE.GridHelper(14, 20, 0x334455, 0x223344);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const droneGrp = new THREE.Group();
    droneGrp.position.y = 1.6;
    scene.add(droneGrp);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 6), mats.dark);
    droneGrp.add(hub);

    const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.titanium);
    topDome.position.y = 0.18;
    droneGrp.add(topDome);

    const rotorBlades = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const armGrp = new THREE.Group();
      armGrp.rotation.y = ang;
      droneGrp.add(armGrp);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8), mats.body);
      arm.rotateZ(Math.PI / 2);
      arm.position.x = 0.8;
      armGrp.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14), mats.titanium);
      motor.position.set(1.6, 0.07, 0);
      armGrp.add(motor);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.07), mats.body);
      blade.position.set(1.6, 0.15, 0);
      armGrp.add(blade);
      rotorBlades.push(blade);
    }

    [-0.48, 0.48].forEach(x => {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 1.4), mats.body);
      skid.position.set(x, -0.4, 0);
      droneGrp.add(skid);
    });

    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), mats.dark);
    gimbal.position.set(0, -0.25, 0.35);
    droneGrp.add(gimbal);

    this.bindModeButtons("data-drone-mode", droneGrp, mats);
    this.addDragControls(canvas, droneGrp, camera, [0, 1.5, 0]);

    let isRotating = true, rotSpeed = 0.005;
    this.bindSpinSpeed("drone-spin-btn", "drone-speed",
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    this.instances.drone = { renderer, camera };

    const volt   = document.getElementById("d-volt");
    const alt    = document.getElementById("d-alt");
    const spd    = document.getElementById("d-spd");
    const sats   = document.getElementById("d-sats");
    const thrust = document.getElementById("d-thrust");
    const dtime  = document.getElementById("d-time");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      const t = Date.now() * 0.002;
      if (isRotating) droneGrp.rotation.y += rotSpeed;
      droneGrp.position.y = 1.6 + Math.sin(t * 1.8) * 0.09;
      rotorBlades.forEach((b, i) => { b.rotation.y += (i % 2 === 0 ? 0.55 : -0.55); });
      if (Math.random() < 0.04) {
        if (volt)   volt.textContent   = (22.6 + Math.sin(t * 0.3) * 0.3).toFixed(1) + " V";
        if (alt)    alt.textContent    = (48.4 + Math.sin(t * 0.8) * 0.6).toFixed(1) + " m";
        if (spd)    spd.textContent    = (12.2 + Math.cos(t * 0.5) * 0.5).toFixed(1) + " m/s";
        if (sats)   sats.textContent   = (11 + (Math.random() > 0.9 ? 1 : 0)) + " SATs";
        if (thrust) thrust.textContent = (82 + Math.sin(t * 2) * 3).toFixed(1) + " %";
        if (dtime)  dtime.textContent  = "34 min";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // ============================================================
  // ROBOTIC ARM (Project CyberArm-6)
  // ============================================================
  initArm() {
    const canvas = document.getElementById("canvas-arm-lab");
    if (!canvas) return;

    const scene = this.makeScene(0x080810);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 4.2, 8.5);
    camera.lookAt(0, 2.0, 0);

    const grid = new THREE.GridHelper(14, 20, 0x334455, 0x223344);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const armGrp = new THREE.Group();
    scene.add(armGrp);

    // Base pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.32, 24), mats.dark);
    base.position.y = 0.16;
    armGrp.add(base);

    const yawGrp = new THREE.Group();
    yawGrp.position.y = 0.32;
    armGrp.add(yawGrp);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.45, 20), mats.body);
    turret.position.y = 0.22;
    yawGrp.add(turret);

    const shoulderGrp = new THREE.Group();
    shoulderGrp.position.y = 0.44;
    yawGrp.add(shoulderGrp);

    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.7, 0.42), mats.body);
    lower.position.y = 0.98;
    shoulderGrp.add(lower);

    const elbowGrp = new THREE.Group();
    elbowGrp.position.y = 1.8;
    shoulderGrp.add(elbowGrp);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mats.titanium);
    elbowGrp.add(elbow);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.35, 0.32), mats.body);
    forearm.position.y = 0.72;
    elbowGrp.add(forearm);

    const wristGrp = new THREE.Group();
    wristGrp.position.y = 1.4;
    elbowGrp.add(wristGrp);

    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), mats.titanium);
    wristGrp.add(wrist);

    const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.11), mats.joint);
    clawL.position.set(-0.16, 0.26, 0);
    wristGrp.add(clawL);

    const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.11), mats.joint);
    clawR.position.set(0.16, 0.26, 0);
    wristGrp.add(clawR);

    this.bindModeButtons("data-arm-mode", armGrp, mats);
    this.addDragControls(canvas, armGrp, camera, [0, 2.0, 0]);

    let isRotating = true, rotSpeed = 0.004;
    this.bindSpinSpeed("arm-spin-btn", "arm-speed",
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    this.instances.arm = { renderer, camera };

    const t1     = document.getElementById("a-t1");
    const t3     = document.getElementById("a-t3");
    const grip   = document.getElementById("a-grip");
    const wristE = document.getElementById("a-wrist");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      const t = Date.now() * 0.0015;
      if (isRotating) armGrp.rotation.y += rotSpeed;
      yawGrp.rotation.y      = Math.sin(t * 0.7) * 0.45;
      shoulderGrp.rotation.z = Math.sin(t * 1.0) * 0.28 + 0.08;
      elbowGrp.rotation.z    = Math.cos(t * 1.2) * 0.38 - 0.15;
      wristGrp.rotation.x    = Math.sin(t * 2.0) * 0.42;
      const pinch = (Math.sin(t * 3.0) + 1) * 0.09;
      clawL.position.x = -0.16 + pinch;
      clawR.position.x =  0.16 - pinch;
      if (Math.random() < 0.04) {
        if (t1) t1.textContent = (18.2 + Math.sin(t) * 0.6).toFixed(1) + " Nm";
        if (t3) t3.textContent = (12.0 + Math.cos(t * 1.5) * 0.5).toFixed(1) + " Nm";
        if (grip) grip.textContent = (40 + Math.sin(t * 3) * 5).toFixed(0) + " N";
        if (wristE) wristE.textContent = (0.02 + Math.random() * 0.02).toFixed(3) + " mm";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // ============================================================
  // FLEET PROTOTYPES 3D INITIALIZER (ACTIVE ROBOTIC PROTOTYPES)
  // ============================================================
  initPrototypes() {
    this.initProtoRoboBot();
    this.initProtoRoboSoccer();
    this.initProtoAIAssistant();
    this.initProtoVortex();
    this.initProtoSkyGuardian();
    this.initProtoCyberArm();
  }

  // 1. Tactical Robo-Bot (Tracked Ground Rover)
  initProtoRoboBot() {
    const canvas = document.getElementById("canvas-proto-robobot");
    if (!canvas) return;

    const scene = this.makeScene(0x0a0a12);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3.2, 6.5);
    camera.lookAt(0, 0.6, 0);

    const grid = new THREE.GridHelper(12, 16, 0x334455, 0x223344);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const group = new THREE.Group();
    scene.add(group);

    // Rover chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.2), mats.body);
    body.position.y = 0.5;
    group.add(body);

    // Sloped Front Glacis
    const glacis = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.2, 1.8, 3), mats.titanium);
    glacis.rotateZ(Math.PI / 2);
    glacis.position.set(0, 0.45, 1.1);
    group.add(glacis);

    // Dual Tracks / Treads
    [-1.15, 1.15].forEach(x => {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 2.5), mats.dark);
      tread.position.set(x, 0.38, 0);
      group.add(tread);
      // Wheels inside tracks
      for (let z = -0.9; z <= 0.9; z += 0.6) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 14), mats.titanium);
        wh.rotateZ(Math.PI / 2);
        wh.position.set(x, 0.38, z);
        group.add(wh);
      }
    });

    // 360 LiDAR Turret Dome
    const lidarDome = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.3, 18), mats.joint);
    lidarDome.position.set(0, 0.9, 0.2);
    group.add(lidarDome);

    const lidarSpin = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 14), mats.titanium);
    lidarSpin.position.set(0, 1.1, 0.2);
    group.add(lidarSpin);

    this.bindModeButtons("data-proto-robobot-mode", group, mats);
    this.addDragControls(canvas, group, camera, [0, 0.6, 0]);

    let isRotating = true, rotSpeed = 0.006;
    this.bindSpinSpeed("proto-robobot-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const spdEl = document.getElementById("p-rb-spd");
    const incEl = document.getElementById("p-rb-inc");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      if (isRotating) group.rotation.y += rotSpeed;
      lidarSpin.rotation.y += 0.25;
      const t = Date.now() * 0.001;
      if (Math.random() < 0.04) {
        if (spdEl) spdEl.textContent = (4.1 + Math.sin(t * 0.7) * 0.3).toFixed(1) + " m/s";
        if (incEl) incEl.textContent = (44.8 + Math.cos(t * 0.5) * 0.6).toFixed(1) + "°";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // 2. Robo-Soccer Striker (3-Omni Drive)
  initProtoRoboSoccer() {
    const canvas = document.getElementById("canvas-proto-robosoccer");
    if (!canvas) return;

    const scene = this.makeScene(0x0a0c10);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3.2, 6.0);
    camera.lookAt(0, 0.7, 0);

    const grid = new THREE.GridHelper(12, 16, 0x225544, 0x113322);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const group = new THREE.Group();
    scene.add(group);

    // Cylindrical soccer chassis
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.8, 24), mats.body);
    body.position.y = 0.55;
    group.add(body);

    // Top Cover Plate
    const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 24), mats.titanium);
    topPlate.position.y = 0.98;
    group.add(topPlate);

    // Solenoid Kicker Mouth Cutout
    const kicker = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.4), mats.dark);
    kicker.position.set(0, 0.35, 1.05);
    group.add(kicker);

    // Dribbler Roller
    const dribbler = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.75, 16), mats.joint);
    dribbler.rotateZ(Math.PI / 2);
    dribbler.position.set(0, 0.42, 1.18);
    group.add(dribbler);

    // 3 Omni Wheels at 120° angles
    const wheels = [];
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const whGrp = new THREE.Group();
      whGrp.rotation.y = ang;
      group.add(whGrp);

      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), mats.dark);
      wh.rotateZ(Math.PI / 2);
      wh.position.set(1.15, 0.32, 0);
      whGrp.add(wh);
      wheels.push(wh);
    }

    this.bindModeButtons("data-proto-robosoccer-mode", group, mats);
    this.addDragControls(canvas, group, camera, [0, 0.7, 0]);

    let isRotating = true, rotSpeed = 0.005;
    this.bindSpinSpeed("proto-robosoccer-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const spdEl = document.getElementById("p-sc-spd");
    const kckEl = document.getElementById("p-sc-kck");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      if (isRotating) group.rotation.y += rotSpeed;
      dribbler.rotation.x += 0.4;
      wheels.forEach(w => w.rotation.x += 0.08);
      const t = Date.now() * 0.001;
      if (Math.random() < 0.04) {
        if (spdEl) spdEl.textContent = (4.7 + Math.sin(t * 0.8) * 0.3).toFixed(1) + " m/s";
        if (kckEl) kckEl.textContent = (248 + Math.floor(Math.sin(t * 1.5) * 4)).toFixed(1) + " V";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // 3. AI Personal Assistant (Mag-Lev Floating Hologram Companion)
  initProtoAIAssistant() {
    const canvas = document.getElementById("canvas-proto-aiassistant");
    if (!canvas) return;

    const scene = this.makeScene(0x0c0a14);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3.0, 6.2);
    camera.lookAt(0, 1.2, 0);

    const grid = new THREE.GridHelper(12, 16, 0x553366, 0x332244);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const group = new THREE.Group();
    scene.add(group);

    // Mag-Lev Docking Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.28, 24), mats.dark);
    base.position.y = 0.14;
    group.add(base);

    // Floating Core Group
    const coreGrp = new THREE.Group();
    coreGrp.position.y = 1.3;
    group.add(coreGrp);

    // Glowing Visage Sphere
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), mats.body);
    coreGrp.add(sphere);

    // Holographic Visor Visage
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.65), mats.dark);
    visor.position.set(0, 0.1, 0.45);
    coreGrp.add(visor);

    // Gyroscopic Ring 1
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.04, 12, 32), mats.titanium);
    coreGrp.add(ring1);

    // Gyroscopic Ring 2
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.035, 12, 32), mats.joint);
    ring2.rotateX(Math.PI / 3);
    coreGrp.add(ring2);

    this.bindModeButtons("data-proto-ai-mode", group, mats);
    this.addDragControls(canvas, group, camera, [0, 1.2, 0]);

    let isRotating = true, rotSpeed = 0.005;
    this.bindSpinSpeed("proto-ai-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const infEl = document.getElementById("p-ai-inf");
    const latEl = document.getElementById("p-ai-lat");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      const t = Date.now() * 0.002;
      if (isRotating) group.rotation.y += rotSpeed;
      coreGrp.position.y = 1.3 + Math.sin(t * 1.5) * 0.1;
      ring1.rotation.x += 0.02;
      ring1.rotation.y += 0.015;
      ring2.rotation.y -= 0.025;
      ring2.rotation.z += 0.01;
      if (Math.random() < 0.04) {
        if (infEl) infEl.textContent = (47.5 + Math.sin(t) * 1.5).toFixed(1) + " tok/s";
        if (latEl) latEl.textContent = "< " + Math.floor(135 + Math.sin(t * 0.5) * 8) + " ms";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // 4. Project Vortex (Combat Spinner Prototype)
  initProtoVortex() {
    const canvas = document.getElementById("canvas-proto-vortex");
    if (!canvas) return;

    const scene = this.makeScene(0x0a0a10);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3.5, 7.0);
    camera.lookAt(0, 0.8, 0);

    const grid = new THREE.GridHelper(12, 16, 0x553333, 0x331111);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const group = new THREE.Group();
    scene.add(group);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 2.0), mats.body);
    chassis.position.y = 0.5;
    group.add(chassis);

    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.3, 2.0, 3), mats.titanium);
    wedge.rotateZ(Math.PI / 2);
    wedge.position.set(0, 0.45, 1.15);
    group.add(wedge);

    const drumGrp = new THREE.Group();
    drumGrp.position.set(0, 0.6, 1.35);
    group.add(drumGrp);

    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.65, 22), mats.dark);
    drum.rotateZ(Math.PI / 2);
    drumGrp.add(drum);

    for (let t = 0; t < 5; t++) {
      const ang = (t / 5) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.12), mats.titanium);
      tooth.position.set(Math.cos(ang) * 0.38, Math.sin(ang) * 0.38, t % 2 === 0 ? 0.5 : -0.5);
      drumGrp.add(tooth);
    }

    [[-1.2, 0.35, 0.65],[1.2, 0.35, 0.65],[-1.2, 0.35, -0.65],[1.2, 0.35, -0.65]].forEach(pos => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 18), mats.dark);
      wh.rotateZ(Math.PI / 2);
      wh.position.set(...pos);
      group.add(wh);
    });

    this.bindModeButtons("data-proto-vortex-mode", group, mats);
    this.addDragControls(canvas, group, camera, [0, 0.8, 0]);

    let isRotating = true, rotSpeed = 0.006;
    this.bindSpinSpeed("proto-vortex-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const rpmEl = document.getElementById("p-vx-rpm");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      if (isRotating) group.rotation.y += rotSpeed;
      drumGrp.rotation.x += 0.35;
      if (Math.random() < 0.04) {
        if (rpmEl) rpmEl.textContent = (10000 + Math.floor(Math.random() * 200)).toLocaleString() + " RPM";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // 5. Project SkyGuardian (UAV Hexacopter Prototype)
  initProtoSkyGuardian() {
    const canvas = document.getElementById("canvas-proto-skyguardian");
    if (!canvas) return;

    const scene = this.makeScene(0x080812);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 4.5, 8.5);
    camera.lookAt(0, 1.5, 0);

    const grid = new THREE.GridHelper(12, 16, 0x224455, 0x112233);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const droneGrp = new THREE.Group();
    droneGrp.position.y = 1.6;
    scene.add(droneGrp);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 6), mats.dark);
    droneGrp.add(hub);

    const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.titanium);
    topDome.position.y = 0.18;
    droneGrp.add(topDome);

    const rotorBlades = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const armGrp = new THREE.Group();
      armGrp.rotation.y = ang;
      droneGrp.add(armGrp);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8), mats.body);
      arm.rotateZ(Math.PI / 2);
      arm.position.x = 0.8;
      armGrp.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14), mats.titanium);
      motor.position.set(1.6, 0.07, 0);
      armGrp.add(motor);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.07), mats.body);
      blade.position.set(1.6, 0.15, 0);
      armGrp.add(blade);
      rotorBlades.push(blade);
    }

    [-0.48, 0.48].forEach(x => {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 1.4), mats.body);
      skid.position.set(x, -0.4, 0);
      droneGrp.add(skid);
    });

    this.bindModeButtons("data-proto-drone-mode", droneGrp, mats);
    this.addDragControls(canvas, droneGrp, camera, [0, 1.5, 0]);

    let isRotating = true, rotSpeed = 0.005;
    this.bindSpinSpeed("proto-drone-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const spdEl = document.getElementById("p-sg-spd");

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      const t = Date.now() * 0.002;
      if (isRotating) droneGrp.rotation.y += rotSpeed;
      droneGrp.position.y = 1.6 + Math.sin(t * 1.8) * 0.09;
      rotorBlades.forEach((b, i) => { b.rotation.y += (i % 2 === 0 ? 0.55 : -0.55); });
      if (Math.random() < 0.04) {
        if (spdEl) spdEl.textContent = (18.2 + Math.cos(t * 0.5) * 0.6).toFixed(1) + " m/s";
      }
      renderer.render(scene, camera);
    };
    animate();
  }

  // 6. Project CyberArm-6 (Manipulator Prototype)
  initProtoCyberArm() {
    const canvas = document.getElementById("canvas-proto-cyberarm");
    if (!canvas) return;

    const scene = this.makeScene(0x080810);
    const { renderer, w, h } = this.makeRenderer(canvas);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 4.2, 8.5);
    camera.lookAt(0, 2.0, 0);

    const grid = new THREE.GridHelper(12, 16, 0x444455, 0x222233);
    grid.position.y = -0.01;
    scene.add(grid);
    this.addLights(scene);

    const mats = this.makeMaterials();
    const armGrp = new THREE.Group();
    scene.add(armGrp);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.32, 24), mats.dark);
    base.position.y = 0.16;
    armGrp.add(base);

    const yawGrp = new THREE.Group();
    yawGrp.position.y = 0.32;
    armGrp.add(yawGrp);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.45, 20), mats.body);
    turret.position.y = 0.22;
    yawGrp.add(turret);

    const shoulderGrp = new THREE.Group();
    shoulderGrp.position.y = 0.44;
    yawGrp.add(shoulderGrp);

    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.7, 0.42), mats.body);
    lower.position.y = 0.98;
    shoulderGrp.add(lower);

    const elbowGrp = new THREE.Group();
    elbowGrp.position.y = 1.8;
    shoulderGrp.add(elbowGrp);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mats.titanium);
    elbowGrp.add(elbow);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.35, 0.32), mats.body);
    forearm.position.y = 0.72;
    elbowGrp.add(forearm);

    const wristGrp = new THREE.Group();
    wristGrp.position.y = 1.4;
    elbowGrp.add(wristGrp);

    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), mats.titanium);
    wristGrp.add(wrist);

    const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.11), mats.joint);
    clawL.position.set(-0.16, 0.26, 0);
    wristGrp.add(clawL);

    const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.11), mats.joint);
    clawR.position.set(0.16, 0.26, 0);
    wristGrp.add(clawR);

    this.bindModeButtons("data-proto-arm-mode", armGrp, mats);
    this.addDragControls(canvas, armGrp, camera, [0, 2.0, 0]);

    let isRotating = true, rotSpeed = 0.004;
    this.bindSpinSpeed("proto-arm-spin-btn", null,
      () => isRotating, v => { isRotating = v; },
      () => rotSpeed, v => { rotSpeed = v; });

    window.addEventListener("resize", () => {
      const c = canvas.parentElement;
      if (!c) return;
      camera.aspect = c.clientWidth / c.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(c.clientWidth, c.clientHeight);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      if (!this.isCanvasVisible(canvas)) return;
      const t = Date.now() * 0.0015;
      if (isRotating) armGrp.rotation.y += rotSpeed;
      yawGrp.rotation.y      = Math.sin(t * 0.7) * 0.45;
      shoulderGrp.rotation.z = Math.sin(t * 1.0) * 0.28 + 0.08;
      elbowGrp.rotation.z    = Math.cos(t * 1.2) * 0.38 - 0.15;
      wristGrp.rotation.x    = Math.sin(t * 2.0) * 0.42;
      const pinch = (Math.sin(t * 3.0) + 1) * 0.09;
      clawL.position.x = -0.16 + pinch;
      clawR.position.x =  0.16 - pinch;
      renderer.render(scene, camera);
    };
    animate();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    window.clebschRobotLab = new ClebschRobotLab();
  });
} else {
  window.clebschRobotLab = new ClebschRobotLab();
}
