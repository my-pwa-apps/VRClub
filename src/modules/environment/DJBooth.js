import * as THREE from 'three';

export class DJBooth {
    constructor(scene) {
        this.scene = scene;
        this.booth = new THREE.Group();
    }

    init() {
        this.createPlatform();
        this.createEquipment();
        this.createLighting();
        this.scene.add(this.booth);
    }

    createPlatform() {
        // Main platform with raised design
        const platformGeometry = new THREE.BoxGeometry(6, 0.6, 3);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 0.3, -8);
        
        // Add raised back panel
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2, 0.1),
            platformMaterial
        );
        backPanel.position.set(0, 1.3, -9.4);
        
        this.booth.add(platform);
        this.booth.add(backPanel);
    }

    createEquipment() {
        // Add equipment desk
        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.1, 2),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.8,
                roughness: 0.1
            })
        );
        desk.position.set(0, 0.9, -8);
        this.booth.add(desk);
        
        // Add CDJs and mixer
        this.createCDJ(-1.2);  // Left CDJ
        this.createCDJ(1.2);   // Right CDJ
        this.createMixer(0);   // Center mixer
    }

    createLighting() {
        // Add focused lighting for the DJ booth
        const boothLight = new THREE.SpotLight(0xffffff, 1.2);
        boothLight.position.set(0, 5, -6);
        boothLight.target.position.set(0, 0, -8);
        boothLight.angle = Math.PI / 6;
        boothLight.penumbra = 0.3;
        
        this.booth.add(boothLight);
        this.booth.add(boothLight.target);
    }

    createCDJ(xPosition) {
        const cdj = new THREE.Group();
        
        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.1, 0.8),
            new THREE.MeshStandardMaterial({ 
                color: 0x111111,
                emissive: 0x222222,
                metalness: 0.8 
            })
        );
        
        // Display screen
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0x4444ff,
                emissive: 0x4444ff,
                emissiveIntensity: 0.5
            })
        );
        screen.rotation.x = -Math.PI / 2;
        screen.position.y = 0.051;
        screen.position.z = -0.2;
        
        // Jog wheel
        const jogWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.05, 20),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
        );
        jogWheel.rotation.x = Math.PI / 2;
        jogWheel.position.y = 0.05;
        
        cdj.add(body);
        cdj.add(screen);
        cdj.add(jogWheel);
        
        cdj.position.set(xPosition, 0.95, -8);
        this.booth.add(cdj);
    }

    createMixer(xPosition) {
        const mixer = new THREE.Group();
        
        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.1, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
        );
        
        // Add faders
        for (let i = 0; i < 4; i++) {
            const fader = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.02, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x999999 })
            );
            fader.position.set(0.1 + i * 0.2, 0.06, 0);
            mixer.add(fader);
        }
        
        mixer.add(body);
        mixer.position.set(xPosition, 0.95, -8);
        this.booth.add(mixer);
    }
}
