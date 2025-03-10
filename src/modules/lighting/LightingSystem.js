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

    // ... implementation of helper methods
}
