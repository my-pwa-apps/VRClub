import * as THREE from 'https://cdn.skypack.dev/three@0.147.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.147.0/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://cdn.skypack.dev/three@0.147.0/examples/jsm/webxr/VRButton.js';

let scene, camera, renderer, controls;

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
    
    // Start animation loop
    renderer.setAnimationLoop(animate);
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
