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

    // ... implementation of helper methods
}
