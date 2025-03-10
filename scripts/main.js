import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LightingPatterns } from './patterns.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const clock = new THREE.Clock();
let mixer;
let smokeParticles = [];
let lights = [];
let videoScreen;
let lasers = [];
let lightingPatterns = [];
let currentPattern = 0;
let lastPatternChange = 0;
const PATTERN_DURATION = 15; // seconds between pattern changes

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('club-scene'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    
    // Add VR button
    document.getElementById('vr-button').appendChild(VRButton.createButton(renderer));
    
    // Add controls for non-VR viewing
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Make renderer look better
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.physicallyCorrectLights = true;
    
    // Basic club setup
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xff0000, 1);
    spotLight.position.set(0, 10, 0);
    scene.add(spotLight);
    
    camera.position.set(0, 1.6, 5);
    
    // Keyboard movement setup
    setupKeyboardControls();
    
    // Create the club environment
    await createClubEnvironment();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start animation loop
    renderer.setAnimationLoop(animate);
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = true;
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = false;
                break;
        }
    });
}

async function createClubEnvironment() {
    // Create concrete materials for club surfaces
    const concreteTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(4, 4);
    
    const concreteNormal = new THREE.TextureLoader().load('https://threejs.org/examples/textures/brick_bump.jpg');
    concreteNormal.wrapS = THREE.RepeatWrapping;
    concreteNormal.wrapT = THREE.RepeatWrapping;
    concreteNormal.repeat.set(4, 4);
    
    const concreteMaterial = new THREE.MeshStandardMaterial({ 
        map: concreteTexture, 
        normalMap: concreteNormal,
        roughness: 0.9,
        color: 0x999999
    });
    
    // Create darker floor material
    const floorTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        color: 0x333333,
        roughness: 0.8
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(20, 10, 0.2),
        concreteMaterial
    );
    backWall.position.set(0, 5, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);
    
    // Add minimal club logo/name to back wall
    const logoGeometry = new THREE.PlaneGeometry(6, 1.5);
    const logoMaterial = new THREE.MeshBasicMaterial({
        color: 0x3333ff,
        transparent: true,
        opacity: 0.8
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 8, -9.9);
    scene.add(logo);
    
    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 10, 20),
        concreteMaterial
    );
    leftWall.position.set(-10, 5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 10, 20),
        concreteMaterial
    );
    rightWall.position.set(10, 5, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    
    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.2, 20),
        concreteMaterial
    );
    ceiling.position.set(0, 10, 0);
    scene.add(ceiling);
    
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create DJ booth
    createDJBooth();
    
    // Create bar
    createBar();
    
    // Create club lighting
    createClubLighting();
    
    // Create smoke effects
    createSmokeEffects();

    // Create lasers
    createLasers();

    // Create smoke emitters
    createSmokeEmitters();
}

function createDJBooth() {
    // DJ Booth platform - more industrial style
    const boothGeometry = new THREE.BoxGeometry(6, 0.6, 3);
    const metalTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/metal.jpg');
    const boothMaterial = new THREE.MeshStandardMaterial({ 
        map: metalTexture,
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
    });
    const booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(0, 0.3, -8);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);
    
    // DJ Equipment 
    const consoleGeometry = new THREE.BoxGeometry(4, 0.8, 1.5);
    const consoleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.2
    });
    const console = new THREE.Mesh(consoleGeometry, consoleMaterial);
    console.position.set(0, 0.9, -8);
    console.castShadow = true;
    console.receiveShadow = true;
    scene.add(console);
    
    // CDJ/Mixer details
    const cdj1 = createCDJ(-1, 1.3, -7.5);
    const cdj2 = createCDJ(1, 1.3, -7.5);
    const mixer = createMixer(0, 1.3, -8);
    
    scene.add(cdj1);
    scene.add(cdj2);
    scene.add(mixer);
}

function createCDJ(x, y, z) {
    const cdjGroup = new THREE.Group();
    
    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
    );
    
    // Jog wheel
    const jogWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.05, 20),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    jogWheel.rotation.x = Math.PI / 2;
    jogWheel.position.y = 0.05;
    
    cdjGroup.add(body);
    cdjGroup.add(jogWheel);
    cdjGroup.position.set(x, y, z);
    
    return cdjGroup;
}

function createMixer(x, y, z) {
    const mixerGroup = new THREE.Group();
    
    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
    );
    
    // Faders
    for (let i = 0; i < 4; i++) {
        const fader = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.02, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x999999 })
        );
        fader.position.set(0.1 + i * 0.2, 0.06, 0);
        mixerGroup.add(fader);
    }
    
    mixerGroup.add(body);
    mixerGroup.position.set(x, y, z);
    
    return mixerGroup;
}

function createBar() {
    // Bar counter
    const barGeometry = new THREE.BoxGeometry(8, 1.1, 1.5);
    const barMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        metalness: 0.3, 
        roughness: 0.8 
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(-5, 0.55, 7);
    bar.castShadow = true;
    bar.receiveShadow = true;
    scene.add(bar);
    
    // Bar top
    const barTopGeometry = new THREE.BoxGeometry(8.2, 0.1, 1.7);
    const barTopMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        metalness: 0.8, 
        roughness: 0.2 
    });
    const barTop = new THREE.Mesh(barTopGeometry, barTopMaterial);
    barTop.position.set(-5, 1.15, 7);
    scene.add(barTop);
    
    // Back counter
    const backCounterGeometry = new THREE.BoxGeometry(8, 2, 0.6);
    const backCounterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        metalness: 0.3, 
        roughness: 0.8 
    });
    const backCounter = new THREE.Mesh(backCounterGeometry, backCounterMaterial);
    backCounter.position.set(-5, 1, 8.5);
    scene.add(backCounter);
    
    // Create bottles
    for (let i = 0; i < 10; i++) {
        const bottle = createBottle();
        bottle.position.set(-8.5 + i * 0.7, 2.1, 8.5);
        scene.add(bottle);
    }
    
    // Create spotlights for the bar
    const barLight1 = new THREE.SpotLight(0x3366ff, 1);
    barLight1.position.set(-7, 5, 7);
    barLight1.angle = Math.PI / 8;
    barLight1.penumbra = 0.2;
    barLight1.castShadow = true;
    barLight1.target.position.set(-7, 0, 7);
    scene.add(barLight1);
    scene.add(barLight1.target);
    
    const barLight2 = new THREE.SpotLight(0x3366ff, 1);
    barLight2.position.set(-3, 5, 7);
    barLight2.angle = Math.PI / 8;
    barLight2.penumbra = 0.2;
    barLight2.castShadow = true;
    barLight2.target.position.set(-3, 0, 7);
    scene.add(barLight2);
    scene.add(barLight2.target);
}

function createBottle() {
    const bottleGroup = new THREE.Group();
    
    // Bottle body
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: Math.random() > 0.5 ? 0x555555 : 0x333355, 
        transparent: true, 
        opacity: 0.8,
        metalness: 0 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Bottle neck
    const neckGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.2, 8);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.y = 0.4;
    
    bottleGroup.add(body);
    bottleGroup.add(neck);
    
    return bottleGroup;
}

function createClubLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);
    
    // Main spotlight
    const mainSpot = new THREE.SpotLight(0xffffff, 0.8);
    mainSpot.position.set(0, 9, -8);
    mainSpot.target.position.set(0, 0, -8);
    mainSpot.angle = Math.PI / 6;
    mainSpot.penumbra = 0.3;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);
    scene.add(mainSpot.target);
    
    // Colored moving spotlights
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00];
    for (let i = 0; i < 5; i++) {
        const spotLight = new THREE.SpotLight(colors[i], 2);
        spotLight.position.set(-7 + i * 3.5, 9, 0);
        spotLight.angle = Math.PI / 8;
        spotLight.penumbra = 0.2;
        spotLight.castShadow = true;
        
        // Create a spotlight helper for debugging
        // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        // scene.add(spotLightHelper);
        
        scene.add(spotLight);
        lights.push({
            light: spotLight,
            initialPos: new THREE.Vector3(-7 + i * 3.5, 9, 0),
            speed: 0.5 + Math.random() * 1.5,
            movementRadius: 2 + Math.random() * 3
        });
    }
    
    // Create a dance floor with grid of colored lights
    const danceFloorSize = 10;
    const gridSize = 10;
    const spacing = danceFloorSize / gridSize;
    
    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            if ((x + z) % 2 === 0) {
                const pointLight = new THREE.PointLight(
                    colors[Math.floor(Math.random() * colors.length)], 
                    0.3,
                    3
                );
                pointLight.position.set(
                    -danceFloorSize/2 + x * spacing + spacing/2,
                    0.1,
                    -danceFloorSize/2 + z * spacing + spacing/2
                );
                scene.add(pointLight);
                lights.push({
                    light: pointLight,
                    type: 'danceFloor',
                    initialIntensity: 0.3,
                    originalColor: pointLight.color.getHex()
                });
            }
        }
    }

    // Add visible light beams to spotlights
    lights.forEach(lightObj => {
        if (!lightObj.type) { // Only for moving spotlights
            const beamGeometry = new THREE.CylinderGeometry(0, 0.5, 8, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: lightObj.light.color,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.copy(lightObj.light.position);
            beam.rotation.x = Math.PI / 2;
            scene.add(beam);
            lightObj.beam = beam;
        }
    });
}

function createLasers() {
    const laserPositions = [
        { x: -9, y: 8, z: -9 },
        { x: 9, y: 8, z: -9 },
        { x: -9, y: 8, z: 9 },
        { x: 9, y: 8, z: 9 }
    ];

    laserPositions.forEach((pos, i) => {
        // Create physical laser device
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
        );
        base.position.set(pos.x, pos.y, pos.z);
        scene.add(base);

        // Create laser beam
        const laserGeometry = new THREE.BufferGeometry();
        const laserMaterial = new THREE.LineBasicMaterial({
            color: i % 2 === 0 ? 0xff0000 : 0x00ff00,
            linewidth: 1,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(laserGeometry, laserMaterial);
        scene.add(line);

        lasers.push({
            base: base,
            beam: line,
            color: laserMaterial.color,
            phase: i * Math.PI / 2
        });
    });
}

function createSmokeEmitters() {
    const emitterPositions = [
        { x: -9, y: 0.5, z: -8 },
        { x: 9, y: 0.5, z: -8 },
        { x: -9, y: 0.5, z: 8 },
        { x: 9, y: 0.5, z: 8 }
    ];

    emitterPositions.forEach(pos => {
        // Create physical smoke machine
        const machine = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.5, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
        );
        machine.position.set(pos.x, pos.y, pos.z);
        scene.add(machine);

        // Create nozzle
        const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.15, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        nozzle.rotation.x = -Math.PI / 4;
        nozzle.position.set(pos.x, pos.y + 0.2, pos.z);
        scene.add(nozzle);
    });
}

function createSmokeEffects() {
    // Initialize particle pool first
    initParticlePool();
    
    // Add fog to the scene
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
}

function animate() {
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Update pattern
    const currentPattern = Math.floor(time / PATTERN_DURATION) % LightingPatterns.patterns.length;
    LightingPatterns.patterns[currentPattern].update(time, lights);
    
    // Update mixer animations if any
    if (mixer) mixer.update(delta);
    
    // Update movement based on keyboard controls
    updateMovement(delta);
    
    // Update lighting effects
    updateLightingEffects(delta);
    
    // Update smoke particles
    updateSmokeEffects(delta);
    
    // Update controls and render scene
    controls.update();
    renderer.render(scene, camera);
}

function updateMovement(delta) {
    // Calculate movement direction vector
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    // Apply movement to velocity with acceleration
    if (moveForward || moveBackward) velocity.z -= direction.z * 0.04;
    if (moveLeft || moveRight) velocity.x -= direction.x * 0.04;
    
    // Apply friction/damping
    velocity.x *= 0.9;
    velocity.z *= 0.9;
    
    // Move the camera
    camera.position.x += velocity.x;
    camera.position.z += velocity.z;
    
    // Simple collision detection with walls
    if (camera.position.x > 9.5) camera.position.x = 9.5;
    if (camera.position.x < -9.5) camera.position.x = -9.5;
    if (camera.position.z < -9.5) camera.position.z = -9.5;
    if (camera.position.z > 9.5) camera.position.z = 9.5;
}

function updateLightingEffects(delta) {
    const time = clock.getElapsedTime();
    
    // Check if it's time to change patterns
    if (time - lastPatternChange > PATTERN_DURATION) {
        currentPattern = (currentPattern + 1) % lightingPatterns.length;
        lastPatternChange = time;
    }

    // Update lights based on current pattern
    switch (currentPattern) {
        case 0: // Synchronized wave
            updateSynchronizedWave(time);
            break;
        case 1: // Random strobe
            updateRandomStrobe(time);
            break;
        case 2: // Circular chase
            updateCircularChase(time);
            break;
    }

    // Update laser beams
    updateLaserBeams(time);
}

function updateSmokeEffects(delta) {
    const time = clock.getElapsedTime();
    
    // Update existing particles
    smokeParticles.forEach((particle, index) => {
        if (!particle.visible) return;
        
        particle.userData.life += delta;
        
        if (particle.userData.life > particle.userData.maxLife) {
            resetParticle(particle);
            return;
        }
        
        // Optimized particle movement
        const t = particle.userData.life / particle.userData.maxLife;
        particle.position.addScaledVector(particle.userData.velocity, delta * 60);
        particle.material.opacity = (1 - t) * 0.4;
        particle.scale.addScalar(delta * 0.5);
        
        // Add turbulence
        particle.userData.velocity.x += (Math.random() - 0.5) * 0.002;
        particle.userData.velocity.z += (Math.random() - 0.5) * 0.002;
        particle.userData.velocity.y += 0.001; // Gradual rise
    });
    
    // Emit new particles
    emitNewParticles(time);
}

function emitNewParticles(time) {
    const emitterPositions = [
        { x: -9, y: 0.7, z: -8 },
        { x: 9, y: 0.7, z: -8 },
        { x: -9, y: 0.7, z: 8 },
        { x: 9, y: 0.7, z: 8 }
    ];
    
    // Emit from each smoke machine
    emitterPositions.forEach(pos => {
        if (Math.random() > 0.7) { // Control emission rate
            const particle = getParticle();
            if (particle) {
                resetParticle(particle, pos);
            }
        }
    });
}

function resetParticle(particle, position = null) {
    if (position) {
        // New particle from emitter
        particle.position.set(
            position.x + (Math.random() - 0.5) * 0.2,
            position.y,
            position.z + (Math.random() - 0.5) * 0.2
        );
        particle.scale.set(0.5, 0.5, 1);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            0.02 + Math.random() * 0.02,
            (Math.random() - 0.5) * 0.01
        );
    } else {
        // Reset expired particle
        particle.visible = false;
        particlePool.add(particle);
    }
    
    particle.userData.life = 0;
    particle.userData.maxLife = 3 + Math.random() * 2;
    particle.material.opacity = 0.4;
}

function updateLaserBeams(time) {
    lasers.forEach((laser, i) => {
        const points = [];
        const startPoint = laser.base.position.clone();
        
        // Create dynamic curve for laser beam
        for (let t = 0; t < 1; t += 0.1) {
            const x = startPoint.x + Math.sin(time * 2 + laser.phase + t * Math.PI) * 3;
            const y = startPoint.y - t * 8;
            const z = startPoint.z + Math.cos(time * 2 + laser.phase + t * Math.PI) * 3;
            points.push(new THREE.Vector3(x, y, z));
        }

        laser.beam.geometry.setFromPoints(points);
        laser.beam.geometry.verticesNeedUpdate = true;
    });
}

// Add these new pattern functions
function updateSynchronizedWave(time) {
    const wavePos = Math.sin(time) * 5;
    lights.forEach((lightObj, i) => {
        if (!lightObj.type) {
            lightObj.light.target.position.x = wavePos;
            lightObj.beam.position.copy(lightObj.light.position);
            lightObj.beam.lookAt(lightObj.light.target.position);
        }
    });
}

function updateRandomStrobe(time) {
    if (Math.random() > 0.9) {
        lights.forEach(lightObj => {
            if (!lightObj.type) {
                lightObj.light.intensity = Math.random() * 3;
                lightObj.beam.material.opacity = lightObj.light.intensity * 0.1;
            }
        });
    }
}

function updateCircularChase(time) {
    lights.forEach((lightObj, i) => {
        if (!lightObj.type) {
            const angle = time * 2 + (i * Math.PI / 2);
            const x = Math.sin(angle) * 5;
            const z = Math.cos(angle) * 5;
            lightObj.light.target.position.set(x, 0, z);
            lightObj.beam.position.copy(lightObj.light.position);
            lightObj.beam.lookAt(lightObj.light.target.position);
        }
    });
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function setupEventListeners() {
    // Cleanup event listeners on page unload
    window.addEventListener('unload', cleanup);
    
    // Optimize resize handler
    const resizeObserver = new ResizeObserver(debounce(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250));
    
    resizeObserver.observe(document.body);
}

function cleanup() {
    // Dispose of geometries
    scene.traverse(object => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    // Dispose of render target
    renderer.dispose();
    
    // Clear arrays
    lights.length = 0;
    smokeParticles.length = 0;
    lasers.length = 0;
}

// Optimize smoke particle updates using Object Pool
const particlePool = new Set();
const PARTICLE_POOL_SIZE = 100;

function initParticlePool() {
    const smokeTexture = new THREE.TextureLoader().load('smoke.png');
    const smokeMaterial = new THREE.SpriteMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 0.4
    });
    
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const particle = new THREE.Sprite(smokeMaterial.clone());
        particle.visible = false;
        scene.add(particle);
        particlePool.add(particle);
    }
}

function getParticle() {
    for (const particle of particlePool) {
        if (!particle.visible) {
            particle.visible = true;
            return particle;
        }
    }
    return null;
}

// Utility function for resize debouncing
function debounce(fn, ms) {
    let timer;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, arguments);
        }, ms);
    };
}

init().catch(console.error);
