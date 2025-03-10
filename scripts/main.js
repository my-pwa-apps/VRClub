import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const clock = new THREE.Clock();
let mixer;
let smokeParticles = [];
let lights = [];
let videoScreen;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('club-scene'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    
    // Add VR button
    document.getElementById('vr-button').appendChild(VRButton.createButton(renderer));
    
    // Add controls for non-VR viewing
    controls = new OrbitControls(camera, renderer.domElement);
    
    // Make renderer look better
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    
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
}

function createSmokeEffects() {
    // Create smoke particles
    const smokeTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/smoke.png');
    const smokeMaterial = new THREE.SpriteMaterial({ 
        map: smokeTexture,
        transparent: true,
        opacity: 0.4,
        color: 0xaaaaaa
    });
    
    for (let i = 0; i < 50; i++) {
        const particle = new THREE.Sprite(smokeMaterial.clone());
        particle.position.set(
            (Math.random() - 0.5) * 18,
            Math.random() * 8,
            (Math.random() - 0.5) * 18
        );
        particle.scale.set(2 + Math.random() * 3, 2 + Math.random() * 3, 1);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ),
            rotation: Math.random() * 0.06 - 0.03,
            opacity: { 
                value: 0.3 + Math.random() * 0.3,
                delta: (Math.random() - 0.5) * 0.01
            }
        };
        scene.add(particle);
        smokeParticles.push(particle);
    }
    
    // Add fog to the scene
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
}

function animate() {
    const delta = clock.getDelta();
    
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
    
    // Update spotlights
    lights.forEach((lightObj, index) => {
        if (lightObj.type === 'danceFloor') {
            // Dance floor lights pulsing effect
            const pulseSpeed = time * 2 + index * 0.2;
            const intensity = 0.1 + Math.sin(pulseSpeed) * 0.2 + Math.cos(pulseSpeed * 0.7) * 0.1;
            lightObj.light.intensity = intensity;
            
            // Occasionally change color
            if (Math.random() > 0.995) {
                const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
                lightObj.light.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
            }
        } else {
            // Moving spotlights
            const angle = time * lightObj.speed;
            lightObj.light.position.x = lightObj.initialPos.x + Math.sin(angle) * lightObj.movementRadius;
            lightObj.light.position.z = lightObj.initialPos.z + Math.cos(angle) * lightObj.movementRadius;
            
            // Make the spotlights look at the dance floor center
            const target = lightObj.light.target;
            target.position.x = Math.sin(angle * 1.5) * 5;
            target.position.z = Math.cos(angle * 1.5) * 5;
            target.position.y = 0;
            target.updateMatrixWorld();
        }
    });
}

function updateSmokeEffects(delta) {
    smokeParticles.forEach(particle => {
        // Move particles
        particle.position.add(particle.userData.velocity);
        
        // Rotate particles
        particle.material.rotation += particle.userData.rotation;
        
        // Change opacity
        particle.material.opacity += particle.userData.opacity.delta;
        
        // Reverse opacity direction at bounds
        if (particle.material.opacity > 0.6 || particle.material.opacity < 0.2) {
            particle.userData.opacity.delta *= -1;
        }
        
        // Reset particles that move out of bounds
        if (Math.abs(particle.position.x) > 9 || 
            particle.position.y < 0 || 
            particle.position.y > 9 ||
            Math.abs(particle.position.z) > 9) {
            
            particle.position.set(
                (Math.random() - 0.5) * 15,
                Math.random() * 8,
                (Math.random() - 0.5) * 15
            );
            
            particle.userData.velocity.set(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.3) * 0.01,
                (Math.random() - 0.5) * 0.02
            );
        }
    });
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
