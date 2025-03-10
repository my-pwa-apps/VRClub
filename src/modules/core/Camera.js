import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera extends THREE.PerspectiveCamera {
    constructor() {
        super(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.position.set(0, 1.6, 5);
        this.controls = null;
    }

    setupControls(renderer) {
        this.controls = new OrbitControls(this, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        renderer.xr.addEventListener('sessionstart', () => this.controls.enabled = false);
        renderer.xr.addEventListener('sessionend', () => this.controls.enabled = true);
    }

    updateControls() {
        if (this.controls) this.controls.update();
    }
}
