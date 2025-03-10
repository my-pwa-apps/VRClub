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

    // Basic lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

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
    // Create basic materials first (fallbacks)
    const materials = {
        floor: new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.2,
            roughness: 0.8
        }),
        wall: new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.0,
            roughness: 1.0
        })
    };

    // Create basic structure with fallback materials
    createBasicStructure(materials);
    createDJBooth();
    createBar();
    
    // Create lighting armatures - this should run without errors
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

    // Dance floor with distinct material
    const danceFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333,
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

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.3, 20),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    ceiling.position.set(0, 10, 0);
    scene.add(ceiling);
}

// Completely rewritten light armature creation function
function createLightingArmatures() {
    console.log('Creating lighting armatures...');
    
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
        
        // Add simple lights instead of complex ones
        [-8, -4, 0, 4, 8].forEach(z => {
            // Create a simple group
            const group = new THREE.Group();
            group.position.set(x, 9.7, z);
            
            // Create a visible base
            const baseMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.3),
                new THREE.MeshStandardMaterial({
                    color: 0x222222,
                    metalness: 0.9,
                    roughness: 0.2
                })
            );
            group.add(baseMesh);
            
            // Create visible light housing
            const head = new THREE.Group();
            const headMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.4, 0.2),
                new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.2
                })
            );
            head.add(headMesh);
            head.position.y = -0.3;
            group.add(head);
            
            scene.add(group);
            
            // Store minimal data
            lightArmatures.push({
                group,
                head,
                houseMesh: headMesh
            });
        });
    });
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
    const cdj1 = createCDJ();
    const cdj2 = createCDJ();
    const mixer = createMixer();
    
    cdj1.position.set(-1.2, 0.95, -8);
    cdj2.position.set(1.2, 0.95, -8);
    mixer.position.set(0, 0.95, -8);
    
    booth.add(cdj1);
    booth.add(cdj2);
    booth.add(mixer);
    
    scene.add(booth);
}

function createCDJ() {
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
    
    return cdjGroup;
}

function createMixer() {
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

function animate() {
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Remove logging to reduce console spam
    // console.log('Camera position:', camera.position);
    
    updateMovement(delta);
    try {
        updateLightArmatures(time);
    } catch (error) {
        console.error('Error in light animation:', error);
    }
    // Update controls if defined
    if (controls && typeof controls.update === 'function') {
        controls.update();
    }
    
    try {
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Render error:', error);
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

// Completely rewritten and simplified update function
function updateLightArmatures(time) {
    // Safely exit if no armatures
    if (!lightArmatures || lightArmatures.length === 0) {
        return;
    }
    
    // Simple movement only
    const angle = time * 0.5;
    const rotX = Math.sin(angle) * 0.5;
    const rotZ = Math.cos(angle) * 0.5;
    
    // Simple color change
    const hue = (Math.sin(time * 0.2) + 1) / 2;
    const r = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5;
    const g = Math.sin((hue + 0.33) * Math.PI * 2) * 0.5 + 0.5;
    const b = Math.sin((hue + 0.67) * Math.PI * 2) * 0.5 + 0.5;
    
    // Update each armature
    for (let i = 0; i < lightArmatures.length; i++) {
        const armature = lightArmatures[i];
        
        // Check if the armature has the head property
        if (armature && armature.head) {
            armature.head.rotation.x = rotX;
            armature.head.rotation.z = rotZ;
            
            // Update color if houseMesh exists
            if (armature.houseMesh && armature.houseMesh.material) {
                armature.houseMesh.material.emissive.setRGB(r, g, b);
            }
        }
    }
}

init().catch(console.error);
