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

    createFacets() {
        const facetCount = 200;
        for (let i = 0; i < facetCount; i++) {
            const facet = new THREE.Mesh(
                new THREE.PlaneGeometry(0.08, 0.08),
                new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    metalness: 1.0,
                    roughness: 0.02
                })
            );
            
            const phi = Math.acos(-1 + (2 * i) / facetCount);
            const theta = Math.sqrt(facetCount * Math.PI) * phi;
            
            facet.position.setFromSphericalCoords(0.5, phi, theta);
            facet.lookAt(0, 0, 0);
            
            this.ball.add(facet);
        }
    }

    createReflectionSpots() {
        const count = 40;
        const spotGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const spotMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < count; i++) {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.visible = false;
            // Store spots separately, not in scene graph yet
            this.reflectionSpots.push({
                mesh: spot,
                facetIndex: Math.floor(Math.random() * 200)
            });
        }
    }

    update(time) {
        this.group.rotation.y += 0.005;
        this.updateReflections(time);
    }

    updateReflections(time) {
        this.reflectionSpots.forEach((spot, i) => {
            if (spot.mesh) {
                const angle = time + i * 0.1;
                if (!spot.mesh.parent) {
                    // Only add to scene once
                    this.group.parent?.add(spot.mesh);
                }
                
                // Basic reflection animation
                spot.mesh.position.x = Math.sin(angle) * 5;
                spot.mesh.position.y = 0.1;
                spot.mesh.position.z = Math.cos(angle) * 5;
                spot.mesh.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
                spot.mesh.visible = true;
            }
        });
    }
}
