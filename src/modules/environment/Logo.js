import * as THREE from 'three';

export class Logo {
    constructor(scene) {
        this.scene = scene;
        this.logoGroup = new THREE.Group();
    }

    init() {
        this.createBackground();
        this.createText();
        this.createGlow();
        this.scene.add(this.logoGroup);
    }

    createBackground() {
        // Background panel with slight glow
        const panelGeometry = new THREE.PlaneGeometry(6, 1.5);
        const panelMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        this.logoGroup.add(panel);
    }

    createText() {
        const textGroup = new THREE.Group();
        const letters = "CONCRETE";
        let offset = -2.5;
        
        // Create individual letters
        for (let i = 0; i < letters.length; i++) {
            const letterGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.05);
            const letterMaterial = new THREE.MeshStandardMaterial({
                color: 0x3333ff,
                emissive: 0x3333ff,
                emissiveIntensity: 0.8,
                metalness: 0.9,
                roughness: 0.2
            });
            
            const letter = new THREE.Mesh(letterGeometry, letterMaterial);
            letter.position.x = offset + i * 0.6;
            textGroup.add(letter);
        }
        
        this.logoGroup.add(textGroup);
    }

    createGlow() {
        const glowGeometry = new THREE.PlaneGeometry(5, 1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x3333ff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.05;
        this.logoGroup.add(glow);

        // Position the logo on the back wall
        this.logoGroup.position.set(0, 8, -9.85);
    }
}
