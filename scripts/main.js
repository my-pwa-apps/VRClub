import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const clock = new THREE.Clock();
let lightArmatures = [];
let dancers = [];
let stationaryDust; // Add this global variable declaration

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
    
    // Create dancing NPCs
    createDancers();
    
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

    // Add this to your init or createClubEnvironment function
    const stationaryDust = createStationaryDustParticles();
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
    
    // Create realistic truss material
    const trussMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.3
    });

    // Create more detailed truss geometry
    const mainTrussGeometry = new THREE.BoxGeometry(0.2, 0.2, 20);
    const crossTrussGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    
    // Create trusses
    [-7, -3.5, 0, 3.5, 7].forEach(x => {
        // Main truss beam
        const truss = new THREE.Mesh(mainTrussGeometry, trussMaterial);
        truss.position.set(x, 9.8, 0);
        
        // Add cross beams for more realistic truss structure
        for (let z = -9; z <= 9; z += 1.5) {
            const crossBeam = new THREE.Mesh(crossTrussGeometry, trussMaterial);
            crossBeam.position.z = z;
            crossBeam.rotation.y = Math.PI / 2;
            truss.add(crossBeam);
        }
        
        scene.add(truss);
        
        // Add light fixtures with realistic beams
        [-8, -4, 0, 4, 8].forEach(z => {
            // Use more vibrant base colors
            const initialColor = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
            
            // Create detailed light fixture
            const fixture = createRealisticLightFixture(new THREE.Vector3(x, 9.7, z), initialColor);
            
            // Store the side information (left or right)
            fixture.isOnRightSide = x > 0;
            
            scene.add(fixture.group);
            lightArmatures.push(fixture);
        });
    });
}

// Create highly detailed and realistic light fixture
function createRealisticLightFixture(position, color) {
    const group = new THREE.Group();
    
    // -- Create detailed base mount --
    const baseGroup = new THREE.Group();
    
    // Main mounting bracket
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.4
    });
    
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.18, 0.4),
        baseMaterial
    );
    baseGroup.add(base);
    
    // Add mounting hardware (bolts)
    const boltMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.3
    });
    
    [-0.15, 0.15].forEach(x => {
        [-0.15, 0.15].forEach(z => {
            const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6),
                boltMaterial
            );
            bolt.position.set(x, 0.1, z);
            bolt.rotation.x = Math.PI/2;
            baseGroup.add(bolt);
        });
    });
    
    group.add(baseGroup);
    
    // -- Create detailed moving head --
    const headGroup = new THREE.Group();
    
    // Yoke (frame that holds the light)
    const yokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.4
    });
    
    // Yoke arms
    const yokeGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const leftYoke = new THREE.Mesh(yokeGeometry, yokeMaterial);
    leftYoke.position.x = 0.25;
    headGroup.add(leftYoke);
    
    const rightYoke = new THREE.Mesh(yokeGeometry, yokeMaterial);
    rightYoke.position.x = -0.25;
    headGroup.add(rightYoke);
    
    // Moving light housing in the middle of the yoke
    const housingGroup = new THREE.Group();
    
    // Main cylindrical housing
    const housingMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.3
    });
    
    const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16),
        housingMaterial
    );
    housing.rotation.x = Math.PI/2;
    housingGroup.add(housing);
    
    // Back cover with cooling fins
    const backCover = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16),
        baseMaterial
    );
    backCover.position.z = 0.22;
    backCover.rotation.x = Math.PI/2;
    housingGroup.add(backCover);
    
    // Add cooling fins
    const finMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.5
    });
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.2, 0.01),
            finMaterial
        );
        fin.position.set(
            Math.sin(angle) * 0.18,
            Math.cos(angle) * 0.18,
            0.22
        );
        fin.lookAt(new THREE.Vector3(0, 0, 0.22));
        housingGroup.add(fin);
    }
    
    // Front lens with intense emission
    const lensMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.9
    });
    
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
        lensMaterial
    );
    lens.position.z = -0.22;
    lens.rotation.x = Math.PI/2;
    housingGroup.add(lens);
    
    // Mount housing to the yoke
    housingGroup.position.y = -0.3;
    headGroup.add(housingGroup);
    
    // Mount head to base with rotation offset
    headGroup.position.y = -0.1;
    group.add(headGroup);
    
    // -- Create intense spotlight --
    const spotlight = new THREE.SpotLight(color, 15);
    spotlight.position.copy(housingGroup.position);
    spotlight.position.z -= 0.22;
    spotlight.angle = Math.PI / 12;
    spotlight.penumbra = 0.2;
    spotlight.decay = 1;
    spotlight.distance = 40;
    spotlight.castShadow = false;
    
    const target = new THREE.Object3D();
    target.position.set(0, -40, 0);
    spotlight.target = target;
    headGroup.add(spotlight);
    headGroup.add(target);
    
    // -- Create SOLID visible beam --
    const beamGroup = new THREE.Group();
    beamGroup.position.copy(housingGroup.position);
    beamGroup.position.z -= 0.22;
    
    // HIGHLY VISIBLE solid beam with multiple layers for better visibility
    const coreBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.15, 1, 16, 1, true),
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xffffff),
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    
    const midBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.3, 1, 16, 1, true),
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    
    const outerBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.5, 1, 20, 1, true),
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    
    // Position all beam layers
    coreBeam.rotation.x = Math.PI;
    midBeam.rotation.x = Math.PI;
    outerBeam.rotation.x = Math.PI;
    
    beamGroup.add(outerBeam);
    beamGroup.add(midBeam);
    beamGroup.add(coreBeam);
    
    headGroup.add(beamGroup);
    
    // Position the complete fixture
    group.position.copy(position);
    
    // Return all components in a well-structured object
    return {
        group,
        head: headGroup,
        housing: housingGroup,
        spotlight,
        beamGroup,
        beams: [coreBeam, midBeam, outerBeam],
        lens,
        color,
        target,
        position: position.clone()
    };
}

// Optimized function to update light beams
function updateLightArmatures(time) {
    if (!lightArmatures || lightArmatures.length === 0) return;
    
    // Calculate shared color - use more vibrant colors
    const hue = (Math.sin(time * 0.1) + 1) / 2;
    const sharedColor = new THREE.Color().setHSL(hue, 1.0, 0.6);
    
    // Create a raycaster for beam length calculation
    const raycaster = new THREE.Raycaster();
    
    // Get floor and relevant objects once outside the loop
    const floor = scene.children.find(obj => 
        obj.position.y === 0 && obj.geometry instanceof THREE.PlaneGeometry);
    
    // Update each light
    for (let i = 0; i < lightArmatures.length; i++) {
        const fixture = lightArmatures[i];
        if (!fixture || !fixture.head) continue;
        
        // Get rotation direction based on side
        const rotationDirection = fixture.isOnRightSide ? -1 : 1;
        
        // Calculate vertical and horizontal rotation patterns
        const verticalAngle = Math.sin(time * 0.2 + i * 0.1) * 0.6 - 0.3;
        const horizontalAngle = Math.sin(time * 0.3 + i * 0.2) * 1.2 * rotationDirection;
        
        // Apply rotations
        fixture.head.rotation.x = verticalAngle;
        fixture.head.rotation.z = horizontalAngle;
        
        // Update colors with intensity fluctuations
        const pulseIntensity = 12.0 + Math.sin(time * 2) * 3.0;
        
        if (fixture.spotlight) {
            fixture.spotlight.color.copy(sharedColor);
            fixture.spotlight.intensity = pulseIntensity;
        }
        
        if (fixture.lens && fixture.lens.material) {
            fixture.lens.material.color.copy(sharedColor);
            fixture.lens.material.emissive.copy(sharedColor);
            fixture.lens.material.emissiveIntensity = 1.5 + Math.sin(time * 2) * 0.5;
        }
        
        // Update beam colors and visibility
        if (fixture.beamGroup && fixture.beams) {
            // Update all beam layers colors and opacity
            fixture.beams.forEach((beam, index) => {
                if (beam.material) {
                    if (index === 0) {
                        // Core beam always white for intensity
                        beam.material.color.set(0xffffff);
                        beam.material.opacity = 0.9 + Math.sin(time * 3) * 0.1;
                    } else {
                        // Outer beams take color from shared color
                        beam.material.color.copy(sharedColor);
                        beam.material.opacity = (0.85 - index * 0.2) + Math.sin(time * 2 + i) * 0.15;
                    }
                }
            });
            
            // Calculate beam intersection with floor
            const lightPos = new THREE.Vector3();
            fixture.housing.getWorldPosition(lightPos);
            
            const direction = new THREE.Vector3(0, -1, 0);
            direction.applyQuaternion(fixture.head.getWorldQuaternion(new THREE.Quaternion()));
            direction.normalize();
            
            // Set up raycaster for floor intersection
            raycaster.set(lightPos, direction);
            
            // Cast ray to floor
            const floorIntersects = raycaster.intersectObject(floor);
            
            if (floorIntersects.length > 0) {
                const distance = floorIntersects[0].distance;
                
                // Scale all beam layers to floor intersection
                fixture.beams.forEach(beam => {
                    beam.scale.y = distance * 0.95; // Slight adjustment to prevent z-fighting
                });
                
                // Make spot on floor by creating a light spot
                const spotOnFloor = floorIntersects[0].point;
                
                // Find or create floor spot light
                if (!fixture.floorSpot) {
                    const spotMaterial = new THREE.MeshBasicMaterial({
                        color: sharedColor,
                        transparent: true,
                        opacity: 0.7,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    
                    const spot = new THREE.Mesh(
                        new THREE.CircleGeometry(0.5, 16),
                        spotMaterial
                    );
                    spot.rotation.x = -Math.PI/2;
                    spot.position.y = 0.01; // Just above floor
                    
                    scene.add(spot);
                    fixture.floorSpot = spot;
                }
                
                // Update floor spot
                if (fixture.floorSpot) {
                    fixture.floorSpot.position.x = spotOnFloor.x;
                    fixture.floorSpot.position.z = spotOnFloor.z;
                    fixture.floorSpot.material.color.copy(sharedColor);
                    
                    // Pulse the size of the spot with the beat
                    const spotSize = 0.3 + Math.sin(time * 2) * 0.1 + (distance * 0.1);
                    fixture.floorSpot.scale.set(spotSize, spotSize, 1);
                    
                    // Adjust opacity based on angle - more perpendicular = more visible
                    const dotProduct = Math.abs(direction.dot(new THREE.Vector3(0, 1, 0)));
                    fixture.floorSpot.material.opacity = 0.7 * dotProduct;
                }
            }
        }
    }
}

// New function to illuminate stationary dust particles when beams pass through them
function illuminateStationaryDustParticles(beamOrigin, beamDirection, beamColor, time) {
    if (!stationaryDust) return;
    
    const beamRadius = 0.5; // Effective radius of the beam
    const beamLength = 20;   // Maximum beam length
    
    // Create beam line for testing
    const beamEnd = beamOrigin.clone().addScaledVector(beamDirection, beamLength);
    const beamLine = new THREE.Line3(beamOrigin, beamEnd);
    
    // Update each dust particle
    stationaryDust.children.forEach(particle => {
        // Calculate closest point on beam line to this particle
        const closestPoint = new THREE.Vector3();
        beamLine.closestPointToPoint(particle.position, true, closestPoint);
        
        // Calculate distance from particle to closest point on beam
        const distance = particle.position.distanceTo(closestPoint);
        
        // If particle is close enough to beam, illuminate it
        if (distance < beamRadius) {
            // Calculate intensity based on distance (closer = brighter)
            const intensity = 1.0 - (distance / beamRadius);
            
            // Illuminate the particle
            if (particle.material) {
                // Store original values if not already stored
                if (!particle.userData.originalColor) {
                    particle.userData.originalColor = particle.material.color.clone();
                    particle.userData.originalOpacity = particle.material.opacity;
                }
                
                // Mix particle color with beam color based on intensity
                particle.material.color.copy(beamColor);
                particle.material.opacity = Math.min(0.9, particle.userData.originalOpacity + intensity * 0.7);
                
                // Mark as illuminated
                particle.userData.illuminated = true;
                particle.userData.illuminationTime = time;
            }
        } 
        // If particle was previously illuminated but now isn't in beam, fade back to normal
        else if (particle.userData.illuminated) {
            const fadeTime = 0.5; // Time to fade back to normal in seconds
            const elapsed = time - particle.userData.illuminationTime;
            
            if (elapsed > fadeTime) {
                // Reset to original values
                if (particle.userData.originalColor) {
                    particle.material.color.copy(particle.userData.originalColor);
                }
                particle.material.opacity = particle.userData.originalOpacity;
                particle.userData.illuminated = false;
            } else {
                // Fade gradually
                const t = elapsed / fadeTime;
                if (particle.userData.originalColor) {
                    particle.material.color.lerp(particle.userData.originalColor, t);
                }
                particle.material.opacity = particle.userData.originalOpacity + 
                    (particle.material.opacity - particle.userData.originalOpacity) * (1-t);
            }
        }
        
        // Move particles slowly for subtle drift effect
        if (particle.userData.driftVelocity) {
            particle.position.add(particle.userData.driftVelocity);
            
            // Boundaries check to keep particles in club volume
            if (Math.abs(particle.position.x) > 9) {
                particle.userData.driftVelocity.x *= -1;
            }
            if (particle.position.y < 0.1 || particle.position.y > 9) {
                particle.userData.driftVelocity.y *= -1;
            }
            if (Math.abs(particle.position.z) > 9) {
                particle.userData.driftVelocity.z *= -1;
            }
        }
    });
}

// Create dancing NPCs
function createDancers() {
    const dancerCount = 12; // Number of dancers
    const danceFloorRadius = 4; // Radius of dance floor area
    
    for (let i = 0; i < dancerCount; i++) {
        // Create a simple humanoid figure
        const dancer = createDancerFigure();
        
        // Position dancers in a circle on the dance floor
        const angle = (i / dancerCount) * Math.PI * 2;
        const radius = Math.random() * danceFloorRadius;
        dancer.position.set(
            Math.sin(angle) * radius,
            0,
            Math.cos(angle) * radius
        );
        
        // Rotate to face center
        dancer.lookAt(0, 0, 0);
        
        // Rotate to face center
        dancer.lookAt(0, 0, 0);
        
        // Add some randomness to rotation
        dancer.rotation.y += (Math.random() - 0.5) * 1.5;
        
        // Add dance animation parameters
        dancer.userData = {
            danceType: Math.floor(Math.random() * 3), // 0-2 different dance styles
            danceSpeed: 0.5 + Math.random() * 1.5,    // Random speed
            dancePhase: Math.random() * Math.PI * 2,  // Random starting phase
            danceHeight: 0.05 + Math.random() * 0.1   // Random bounce height
        };
        
        scene.add(dancer);
        dancers.push(dancer);
    }
    
    console.log(`Created ${dancers.length} dancers`);
}

// Create a simple humanoid figure with gender characteristics and facial expressions
function createDancerFigure() {
    const dancer = new THREE.Group();
    
    // Determine gender randomly
    const isFemale = Math.random() > 0.5;
    
    // Random color for clothing with gender-typical variations
    const hue = isFemale 
        ? 0.7 + Math.random() * 0.5 // More purple/pink hues for female
        : Math.random() * 0.7; // More red/green/blue hues for male
    const saturation = 0.6 + Math.random() * 0.4;
    const color = new THREE.Color().setHSL(hue, saturation, 0.5);
    
    // Create materials with slight emission for visibility in dark club
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color.clone().multiplyScalar(0.3),
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Skin color variations
    const skinHue = 0.05 + Math.random() * 0.1; // Various skin tones
    const skinSaturation = 0.3 + Math.random() * 0.4;
    const skinLightness = 0.4 + Math.random() * 0.4;
    const skinColor = new THREE.Color().setHSL(skinHue, skinSaturation, skinLightness);
    
    const skinMaterial = new THREE.MeshStandardMaterial({
        color: skinColor,
        emissive: skinColor.clone().multiplyScalar(0.2),
        roughness: 0.6,
        metalness: 0.1
    });
    
    // Create head with facial features
    const headGroup = new THREE.Group();
    
    // Base head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        skinMaterial
    );
    headGroup.add(head);
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(0.05, 0.02, 0.1);
    headGroup.add(leftEyeWhite);
    
    const leftEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 6, 6),
        eyePupilMaterial
    );
    leftEyePupil.position.set(0.055, 0.02, 0.115);
    headGroup.add(leftEyePupil);
    
    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(-0.05, 0.02, 0.1);
    headGroup.add(rightEyeWhite);
    
    const rightEyePupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 6, 6),
        eyePupilMaterial
    );
    rightEyePupil.position.set(-0.055, 0.02, 0.115);
    headGroup.add(rightEyePupil);
    
    // Add mouth - Create a simple smile
    const mouthGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 12, Math.PI);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x990000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.04, 0.1);
    mouth.rotation.x = -Math.PI / 2;
    mouth.rotation.z = Math.PI;
    headGroup.add(mouth);
    
    // Add hair based on gender
    if (isFemale) {
        // Female longer hair
        const hairColor = new THREE.Color().setHSL(
            Math.random() * 0.1 + (Math.random() > 0.3 ? 0 : 0.3), // Blonde or dark
            0.5 + Math.random() * 0.5,
            0.2 + Math.random() * 0.4
        );
        
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create longer hair with multiple segments
        const hairGroup = new THREE.Group();
        
        // Hair top
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 12, 12, 0, Math.PI * 2, 0, Math.PI/2),
            hairMaterial
        );
        hairTop.position.y = 0.02;
        hairGroup.add(hairTop);
        
        // Hair back
        const hairBack = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.2, 0.1),
            hairMaterial
        );
        hairBack.position.set(0, -0.08, -0.08);
        hairGroup.add(hairBack);
        
        headGroup.add(hairGroup);
    } else {
        // Male shorter hair
        const hairColor = new THREE.Color().setHSL(
            Math.random() * 0.1,
            0.3 + Math.random() * 0.4,
            0.1 + Math.random() * 0.3
        );
        
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create short hair
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.125, 12, 12, 0, Math.PI * 2, 0, Math.PI/2),
            hairMaterial
        );
        hairTop.position.y = 0.02;
        headGroup.add(hairTop);
    }
    
    // Position complete head
    headGroup.position.y = 1.6;
    dancer.add(headGroup);
    
    // Create torso with gender-specific proportions
    const torsoWidth = isFemale ? 0.13 : 0.15;
    const torsoHeight = 0.6;
    
    const torso = new THREE.Group();
    
    // Main torso
    const torsoMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(torsoWidth, torsoWidth * 1.1, torsoHeight, 12),
        bodyMaterial
    );
    torso.add(torsoMesh);
    
    // For females, add a subtle bust shape
    if (isFemale) {
        const bustGeometry = new THREE.SphereGeometry(torsoWidth * 1.1, 8, 8, 0, Math.PI * 2, 0, Math.PI/2);
        const bust = new THREE.Mesh(bustGeometry, bodyMaterial);
        bust.rotation.x = Math.PI;
        bust.position.y = torsoHeight * 0.2;
        bust.position.z = torsoWidth * 0.2;
        torso.add(bust);
    }
    
    torso.position.y = 1.25;
    dancer.add(torso);
    
    // Create arms
    const armMaterial = skinMaterial;
    
    // Create arms - thinner for females
    const armRadius = isFemale ? 0.04 : 0.05;
    const leftArm = createLimb(armMaterial, armRadius, 0.5);
    leftArm.position.set(torsoWidth * 1.1, 1.4, 0);
    leftArm.rotation.z = -Math.PI / 4;
    
    const rightArm = createLimb(armMaterial, armRadius, 0.5);
    rightArm.position.set(-torsoWidth * 1.1, 1.4, 0);
    rightArm.rotation.z = Math.PI / 4;
    
    dancer.add(leftArm);
    dancer.add(rightArm);
    
    // Create legs with gender differences - females have longer thinner legs
    const legRadius = isFemale ? 0.06 : 0.07;
    const legLength = isFemale ? 0.85 : 0.8;
    const legSpacing = isFemale ? 0.08 : 0.1;
    
    const leftLeg = createLimb(bodyMaterial, legRadius, legLength); // Use clothing material for legs
    leftLeg.position.set(legSpacing, 0.9, 0);
    
    const rightLeg = createLimb(bodyMaterial, legRadius, legLength);
    rightLeg.position.set(-legSpacing, 0.9, 0);
    
    dancer.add(leftLeg);
    dancer.add(rightLeg);
    
    // Store gender in userData for animation purposes
    dancer.userData.isFemale = isFemale;
    
    // Add facial expression state
    dancer.userData.expressionState = {
        smiling: Math.random() > 0.3, // Most are smiling
        blinkTime: Math.random() * 3,
        lastBlink: 0
    };
    
    // Reference facial features for animation
    dancer.userData.face = {
        leftEye: leftEyeWhite,
        rightEye: rightEyeWhite,
        leftPupil: leftEyePupil,
        rightPupil: rightEyePupil,
        mouth: mouth
    };
    
    return dancer;
}

// Helper function to create limbs
function createLimb(material, radius, height) {
    const limb = new THREE.Group();
    
    const limbMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 8),
        material
    );
    limbMesh.position.y = -height/2;
    limb.add(limbMesh);
    
    return limb;
}

// Animate dancers with facial expressions
function updateDancers(time) {
    dancers.forEach((dancer) => {
        if (!dancer.userData) return;
        
        const { danceType, danceSpeed, dancePhase, danceHeight, isFemale } = dancer.userData;
        
        // Dance movement
        switch (danceType) {
            case 0: // Bouncing dance
                dancer.position.y = Math.abs(Math.sin(time * danceSpeed + dancePhase)) * danceHeight;
                dancer.rotation.y += 0.01 * danceSpeed;
                break;
                
            case 1: // Swaying dance
                dancer.rotation.z = Math.sin(time * danceSpeed + dancePhase) * 0.1;
                dancer.rotation.y += 0.005 * danceSpeed;
                break;
                
            case 2: // Arm waving dance
                if (dancer.children.length >= 4) {
                    // Left arm
                    dancer.children[2].rotation.z = -Math.PI / 4 + 
                        Math.sin(time * danceSpeed + dancePhase) * 0.3;
                    
                    // Right arm
                    dancer.children[3].rotation.z = Math.PI / 4 + 
                        Math.sin(time * danceSpeed + dancePhase + Math.PI) * 0.3;
                }
                break;
        }
        
        // Update facial expressions if face references exist
        if (dancer.userData.face && dancer.userData.expressionState) {
            const face = dancer.userData.face;
            const state = dancer.userData.expressionState;
            
            // Handle eye blinking
            if (time - state.lastBlink > state.blinkTime) {
                // Start a blink
                if (face.leftEye.scale.y > 0.1) {
                    face.leftEye.scale.y *= 0.5;
                    face.rightEye.scale.y *= 0.5;
                } else {
                    // End blink
                    face.leftEye.scale.y = 1;
                    face.rightEye.scale.y = 1;
                    state.lastBlink = time;
                    state.blinkTime = 2 + Math.random() * 3; // Random time until next blink
                }
            }
            
            // Update pupils to look around occasionally
            if (Math.sin(time * 0.5) > 0.9) {
                face.leftPupil.position.x = 0.055 + Math.sin(time) * 0.005;
                face.leftPupil.position.y = 0.02 + Math.cos(time * 0.7) * 0.005;
                face.rightPupil.position.x = -0.055 + Math.sin(time) * 0.005;
                face.rightPupil.position.y = 0.02 + Math.cos(time * 0.7) * 0.005;
            }
            
            // Update mouth expression based on the beat
            if (state.smiling) {
                // Make smile wider/narrower with the beat
                face.mouth.scale.x = 1 + Math.sin(time * danceSpeed) * 0.1;
                face.mouth.scale.z = 1 + Math.cos(time * danceSpeed * 0.7) * 0.1;
            }
        }
    });
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

// Modify the animate function to store stationaryDust globally
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
        
        // Update dancers if they exist
        if (dancers.length > 0 && typeof updateDancers === 'function') {
            updateDancers(time);
        }
        
        // Only update orbit controls when not in VR and if they exist
        if (!renderer.xr.isPresenting && controls && typeof controls.update === 'function') {
            controls.update();
        }
        
        // Let Three.js handle rendering
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Animation error:', error);
        if (renderer && renderer.setAnimationLoop) {
            renderer.setAnimationLoop(null);
            document.getElementById('error').textContent = 'Rendering error: ' + error.message;
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

// Add the updateMovement function if it was accidentally removed
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
