import * as THREE from 'three';

export class NPC extends THREE.Group {
    constructor(type = 'dancing') {
        super();
        this.type = type;
        this.mixer = null;
        this.actions = {};
        this.behavior = {
            currentState: type,
            timeInState: 0,
            nextStateChange: Math.random() * 10 + 5
        };
    }

    async initialize() {
        // Create realistic human mesh with club-appropriate clothing
        const model = await this.createHumanModel();
        this.add(model);
        
        // Add subtle animation for "breathing" and small movements
        this.mixer = new THREE.AnimationMixer(this);
        this.setupBaseAnimations();
        
        // Add natural head movement
        this.setupHeadTracking();
    }

    createHumanModel() {
        const body = new THREE.Group();

        // Create realistic body proportions
        const torso = this.createTorso();
        const head = this.createHead();
        const arms = this.createArms();
        const legs = this.createLegs();

        body.add(torso);
        body.add(head);
        body.add(arms);
        body.add(legs);

        // Add club-appropriate clothing and accessories
        this.addClothing(body);
        this.addAccessories(body);

        return body;
    }

    setupBaseAnimations() {
        // Default implementation
        // Will be populated by animation system
    }

    setupHeadTracking() {
        this.headTrackingTarget = new THREE.Vector3();
        this.lookAtWeight = 0;
    }

    createTorso() {
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.5,
                roughness: 0.5
            })
        );
        return torso;
    }

    createHead() {
        const head = new THREE.Group();
        const skull = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffdbac,
                metalness: 0.2,
                roughness: 0.8
            })
        );
        head.add(skull);
        return head;
    }

    createArms() {
        const arms = new THREE.Group();
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
                new THREE.MeshStandardMaterial({
                    color: 0xffdbac,
                    metalness: 0.2,
                    roughness: 0.8
                })
            );
            arm.position.x = side * 0.2;
            arm.position.y = -0.25;
            arms.add(arm);
        });
        return arms;
    }

    createLegs() {
        const legs = new THREE.Group();
        [-1, 1].forEach(side => {
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6),
                new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.5,
                    roughness: 0.5
                })
            );
            leg.position.x = side * 0.1;
            leg.position.y = -0.4;
            legs.add(leg);
        });
        return legs;
    }

    addClothing(body) {
        // Add shirt
        const shirt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 0.4, 8),
            new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff,
                metalness: 0.1,
                roughness: 0.8
            })
        );
        shirt.position.y = 0.1;
        body.add(shirt);
    }

    addAccessories(body) {
        if (Math.random() > 0.7) {
            const hat = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8),
                new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff,
                    metalness: 0.3,
                    roughness: 0.7
                })
            );
            hat.position.y = 1.7;
            body.add(hat);
        }
    }
}
