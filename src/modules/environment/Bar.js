import * as THREE from 'three';

export class Bar {
    constructor(scene) {
        this.scene = scene;
        this.bar = new THREE.Group();
    }

    async init() {
        await this.createCounter();
        this.createBackBar();
        this.createLighting();
        this.scene.add(this.bar);
    }

    // ... methods for creating bar components
}
