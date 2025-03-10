import * as THREE from 'three';

export class ClubStructure {
    constructor(scene) {
        this.scene = scene;
        this.materials = this.createMaterials();
    }

    async init() {
        this.createFloor();
        this.createWalls();
        this.createCeiling();
        await this.loadTextures();
    }

    createMaterials() {
        return {
            floor: new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.2,
                roughness: 0.8
            }),
            wall: new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.0,
                roughness: 1.0
            })
        };
    }

    createFloor() {
        // Main floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            this.materials.floor
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Dance floor with emissive material
        const danceFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                emissive: 0x111111,
                metalness: 0.7,
                roughness: 0.2,
                envMapIntensity: 1.5
            })
        );
        danceFloor.rotation.x = -Math.PI / 2;
        danceFloor.position.y = 0.01;
        this.scene.add(danceFloor);
    }

    createWalls() {
        const walls = [
            { size: [20, 10, 0.3], pos: [0, 5, -10] },
            { size: [0.3, 10, 20], pos: [-10, 5, 0] },
            { size: [0.3, 10, 20], pos: [10, 5, 0] }
        ];

        walls.forEach(wall => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...wall.size),
                this.materials.wall
            );
            mesh.position.set(...wall.pos);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
    }

    createCeiling() {
        const ceiling = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.3, 20),
            new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                emissive: 0x111111
            })
        );
        ceiling.position.set(0, 10, 0);
        this.scene.add(ceiling);
    }

    async loadTextures() {
        try {
            const textureLoader = new THREE.TextureLoader();
            const woodTexture = await textureLoader.loadAsync('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
            woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
            woodTexture.repeat.set(4, 4);
            this.materials.floor.map = woodTexture;
            this.materials.floor.needsUpdate = true;
        } catch (error) {
            console.warn('Could not load wood texture, using fallback:', error);
        }
    }
}
