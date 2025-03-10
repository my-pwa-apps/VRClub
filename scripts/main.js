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

function init() {
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
    createClubEnvironment();
    
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

function createClubEnvironment() {
    // Add walls and ceiling
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(20, 10, 0.2),
        wallMaterial
    );
    backWall.position.set(0, 5, -10);
    scene.add(backWall);
    
    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 10, 20),
        wallMaterial
    );
    leftWall.position.set(-10, 5, 0);
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 10, 20),
        wallMaterial
    );
    rightWall.position.set(10, 5, 0);
    scene.add(rightWall);
    
    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.2, 20),
        wallMaterial
    );
    ceiling.position.set(0, 10, 0);
    scene.add(ceiling);
    
    // Improve the floor with texture
    const floorTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        color: 0x333333
    });
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create DJ booth
    createDJBooth();
    
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
    // DJ Booth platform
    const boothGeometry = new THREE.BoxGeometry(6, 0.5, 3);
    const boothMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(0, 0.25, -8);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);
    
    // DJ Equipment
    const consoleGeometry = new THREE.BoxGeometry(4, 0.8, 1.5);
    const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const console = new THREE.Mesh(consoleGeometry, consoleMaterial);
    console.position.set(0, 0.9, -8);
    console.castShadow = true;
    console.receiveShadow = true;
    scene.add(console);
    
    // Video wall behind DJ
    const videoGeometry = new THREE.PlaneGeometry(12, 8);
    const videoElement = document.createElement('video');
    videoElement.src = 'https://threejs.org/examples/textures/sintel.mp4'; // Replace with your video
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.play();
    
    const videoTexture = new THREE.VideoTexture(videoElement);
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    videoScreen = new THREE.Mesh(videoGeometry, videoMaterial);
    videoScreen.position.set(0, 5, -9.8);
    scene.add(videoScreen);
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

init();
