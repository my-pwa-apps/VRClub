import * as THREE from 'three';

export class MovingLight {
    constructor(position, color) {
        this.group = new THREE.Group();
        this.color = color;
        this.createFixture();
        this.group.position.copy(position);
    }

    createFixture() {
        // Create the moving light fixture structure
        const fixtureGroup = new THREE.Group();
        
        // Create base mount
        const base = this.createBase();
        fixtureGroup.add(base);
        
        // Create moving head with spotlight
        const head = this.createHead();
        fixtureGroup.add(head);
        
        // Create beam
        const beam = this.createBeam();
        head.add(beam);
        
        this.group.add(fixtureGroup);
        this.head = head;
        this.beam = beam;
    }

    update(time) {
        if (!this.head) return;
        
        // Calculate rotation patterns
        const verticalAngle = Math.sin(time * 0.2) * 0.6 - 0.3;
        const horizontalAngle = Math.sin(time * 0.3) * 1.2;
        
        // Apply rotations
        this.head.rotation.x = verticalAngle;
        this.head.rotation.z = horizontalAngle;
    }

    // ... helper methods for creating components
}
