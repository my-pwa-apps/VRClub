import * as THREE from 'three';

export class StationaryDust {
    constructor() {
        this.particles = new THREE.Group();
        this.createDustParticles();
    }

    createDustParticles() {
        const particleCount = 300;
        const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        
        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1 + Math.random() * 0.2,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, material);
            this.positionParticle(particle);
            this.particles.add(particle);
        }
    }

    update(time) {
        // Update particle positions and illumination
        this.particles.children.forEach(particle => {
            if (particle.userData.driftVelocity) {
                particle.position.add(particle.userData.driftVelocity);
                this.checkBounds(particle);
            }
        });
    }

    // ... helper methods for positioning and bounds checking
}
