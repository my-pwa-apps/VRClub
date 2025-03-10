import * as THREE from 'three';
import { MovingLight } from './MovingLight.js';
import { MirrorBall } from './MirrorBall.js';
import { StationaryDust } from './StationaryDust.js';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.mirrorBall = null;
        this.stationaryDust = null;
    }

    async init() {
        this.setupAmbientLighting();
        await this.createMovingLights();
        await this.createMirrorBall();
        this.createStationaryDust();
    }

    update(time) {
        this.lights.forEach(light => light.update(time));
        if (this.mirrorBall) this.mirrorBall.update(time);
        if (this.stationaryDust) this.stationaryDust.update(time);
    }

    setupAmbientLighting() {
        const ambient = new THREE.AmbientLight(0x111111, 0.05);
        const fillLight = new THREE.HemisphereLight(0x2233ff, 0x221122, 0.05);
        this.scene.add(ambient);
        this.scene.add(fillLight);
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
}
