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

    // Set up XR features
    renderer.xr.enabled = true;
    
    // Add VR button
    document.getElementById('vr-button').appendChild(VRButton.createButton(renderer));
    
    // Initialize orbit controls for non-VR mode only
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Disable orbit controls when entering VR
    renderer.xr.addEventListener('sessionstart', function() {
        controls.enabled = false;
        console.log('VR session started - controls disabled');
    });
    
    // Re-enable orbit controls when exiting VR
    renderer.xr.addEventListener('sessionend', function() {
        controls.enabled = true;
        console.log('VR session ended - controls enabled');
    });

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
    
    // Add mirror ball to the center of the room
    createMirrorBall();
    
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

// Add mirror ball function
function createMirrorBall() {
    // Create a mirror ball geometry
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    
    // Create a highly reflective material for the mirror ball
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 1.0
    });
    
    // Create small mirror faces to simulate disco ball
    const facesGroup = new THREE.Group();
    const faceCount = 150; // Number of mirror faces
    
    for (let i = 0; i < faceCount; i++) {
        // Create a small reflective quad for each mirror face
        const faceGeometry = new THREE.PlaneGeometry(0.08, 0.08);
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 1.5
        });
        
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        
        // Position randomly on the sphere
        const phi = Math.acos(-1 + 2 * Math.random());
        const theta = 2 * Math.PI * Math.random();
        
        face.position.x = 0.5 * Math.sin(phi) * Math.cos(theta);
        face.position.y = 0.5 * Math.sin(phi) * Math.sin(theta);
        face.position.z = 0.5 * Math.cos(phi);
        
        // Orient face outward from the center
        face.lookAt(0, 0, 0);
        face.position.multiplyScalar(1.01); // Slightly outside the sphere
        
        facesGroup.add(face);
    }
    
    // Create the core ball
    const mirrorBall = new THREE.Mesh(ballGeometry, ballMaterial);
    mirrorBall.add(facesGroup);
    
    // Position the ball in the club center
    mirrorBall.position.set(0, 6, 0);
    
    // Add to scene with rotation info for animation
    mirrorBall.userData = {
        rotationSpeed: 0.05 // Controls the rotation speed
    };
    
    scene.add(mirrorBall);
    
    // Create subtle point light in the ball to enhance reflections
    const ballLight = new THREE.PointLight(0xffffff, 0.3);
    ballLight.position.copy(mirrorBall.position);
    scene.add(ballLight);
    
    // Create mirror ball projector light
    const projectorLight = new THREE.SpotLight(0xffffff, 1.5);
    projectorLight.position.set(0, 9.5, 0); // Just below ceiling
    projectorLight.target = mirrorBall;
    projectorLight.angle = Math.PI / 10;
    projectorLight.penumbra = 0.2;
    projectorLight.castShadow = false;
    scene.add(projectorLight);
    scene.add(projectorLight.target);
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
            // Use the same initial color for all fixtures
            const initialColor = 0xff0000; // Start with red
            
            // Create light fixture
            const fixture = createLightFixture(new THREE.Vector3(x, 9.7, z), initialColor);
            
            // Store the side information (left or right)
            fixture.isOnRightSide = x > 0;
            
            scene.add(fixture.group);
            lightArmatures.push(fixture);
        });
    });
}

// Enhance light fixture creation with more realistic beams
function createLightFixture(position, color) {
    const group = new THREE.Group();
    
    // Base mount
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    
    // Moving head
    const head = new THREE.Group();
    
    // Light housing
    const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    
    // Highly visible lens
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.05, 16),
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.2, 0);
    
    // Enhanced spotlight for better lighting
    const spotlight = new THREE.SpotLight(color, 8); // Higher intensity
    spotlight.position.set(0, -0.2, 0);
    spotlight.angle = Math.PI / 10; // Narrower angle for more defined beams
    spotlight.penumbra = 0.2;
    spotlight.decay = 1;
    spotlight.distance = 40; // Longer distance
    spotlight.castShadow = false;
    
    const target = new THREE.Object3D();
    target.position.set(0, -40, 0); // Point far down
    spotlight.target = target;
    
    // Create enhanced beam group
    const beamGroup = new THREE.Group();
    
    // Main visible beam with layered effect for realism
    const beamGeometry = new THREE.CylinderGeometry(0.03, 0.4, 1, 16, 1, true);
    
    // Outer beam - visible but transparent
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const mainBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    
    // Inner beam - brighter core
    const coreBeamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const coreBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.15, 1, 8, 1, true),
        coreBeamMaterial
    );
    
    // Add dust particles for volumetric effect
    const particles = createBeamDustParticles(color, 50); // More particles
    
    // Add all beam elements
    beamGroup.add(mainBeam);
    beamGroup.add(coreBeam);
    beamGroup.add(particles);
    
    // Assemble the fixture
    head.add(housing);
    head.add(lens);
    head.add(spotlight);
    head.add(target);
    head.add(beamGroup);
    head.position.y = -0.25;
    
    group.add(base);
    group.add(head);
    group.position.copy(position);
    
    return {
        group,
        head,
        spotlight,
        beamGroup,
        beams: [mainBeam, coreBeam],
        lens,
        color,
        target,
        position: position.clone(),
        particles
    };
}

// New function for creating realistic dust particles
function createBeamDustParticles(color, count = 30) {
    const particles = new THREE.Group();
    
    // Create individual particles
    for (let i = 0; i < count; i++) {
        // Randomize size for more realistic dust
        const size = 0.01 + Math.random() * 0.04;
        
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.1 + Math.random() * 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        
        // Position particles along entire beam path
        const radius = Math.random() * 0.2 * (0.3 + Math.random()); // Wider distribution
        const theta = Math.random() * Math.PI * 2;
        const y = -Math.random() * 20; // Distribute along full length
        
        particle.position.set(
            Math.sin(theta) * radius,
            y,
            Math.cos(theta) * radius
        );
        
        // Store movement data
        particle.userData = {
            speed: 0.01 + Math.random() * 0.04,
            radius: radius,
            theta: theta,
            thetaSpeed: (Math.random() - 0.5) * 0.02, // Rotation around beam
            yStart: y,
            yLimit: -0.5 // Rise until near origin
        };
        
        particles.add(particle);
    }
    
    return particles;
}

// Updated function to make lights move in opposite directions based on side
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
        
        // Determine movement direction based on which side the fixture is on
        // Right side fixtures move left, left side fixtures move right
        let rotationDirection = fixture.isOnRightSide ? -1 : 1;
        
        // Calculate rotation for this fixture - shared pattern by side
        const pattern = Math.sin(time * 0.3) * 1.2 * rotationDirection;
        
        // Apply vertical rotation (up/down)
        fixture.head.rotation.x = Math.sin(time * 0.2 + i * 0.1) * 0.6 - 0.3; // Tilt down slightly
        
        // Apply horizontal rotation (left/right) - this creates the crossing pattern
        fixture.head.rotation.z = pattern;
        
        // Update color of spotlight to the shared color
        if (fixture.spotlight) {
            fixture.spotlight.color.copy(sharedColor);
            fixture.spotlight.intensity = 7.0 + Math.sin(time * 2) * 1.0;
        }
        
        // Update color of lens to the shared color
        if (fixture.lens && fixture.lens.material) {
            fixture.lens.material.color.copy(sharedColor);
        }
        
        // Update beam to extend to floor based on current rotation
        if (fixture.beam && fixture.beam.material) {
            // Update beam color to match shared color
            fixture.beam.material.color.copy(sharedColor);
            fixture.beam.material.opacity = 0.25 + Math.sin(time * 2 + i) * 0.05;
            
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
        
        // Only update camera movement via keyboard when not in VR
        if (!renderer.xr.isPresenting) {
            updateMovement(delta);
        }
        
        // Always update light effects
        updateLightArmatures(time);
        
        // Rotate mirror ball
        updateMirrorBall(delta);
        
        // Only update orbit controls when not in VR and if they exist
        if (!renderer.xr.isPresenting && controls && typeof controls.update === 'function') {
            controls.update();
        }
        
        // Let Three.js handle rendering
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

// Add function to update mirror ball rotation
function updateMirrorBall(delta) {
    scene.traverse(object => {
        // Find the mirror ball by checking userData
        if (object.userData && object.userData.rotationSpeed !== undefined) {
            // Rotate slowly around Y axis
            object.rotation.y += object.userData.rotationSpeed * delta;
        }
    });
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

// Improved function to update light beams
function updateLightArmatures(time) {
    if (!lightArmatures || lightArmatures.length === 0) return;
    
    // Calculate shared color
    const hue = (Math.sin(time * 0.1) + 1) / 2;
    const sharedColor = new THREE.Color().setHSL(hue, 1.0, 0.5);
    
    // Create a raycaster for beam length calculation
    const raycaster = new THREE.Raycaster();
    
    // Collider objects - include floor, walls, ceiling
    const colliders = [];
    scene.traverse(object => {
        if (object.isMesh && !object.userData.isLight && 
            !object.userData.isBeam && !object.userData.isParticle) {
            colliders.push(object);
        }
    });
    
    // Update each light
    for (let i = 0; i < lightArmatures.length; i++) {
        const fixture = lightArmatures[i];
        if (!fixture || !fixture.head) continue;
        
        // Get rotation direction
        const rotationDirection = fixture.isOnRightSide ? -1 : 1;
        
        // Calculate the movement pattern - crossing pattern
        const pattern = Math.sin(time * 0.3) * 1.2 * rotationDirection;
        
        // Apply rotations
        fixture.head.rotation.x = Math.sin(time * 0.2 + i * 0.1) * 0.6 - 0.3;
        fixture.head.rotation.z = pattern;
        
        // Update colors
        if (fixture.spotlight) {
            fixture.spotlight.color.copy(sharedColor);
            fixture.spotlight.intensity = 8.0 + Math.sin(time * 2) * 2.0;
        }
        
        if (fixture.lens && fixture.lens.material) {
            fixture.lens.material.color.copy(sharedColor);
        }
        
        // Update the beam
        if (fixture.beamGroup && fixture.beams) {
            // Update beam colors
            fixture.beams.forEach(beam => {
                if (beam.material) {
                    beam.material.color.copy(sharedColor);
                }
            });
            
            // Get world position and direction
            const lightPos = new THREE.Vector3();
            fixture.head.getWorldPosition(lightPos);
            
            // Get beam direction from head rotation
            const direction = new THREE.Vector3(0, -1, 0);
            direction.applyQuaternion(fixture.head.getWorldQuaternion(new THREE.Quaternion()));
            direction.normalize();
            
            // Set up raycaster to find beam length
            raycaster.set(lightPos, direction);
            
            // Check intersection with all colliders
            const intersects = raycaster.intersectObjects(colliders);
            
            // If beam hits something
            if (intersects.length > 0) {
                const hitPoint = intersects[0].point;
                const distance = lightPos.distanceTo(hitPoint);
                
                // Scale beams to hit point
                fixture.beams.forEach(beam => {
                    beam.scale.y = distance;
                });
                
                // Adjust beam group to point at intersection
                if (fixture.beamGroup) {
                    // Save original rotation
                    const origRotation = fixture.head.rotation.clone();
                    
                    // Make beam look at hit point
                    fixture.beamGroup.lookAt(hitPoint);
                    
                    // Apply slight random wobble for realism
                    fixture.beamGroup.rotation.x += Math.sin(time * 5 + i) * 0.01;
                    fixture.beamGroup.rotation.z += Math.cos(time * 4 + i) * 0.01;
                }
                
                // Update particles within beam
                if (fixture.particles) {
                    updateBeamParticles(fixture.particles, time, distance);
                }
            }
        }
    }
}

// Improved particle update function
function updateBeamParticles(particles, time, beamLength) {
    particles.children.forEach(particle => {
        if (!particle.userData) return;
        
        // Move particles
        particle.position.y += particle.userData.speed;
        
        // Add spiral motion
        particle.userData.theta += particle.userData.thetaSpeed;
        const radius = particle.userData.radius * (1 + Math.sin(time * 2) * 0.1);
        particle.position.x = Math.sin(particle.userData.theta) * radius;
        particle.position.z = Math.cos(particle.userData.theta) * radius;
        
        // Reset particles beyond beam length
        if (particle.position.y < -beamLength || particle.position.y > 0.2) {
            particle.position.y = -Math.random() * beamLength * 0.9;
            
            // Randomize position within beam
            const newRadius = Math.random() * 0.3 * (particle.position.y / -beamLength + 0.1);
            const newTheta = Math.random() * Math.PI * 2;
            particle.position.x = Math.sin(newTheta) * newRadius;
            particle.position.z = Math.cos(newTheta) * newRadius;
            
            // Update userData
            particle.userData.radius = newRadius;
            particle.userData.theta = newTheta;
        }
    });
}

init().catch(console.error);
