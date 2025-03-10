import * as THREE from 'three';

export class Scene extends THREE.Scene {
    constructor() {
        super();
        this.background = new THREE.Color(0x000000);
        this.fog = new THREE.Fog(0x000000, 5, 30);
        this._setupBasicLighting();
        this._setupOptimizations();
    }

    _setupBasicLighting() {
        const ambient = new THREE.AmbientLight(0x111111, 0.05);
        const fillLight = new THREE.HemisphereLight(0x2233ff, 0x221122, 0.05);
        this.add(ambient, fillLight);
    }

    _setupOptimizations() {
        // Use frustum culling
        this.matrixAutoUpdate = false;
        this.autoUpdate = false;
    }

    update() {
        // Manual matrix updates for better performance
        this.updateMatrixWorld(true);
        this.autoUpdate = false;
    }

    dispose() {
        this.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => this._disposeMaterial(material));
                } else {
                    this._disposeMaterial(object.material);
                }
            }
        });
    }

    _disposeMaterial(material) {
        Object.keys(material).forEach(prop => {
            if (material[prop] && material[prop].isTexture) {
                material[prop].dispose();
            }
        });
        material.dispose();
    }
}
