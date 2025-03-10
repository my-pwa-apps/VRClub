import * as THREE from 'three';
import { NPC } from './NPC.js';
import { BehaviorSystem } from './BehaviorSystem.js';
import { AnimationSystem } from './AnimationSystem.js';

export class NPCManager {
    constructor(scene) {
        if (!scene) {
            throw new Error("Scene is required for NPCManager");
        }
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
        try {
            // Create NPCs with different behaviors
            const dancefloorCount = Math.floor(count * 0.6);
            const barCount = count - dancefloorCount;

            // Create dancing NPCs
            for (let i = 0; i < dancefloorCount; i++) {
                const npc = new NPC('dancing');
                await npc.initialize();
                this.positionNPCInArea(npc, this.areas.dancefloor);
                this.npcs.push(npc);
                this.scene.add(npc);  // This line was causing the error
            }

            // Create socializing NPCs
            for (let i = 0; i < barCount; i++) {
                const npc = new NPC('socializing');
                await npc.initialize();
                this.positionNPCInArea(npc, this.areas.bar);
                this.npcs.push(npc);
                this.scene.add(npc);
            }
        } catch (error) {
            console.error('Error initializing NPCs:', error);
            throw error;
        }
    }

    positionNPCInArea(npc, area) {
        // ...implementation for positioning NPC in area based on some logic...
    }
}
