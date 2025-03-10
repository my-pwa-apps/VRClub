import * as THREE from 'three';
import { MovingLight } from './MovingLight.js';
import { MirrorBall } from './MirrorBall.js';
import { StationaryDust } from './StationaryDust.js';

export class LightingSystem {
    constructor(scene, resources) {
        this.scene = scene;
        this.resources = resources;
        this.lights = [];
        this.mirrorBall = null;
        this.stationaryDust = null;
    }

    async init() {
        console.log("🔦 Setting up lighting system...");
        this.setupAmbientLighting();
        await this.createMovingLights();
        await this.createMirrorBall();
        this.createStationaryDust();
        
        // Add some debug visuals to confirm lighting is working
        this.addDebugLights();
        
        console.log(`✅ Lighting system ready: ${this.lights.length} lights created`);
    }

    setupAmbientLighting() {
        // Create stronger ambient light so the scene isn't too dark
        const ambient = new THREE.AmbientLight(0x333333, 0.3); // Increased intensity
        const fillLight = new THREE.HemisphereLight(0x3344ff, 0x334455, 0.4); // Increased intensity
        this.scene.add(ambient);
        this.scene.add(fillLight);
        
        console.log("💡 Basic ambient lighting added");
    }
    
    // Helper to add some simple debug lights to ensure the scene is visible
    addDebugLights() {
        // Add a main directional light to ensure scene visibility
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 8, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add point lights to highlight key areas
        const pointLights = [
            { pos: [0, 5, 0], color: 0xffaa44, intensity: 1.0 },  // Center
            { pos: [-5, 3, 7], color: 0x4488ff, intensity: 1.0 }, // Bar area
            { pos: [0, 3, -8], color: 0xff44aa, intensity: 1.0 }  // DJ area
        ];
        
        pointLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, light.intensity, 15);
            pointLight.position.set(...light.pos);
            this.scene.add(pointLight);
        });
        
        console.log("🔆 Debug lighting added to ensure visibility");
    }

    async createMovingLights() {
        const positions = [
            [-7, 9.8, -8], [0, 9.8, -8], [7, 9.8, -8],
            [-7, 9.8, 8], [0, 9.8, 8], [7, 9.8, 8]
        ];

        positions.forEach(pos => {
            const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
            const light = new MovingLight(new THREE.Vector3(...pos), color);
            this.lights.push(light);
            this.scene.add(light.group);
        });
    }

    async createMirrorBall() {
        this.mirrorBall = new MirrorBall();
        this.scene.add(this.mirrorBall.group);
    }

    createStationaryDust() {
        this.stationaryDust = new StationaryDust();
        this.scene.add(this.stationaryDust.particles);
    }

    update(time) {
        this.lights.forEach(light => {
            if (light.update) light.update(time);
        });

        if (this.mirrorBall && this.mirrorBall.update) {
            this.mirrorBall.update(time);
        }

        if (this.stationaryDust && this.stationaryDust.update) {
            this.stationaryDust.update(time);
        }
    }
}
