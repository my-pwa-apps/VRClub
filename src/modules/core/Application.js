import * as THREE from 'three';
import { ResourceManager } from './ResourceManager.js';
import { Renderer } from './Renderer.js';
import { Scene } from './Scene.js';
import { Camera } from './Camera.js';
import { LightingSystem } from '../lighting/LightingSystem.js';
import { EnvironmentSystem } from '../environment/EnvironmentSystem.js';
import { CharacterSystem } from '../characters/CharacterSystem.js';
import { InputSystem } from './InputSystem.js';

export class Application {
    constructor(canvas) {
        this.resources = new ResourceManager();
        this.scene = new Scene();
        this.camera = new Camera();
        this.renderer = new Renderer(canvas);
        this.clock = new THREE.Clock();

        // Reusable vectors to avoid allocations
        this._vec3 = new THREE.Vector3();
        this._quat = new THREE.Quaternion();
        
        this.systems = {
            lighting: new LightingSystem(this.scene, this.resources),
            environment: new EnvironmentSystem(this.scene, this.resources),
            characters: new CharacterSystem(this.scene), // Only pass the scene
            input: new InputSystem(this.camera)
        };

        // Use global Stats object if present
        if (typeof window.Stats !== 'undefined') {
            this.stats = new window.Stats();
            document.body.appendChild(this.stats.dom);
        }
        
        this.init();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('beforeunload', this.dispose.bind(this));
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    async init() {
        try {
            const loadingScreen = document.getElementById('loading');
            
            // Initialize systems sequentially to prevent resource contention
            await this.systems.environment.init();
            await this.systems.lighting.init();
            await this.systems.characters.init();
            this.systems.input.init();
            
            // Start render loop
            this.renderer.setAnimationLoop(this.update.bind(this));
            
            // Hide loading screen with fade
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showError(`Initialization failed: ${error.message}`);
        }
    }

    update() {
        if (this.stats) this.stats.begin();

        try {
            const delta = this.clock.getDelta();
            const time = this.clock.getElapsedTime();

            // Fix: Access the actual WebGLRenderer instance through our wrapper
            const isVRPresenting = this.renderer.renderer?.xr?.isPresenting;

            // Update systems
            if (!isVRPresenting) {
                this.systems.input.update(delta);
            }
            
            this.systems.lighting.update(time);
            this.systems.characters.update(delta);
            this.systems.environment.update(time);

            // Render scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Runtime error:', error);
            this.renderer.setAnimationLoop(null);
            this.showError(`Runtime error: ${error.message}`);
        }

        if (this.stats) this.stats.end();
    }

    showError(message) {
        const errorElement = document.getElementById('error') || 
            document.createElement('div');
        
        errorElement.id = 'error';
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        if (!errorElement.parentElement) {
            document.body.appendChild(errorElement);
        }
    }

    dispose() {
        // Cleanup systems
        Object.values(this.systems).forEach(system => {
            if (system.dispose) system.dispose();
        });

        // Cleanup resources
        this.resources.dispose();
        this.renderer.dispose();

        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('beforeunload', this.dispose);
        
        // Remove stats if it exists
        if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
            document.body.removeChild(this.stats.dom);
        }
    }
}
