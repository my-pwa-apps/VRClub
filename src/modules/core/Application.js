import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { Scene } from './Scene.js';
import { Camera } from './Camera.js';
import { LightingSystem } from '../lighting/LightingSystem.js';
import { EnvironmentSystem } from '../environment/EnvironmentSystem.js';
import { CharacterSystem } from '../characters/CharacterSystem.js';
import { InputSystem } from './InputSystem.js';

export class Application {
    constructor(canvas) {
        this.scene = new Scene();
        this.camera = new Camera();
        this.renderer = new Renderer(canvas);
        this.clock = new THREE.Clock();
        
        this.systems = {
            lighting: new LightingSystem(this.scene),
            environment: new EnvironmentSystem(this.scene),
            characters: new CharacterSystem(this.scene),
            input: new InputSystem(this.camera)
        };
        
        this.init();
    }

    async init() {
        try {
            await this.systems.environment.init();
            await this.systems.lighting.init();
            await this.systems.characters.init();
            this.systems.input.init();
            
            this.renderer.setAnimationLoop(this.update.bind(this));
        } catch (error) {
            console.error('Application initialization failed:', error);
        }
    }

    update() {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.systems.input.update(delta);
        this.systems.lighting.update(time);
        this.systems.characters.update(delta);
        this.systems.environment.update(time);

        this.renderer.render(this.scene, this.camera);
    }
}
