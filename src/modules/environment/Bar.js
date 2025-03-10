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

    async createCounter() {
        // Bar counter with wood texture
        const barMaterial = new THREE.MeshStandardMaterial({
            color: 0x553311,
            metalness: 0.3,
            roughness: 0.8
        });
        
        // Main counter
        const counter = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1.1, 1.5),
            barMaterial
        );
        counter.position.set(-5, 0.55, 7);
        
        // Bar top with glossy finish
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(8.2, 0.05, 1.7),
            new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.8,
                roughness: 0.1
            })
        );
        top.position.set(-5, 1.15, 7);
        
        this.bar.add(counter);
        this.bar.add(top);
    }

    createBackBar() {
        const barMaterial = new THREE.MeshStandardMaterial({
            color: 0x553311,
            metalness: 0.3,
            roughness: 0.8
        });
        
        // Back counter
        const backCounter = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2.5, 0.4),
            barMaterial
        );
        backCounter.position.set(-5, 1.25, 8.2);
        
        // Add shelves
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.6,
            roughness: 0.2
        });
        
        [0.5, 1.2, 1.9].forEach(y => {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(7.8, 0.05, 0.3),
                shelfMaterial
            );
            shelf.position.set(-5, y, 8);
            this.bar.add(shelf);
        });
        
        this.bar.add(backCounter);
    }

    createLighting() {
        // Add ambient bar lighting
        const barLight = new THREE.PointLight(0x995511, 0.6, 8, 2);
        barLight.position.set(-5, 3, 6);
        this.bar.add(barLight);
    }
}
