import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const clock = new THREE.Clock();
let lightArmatures = [];

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('club-scene'),
        antialias: true,
        powerPreference: "high-performance"
    });
    
    // Optimize renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add VR button
    document.getElementById('vr-button').appendChild(VRButton.createButton(renderer));
    
    // Initialize orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;

    // Make ambient light much dimmer for a darker atmosphere
    const ambient = new THREE.AmbientLight(0x111111, 0.15); // Reduced intensity
    scene.add(ambient);
    
    // Reduce the hemisphere light intensity for darker environment
    const fillLight = new THREE.HemisphereLight(0x4444ff, 0x222211, 0.1); // Much less intensity
    scene.add(fillLight);

    // Check for WebGL compatibility
    if (!checkWebGLCompatibility()) {
        document.getElementById('error').textContent = 'Your browser may not fully support WebGL. Try a different browser.';
        document.getElementById('error').style.display = 'block';
    }
    
    // Configure renderer with safer settings
    renderer.outputEncoding = THREE.LinearEncoding; // Use simpler encoding
    renderer.toneMapping = THREE.NoToneMapping; // Disable tone mapping
    renderer.shadowMap.type = THREE.BasicShadowMap; // Use simpler shadow mapping

    try {
        await createClubEnvironment();
        setupEventListeners();
        renderer.setAnimationLoop(animate);
    } catch (error) {
        console.error('Club initialization failed:', error);
        document.getElementById('loading').textContent = 'Failed to load club environment';
    }

    // Add keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

async function createClubEnvironment() {
    // Create materials with reduced emissive properties for a darker club
    const materials = {
        floor: new THREE.MeshStandardMaterial({
            color: 0x222222, // Darker floor
            emissive: 0x050505, // Very slight glow
            metalness: 0.2,
            roughness: 0.8
        }),
        wall: new THREE.MeshStandardMaterial({
            color: 0x444444, // Darker walls
            emissive: 0x050505, // Very slight glow
            metalness: 0.0,
            roughness: 1.0
        })
    };

    // Create basic structure with improved materials
    createBasicStructure(materials);
    createDJBooth();
    createBar();
    
    // Add club logo
    createClubLogo();
    
    // Create lighting armatures with realistic beams
    try {
        createLightingArmatures();
        console.log(`Created ${lightArmatures.length} light armatures`);
    } catch (error) {
        console.error('Error creating lighting armatures:', error);
    }

    // Try to load textures with better error handling
    try {
        // Use a hard-coded texture URL that is known to work
        const textureLoader = new THREE.TextureLoader();
        const woodTexture = await textureLoader.loadAsync('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
        woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
        woodTexture.repeat.set(4, 4);
        materials.floor.map = woodTexture;
        materials.floor.needsUpdate = true;
        console.log('Texture loaded successfully');
    } catch (error) {
        console.warn('Could not load wood texture, using fallback:', error);
    }

    // Remove the directional fill light to make club darker
    // Let the armature lights provide the primary illumination
}

function createBasicStructure(materials) {
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        materials.floor
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Dance floor with emissive material for better visibility
    const danceFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            emissive: 0x111111, // Add slight glow
            metalness: 0.7,
            roughness: 0.2,
            envMapIntensity: 1.5
        })
    );
    danceFloor.rotation.x = -Math.PI / 2;
    danceFloor.position.y = 0.01;
    scene.add(danceFloor);

    // Walls
    const walls = [
        { size: [20, 10, 0.3], pos: [0, 5, -10] },
        { size: [0.3, 10, 20], pos: [-10, 5, 0] },
        { size: [0.3, 10, 20], pos: [10, 5, 0] }
    ];

    const wallGeometries = walls.map(w => new THREE.BoxGeometry(...w.size));
    walls.forEach((wall, i) => {
        const mesh = new THREE.Mesh(wallGeometries[i], materials.wall);
        mesh.position.set(...wall.pos);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });

    // Ceiling with slight glow
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.3, 20),
        new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            emissive: 0x111111 // Add slight glow
        })
    );
    ceiling.position.set(0, 10, 0);
    scene.add(ceiling);
    
    // Remove or significantly reduce point lights
    // Only keep minimal lighting for DJ booth visibility
    const pointLights = [
        { pos: [0, 2, -8], color: 0x333333, intensity: 0.3 } // Only keep DJ booth light at reduced intensity
    ];
    
    pointLights.forEach(light => {
        const pointLight = new THREE.PointLight(light.color, light.intensity);
        pointLight.position.set(...light.pos);
        scene.add(pointLight);
    });
}

// Completely rewritten light armature creation function
function createLightingArmatures() {
    console.log('Creating lighting armatures with realistic beams...');
    
    // Create truss material
    const trussMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
    });

    // Create truss geometry (shared)
    const trussGeometry = new THREE.BoxGeometry(0.2, 0.2, 20);
    
    // Create trusses
    [-7, -3.5, 0, 3.5, 7].forEach(x => {
        const truss = new THREE.Mesh(trussGeometry, trussMaterial);
        truss.position.set(x, 9.8, 0);
        scene.add(truss);
        
        // Add light fixtures with realistic beams
        [-8, -4, 0, 4, 8].forEach(z => {
            // Create light fixture
            const fixture = createLightFixture(new THREE.Vector3(x, 9.7, z), getRandomColor());
            scene.add(fixture.group);
            lightArmatures.push(fixture);
        });
    });
}

function getRandomColor() {
    // Create saturated colors for club lights
    const colors = [
        0xff0000, // red
        0x00ff00, // green
        0x0000ff, // blue
        0xff00ff, // magenta
        0xffff00, // yellow
        0x00ffff  // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Simplify the fixture creation to use simpler materials
function createLightFixture(position, color) {
    const group = new THREE.Group();
    
    // Create base with simpler material
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x222222 }) // Use Lambert instead of Standard
    );
    
    // Moving head
    const head = new THREE.Group();
    
    // Light housing with simpler material
    const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x333333 }) // Use Lambert instead of Standard
    );
    
    // Lens with simpler material
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.05, 16),
        new THREE.MeshBasicMaterial({ // Use Basic instead of Phong
            color: color,
            transparent: true,
            opacity: 0.9
        })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.2, 0);
    
    // Create simplified spotlight
    const spotlight = new THREE.SpotLight(color, 3);
    spotlight.position.set(0, -0.2, 0);
    spotlight.angle = Math.PI / 8;
    spotlight.penumbra = 0.3;
    spotlight.distance = 20;
    spotlight.castShadow = false; // Disable shadow casting for performance
    
    const target = new THREE.Object3D();
    // Calculate beam target position - adjust to floor level
    const floorY = 0; // Y position of the floor
    // Calculate distance to floor from light position
    const distanceToFloor = position.y - floorY;
    // Direct the target to a point on the floor
    target.position.set(0, -distanceToFloor, 0); 
    spotlight.target = target;
    
    // Create a longer beam that extends to the floor
    // Use a longer length to ensure it reaches the floor (position.y)
    const beamLength = distanceToFloor;
    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.5, beamLength, 8, 4, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    
    // Position beam to start at light and extend downward
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = -beamLength / 2; // Center the beam geometry
    
    // Assemble the fixture
    head.add(housing);
    head.add(lens);
    head.add(spotlight);
    head.add(target);
    head.add(beam);
    head.position.y = -0.25;
    
    group.add(base);
    group.add(head);
    group.position.copy(position);
    
    return {
        group,
        head,
        spotlight,
        beam,
        lens,
        color,
        target,
        position: position.clone(),
        beamLength
    };
}

// Updated function to adjust beam geometry based on head rotation
function updateLightArmatures(time) {
    if (!lightArmatures || lightArmatures.length === 0) {
        return;
    }
    
    const floorY = 0; // Y position of the floor
    
    // Calculate a single color for all lights based on time
    // This makes all lights change color together
    const hue = (Math.sin(time * 0.1) + 1) / 2;
    const sharedColor = new THREE.Color().setHSL(hue, 1.0, 0.5);
    
    for (let i = 0; i < lightArmatures.length; i++) {
        const fixture = lightArmatures[i];
        
        if (!fixture || !fixture.head) continue;
        
        // Calculate rotation for this fixture
        const speed = 0.15 + (i % 5) * 0.05;
        const phaseX = i * 0.5;
        const phaseZ = i * 0.7;
        
        // Apply rotation to the head
        fixture.head.rotation.x = Math.sin(time * speed + phaseX) * 0.8 - 0.2;
        fixture.head.rotation.z = Math.cos(time * speed * 0.7 + phaseZ) * 0.5;
        
        // Update color of spotlight and beam to the shared color
        if (fixture.spotlight) {
            fixture.spotlight.color.copy(sharedColor);
            // Increase spotlight intensity to compensate for darker environment
            fixture.spotlight.intensity = 7.0 + Math.sin(time * 2) * 1.0;
        }
        
        if (fixture.lens && fixture.lens.material) {
            fixture.lens.material.color.copy(sharedColor);
            if (fixture.lens.material.emissive) {
                fixture.lens.material.emissive.copy(sharedColor);
            }
        }
        
        // Update beam to extend to floor based on current rotation
        if (fixture.beam && fixture.position) {
            // Get the world position and direction of the spotlight
            const lightWorldPos = new THREE.Vector3();
            fixture.head.getWorldPosition(lightWorldPos);
            
            // Calculate direction vector based on head rotation
            const direction = new THREE.Vector3(0, -1, 0);
            direction.applyQuaternion(fixture.head.getWorldQuaternion(new THREE.Quaternion()));
            
            // Simple floor intersection calculation
            // Distance to floor = (lightWorldPos.y - floorY) / direction.y
            const distance = (lightWorldPos.y - floorY) / -direction.y;
            
            // Update beam length and scale to reach the floor
            if (distance > 0 && fixture.beam.geometry) {
                // Scale the beam to match the required length
                fixture.beam.scale.y = distance / fixture.beamLength;
                
                // Update opacity based on time
                if (fixture.beam.material) {
                    fixture.beam.material.opacity = 0.25 + Math.sin(time * 2 + i) * 0.05;
                }
            }
        }
    }
}

function createLightParticles(color) {
    // Create particles that float in the light beam
    const particleCount = 20;
    const particles = new THREE.Group();
    
    // Create individual particles
    for (let i = 0; i < particleCount; i++) {
        const size = 0.02 + Math.random() * 0.04;
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.3,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        
        // Position particles randomly within the beam
        const radius = Math.random() * 0.3;
        const theta = Math.random() * Math.PI * 2;
        const y = -Math.random() * 8 - 1; // Position along the beam length
        
        particle.position.set(
            Math.sin(theta) * radius,
            y,
            Math.cos(theta) * radius
        );
        
        particle.userData = {
            speed: 0.02 + Math.random() * 0.05,
            radius: radius,
            theta: theta,
            yStart: y
        };
        
        particles.add(particle);
    }
    
    return particles;
}

function createClubLogo() {
    // Create glowing club logo on the back wall
    const logoGroup = new THREE.Group();
    
    // Background panel with slight glow
    const panelGeometry = new THREE.PlaneGeometry(6, 1.5);
    const panelMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7
    });
    
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    
    // Create text using geometry
    const textGroup = new THREE.Group();
    
    // Use extruded text geometry for "CONCRETE"
    const letters = "CONCRETE";
    let offset = -2.5; // Starting position for the letters
    
    // Create individual letters for better control
    for (let i = 0; i < letters.length; i++) {
        // Create a simple letter representation using a box
        const letterGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.05);
        const letterMaterial = new THREE.MeshStandardMaterial({
            color: 0x3333ff,
            emissive: 0x3333ff,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.2
        });
        
        const letter = new THREE.Mesh(letterGeometry, letterMaterial);
        letter.position.x = offset + i * 0.6;
        
        textGroup.add(letter);
    }
    
    // Add a glow effect
    const glowGeometry = new THREE.PlaneGeometry(5, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x3333ff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -0.05;
    
    logoGroup.add(panel);
    logoGroup.add(textGroup);
    logoGroup.add(glow);
    
    // Position the logo on the back wall
    logoGroup.position.set(0, 8, -9.85);
    
    scene.add(logoGroup);
}

function createMovingLightArmature() {
    const group = new THREE.Group();
    
    // Base mount 
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.3),
        new THREE.MeshStandardMaterial({
            color: 0x333333, 
            metalness: 0.9,
            roughness: 0.2
        })
    );
    group.add(base);
    
    // Moving head
    const head = new THREE.Group();
    
    // Light housing
    const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    head.add(housing);
    
    // Create spotlight
    const spotlight = new THREE.SpotLight(0xffffff, 5);
    spotlight.position.set(0, -0.2, 0);
    spotlight.angle = Math.PI / 12;
    spotlight.penumbra = 0.3;
    spotlight.decay = 1;
    spotlight.distance = 15;
    head.add(spotlight);
    
    // Create lens with emissive material
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.1, 16),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9
        })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.2, 0);
    head.add(lens);
    
    // Create light beam
    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.2, 10, 16, 8, true),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        })
    );
    beam.position.y = -5;
    beam.rotation.x = Math.PI;
    head.add(beam);
    
    head.position.y = -0.3;
    group.add(head);
    
    return {
        group,
        head,
        lens,
        spotlight,
        beam,
        basePosition: new THREE.Vector3()
    };
}

function createLightMount() {
    const mount = new THREE.Group();
    
    // Create mounting bracket
    const bracketMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.2
    });
    
    const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.3),
        bracketMaterial
    );
    
    // Add mounting ring
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.02, 8, 16),
        bracketMaterial
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.1;
    
    mount.add(bracket);
    mount.add(ring);
    
    return mount;
}

function createDJBooth() {
    const booth = new THREE.Group();
    
    // Main platform with raised design
    const platformGeometry = new THREE.BoxGeometry(6, 0.6, 3);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.2
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0.3, -8);
    
    // Add raised back panel
    const backPanel = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 0.1),
        platformMaterial
    );
    backPanel.position.set(0, 1.3, -9.4);
    
    // Add equipment desk
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.1, 2),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.1
        })
    );
    desk.position.set(0, 0.9, -8);
    
    booth.add(platform);
    booth.add(backPanel);
    booth.add(desk);
    
    // Add CDJs and mixer
    const cdj1 = createCDJ(true); // true = use emissive materials
    const cdj2 = createCDJ(true);
    const mixer = createMixer(true);
    
    cdj1.position.set(-1.2, 0.95, -8);
    cdj2.position.set(1.2, 0.95, -8);
    mixer.position.set(0, 0.95, -8);
    
    booth.add(cdj1);
    booth.add(cdj2);
    booth.add(mixer);
    
    scene.add(booth);
    
    // Add extra light to illuminate the DJ booth with more intensity
    const boothLight = new THREE.SpotLight(0xffffff, 1.2); // Increased intensity
    boothLight.position.set(0, 5, -6);
    boothLight.target.position.set(0, 0, -8);
    boothLight.angle = Math.PI / 6;
    boothLight.penumbra = 0.3;
    scene.add(boothLight);
    scene.add(boothLight.target);
}

function createCDJ(useEmissive = false) {
    const cdjGroup = new THREE.Group();
    
    // Main body with optional emissive material
    const bodyMaterial = useEmissive ? 
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            emissive: 0x222222,
            metalness: 0.8 
        }) :
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.8 
        });
    
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.8),
        bodyMaterial
    );
    
    // Add display screen with glow - using MeshPhongMaterial instead of MeshBasicMaterial
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.3),
        new THREE.MeshPhongMaterial({
            color: 0x4444ff,
            emissive: 0x4444ff,
            emissiveIntensity: 0.5
        })
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.051;
    screen.position.z = -0.2;
    
    // Jog wheel
    const jogWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.05, 20),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    jogWheel.rotation.x = Math.PI / 2;
    jogWheel.position.y = 0.05;
    
    cdjGroup.add(body);
    cdjGroup.add(screen); // Add the glowing screen
    cdjGroup.add(jogWheel);
    
    return cdjGroup;
}

function createMixer(useEmissive = false) {
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
    
    return mixerGroup;
}

function createBar() {
    const bar = new THREE.Group();
    
    // Bar counter with nice wood texture
    const barTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
    barTexture.wrapS = barTexture.wrapT = THREE.RepeatWrapping;
    barTexture.repeat.set(4, 1);
    
    const barMaterial = new THREE.MeshStandardMaterial({
        map: barTexture,
        color: 0x553311,
        metalness: 0.3,
        roughness: 0.8
    });
    
    // Main counter
    const counter = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.1, 1.5),
        barMaterial
    );
    counter.position.set(-5, 0.55, 7);
    
    // Bar top with glossy finish
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.1
    });
    
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.05, 1.7),
        topMaterial
    );
    top.position.set(-5, 1.15, 7);
    
    // Back counter with shelves
    const backCounter = new THREE.Mesh(
        new THREE.BoxGeometry(8, 2.5, 0.4),
        barMaterial
    );
    backCounter.position.set(-5, 1.25, 8.2);
    
    // Add shelves
    const shelfMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.2
    });
    
    [0.5, 1.2, 1.9].forEach(y => {
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(7.8, 0.05, 0.3),
            shelfMaterial
        );
        shelf.position.set(-5, y, 8);
        bar.add(shelf);
    });
    
    bar.add(counter);
    bar.add(top);
    bar.add(backCounter);
    
    scene.add(bar);
}

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

// Check WebGL compatibility
function checkWebGLCompatibility() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('WebGL not supported');
            return false;
        }
        
        // Log WebGL capabilities for debugging
        console.log('WebGL Vendor:', gl.getParameter(gl.VENDOR));
        console.log('WebGL Renderer:', gl.getParameter(gl.RENDERER));
        console.log('WebGL Version:', gl.getParameter(gl.VERSION));
        
        return true;
    } catch (e) {
        console.error('WebGL check error:', e);
        return false;
    }
}

function animate() {
    try {
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        
        updateMovement(delta);
        updateLightArmatures(time); // This now calls the correct function
        
        if (controls && typeof controls.update === 'function') {
            controls.update();
        }
        
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Animation error:', error);
        // Don't repeatedly show errors
        if (renderer && renderer.setAnimationLoop) {
            renderer.setAnimationLoop(null);
            document.getElementById('error').textContent = 'Rendering error. Please refresh the page.';
            document.getElementById('error').style.display = 'block';
        }
    }
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

init().catch(console.error);
