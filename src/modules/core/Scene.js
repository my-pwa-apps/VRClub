import * as THREE from 'three';

export class Scene extends THREE.Scene {
    constructor() {
        super();
        this.background = new THREE.Color(0x000000);
        this.setupBasicLighting();
    }

    setupBasicLighting() {
        const ambient = new THREE.AmbientLight(0x111111, 0.05);
        const fillLight = new THREE.HemisphereLight(0x2233ff, 0x221122, 0.05);
        this.add(ambient);
        this.add(fillLight);
    }
}
