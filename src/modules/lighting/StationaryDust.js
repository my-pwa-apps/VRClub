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

    positionParticle(particle) {
        // Random position within club volume
        particle.position.set(
            (Math.random() - 0.5) * 18,
            Math.random() * 8 + 1,
            (Math.random() - 0.5) * 18
        );
        
        // Add drift velocity
        particle.userData.driftVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
        );
    }

    checkBounds(particle) {
        const bounds = {
            x: [-9, 9],
            y: [0.1, 9],
            z: [-9, 9]
        };
        
        ['x', 'y', 'z'].forEach(axis => {
            if (particle.position[axis] < bounds[axis][0] || 
                particle.position[axis] > bounds[axis][1]) {
                particle.userData.driftVelocity[axis] *= -1;
            }
        });
    }
}
