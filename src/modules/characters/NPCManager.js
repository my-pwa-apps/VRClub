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

    async initialize(count = 10) {  // Reduce count for better performance
        try {
            console.log(`🧍 Creating ${count} NPCs...`);
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
                
                // Add debug visualization
                this.addDebugVisualization(npc, 0xff0000);
            }

            // Create socializing NPCs
            for (let i = 0; i < barCount; i++) {
                const npc = new NPC('socializing');
                await npc.initialize();
                this.positionNPCInArea(npc, this.areas.bar);
                this.npcs.push(npc);
                this.scene.add(npc);
                
                // Add debug visualization
                this.addDebugVisualization(npc, 0x00ff00);
            }
            
            console.log(`✅ Created ${this.npcs.length} NPCs`);
        } catch (error) {
            console.error('❌ Error initializing NPCs:', error);
            throw error;
        }
    }

    addDebugVisualization(npc, color) {
        // Add a bright colored sphere above the NPC for easier visibility
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: color })
        );
        marker.position.y = 2.0; // Above head
        npc.add(marker);
        
        // Add stronger point light to make NPC visible
        const light = new THREE.PointLight(color, 1, 3);
        light.position.y = 1.0;
        npc.add(light);
    }

    positionNPCInArea(npc, area) {
        // ...implementation for positioning NPC in area based on some logic...
    }

    update(deltaTime) {
        this.npcs.forEach(npc => {
            if (npc.mixer) {
                npc.mixer.update(deltaTime);
            }
            
            if (this.behaviorSystem) {
                this.behaviorSystem.update(npc, deltaTime);
            }
            
            this.updateLighting(npc);
        });
    }

    updateLighting(npc) {
        // Add brighter rim lighting to make NPCs more visible in dark
        if (!npc.rimLight) {
            const rimLight = new THREE.PointLight(0xffffff, 0.5, 1); // Increased intensity
            npc.add(rimLight);
            rimLight.position.set(0, 1, -0.2);
            npc.rimLight = rimLight;
        }
    }
}
