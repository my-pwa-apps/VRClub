import * as THREE from 'three';
import { NPC } from './NPC.js';
import { BehaviorSystem } from './BehaviorSystem.js';
import { AnimationSystem } from './AnimationSystem.js';

export class NPCManager {
    constructor(areas, scene) {
        this.areas = areas;
        this.npcs = [];
        this.scene = scene;
    }

    //  ... existing methods ...

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
                this.scene.add(npc);
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
