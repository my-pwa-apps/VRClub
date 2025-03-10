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

    createBase() {
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.15, 0.4),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.9,
                roughness: 0.4
            })
        );
        return base;
    }

    createHead() {
        const head = new THREE.Group();
        
        const housing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.3
            })
        );
        housing.rotation.x = Math.PI/2;
        head.add(housing);
        
        return head;
    }

    createBeam() {
        const beamGroup = new THREE.Group();
        
        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.3, 1, 16, 1, true),
            new THREE.MeshBasicMaterial({
                color: this.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            })
        );
        beamGroup.add(beam);
        
        return beamGroup;
    }
}
