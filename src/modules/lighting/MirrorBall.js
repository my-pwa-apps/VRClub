import * as THREE from 'three';

export class MirrorBall {
    constructor() {
        this.group = new THREE.Group();
        this.reflectionSpots = [];
        this.createBall();
        this.createReflectionSpots();
    }

    createBall() {
        const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const ballMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 2.0
        });
        
        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        this.createFacets();
        this.group.add(this.ball);
        this.group.position.set(0, 6, 0);
    }

    update(time) {
        this.group.rotation.y += 0.005;
        this.updateReflections(time);
    }

    // ... helper methods for reflections and facets
}
