import { NPC } from './NPC.js';
import { BehaviorSystem } from './BehaviorSystem.js';
import { AnimationSystem } from './AnimationSystem.js';
import * as THREE from 'three';

export class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
        this.behaviorSystem = new BehaviorSystem();
        this.animationSystem = new AnimationSystem();
        this.areas = {
            dancefloor: new THREE.Box3(
                new THREE.Vector3(-4, 0, -4),
                new THREE.Vector3(4, 2, 4)
            ),
            bar: new THREE.Box3(
                new THREE.Vector3(-7, 0, 5),
                new THREE.Vector3(-3, 2, 8)
            )
        };
    }

    async initialize(count = 25) {
        // Create NPCs with different behaviors
        const dancefloorCount = Math.floor(count * 0.6);
        const barCount = count - dancefloorCount;

        // Create dancing NPCs
        for (let i = 0; i < dancefloorCount; i++) {
            const npc = await this.createNPC('dancing');
            this.positionNPCInArea(npc, this.areas.dancefloor);
            this.npcs.push(npc);
        }

        // Create socializing NPCs
        for (let i = 0; i < barCount; i++) {
            const npc = await this.createNPC('socializing');
            this.positionNPCInArea(npc, this.areas.bar);
            this.npcs.push(npc);
        }
    }

    update(deltaTime) {
        this.npcs.forEach(npc => {
            this.behaviorSystem.update(npc, deltaTime);
            this.animationSystem.update(npc, deltaTime);
            this.updateLighting(npc);
        });
    }

    updateLighting(npc) {
        // Add subtle rim lighting to make NPCs visible in dark
        if (!npc.rimLight) {
            const rimLight = new THREE.PointLight(0x6666ff, 0.2, 0.5);
            npc.add(rimLight);
            rimLight.position.set(0, 1, -0.2);
            npc.rimLight = rimLight;
        }
    }

    positionNPCInArea(npc, area) {
        const randomX = area.min.x + Math.random() * (area.max.x - area.min.x);
        const randomZ = area.min.z + Math.random() * (area.max.z - area.min.z);
        npc.position.set(randomX, 0, randomZ);
    }
}
