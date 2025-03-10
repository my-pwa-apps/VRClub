import { NPCManager } from '../../scripts/npc/NPCManager.js';

export class CharacterSystem {
    constructor(scene) {
        this.scene = scene;
        this.npcManager = null;
    }

    async init() {
        this.npcManager = new NPCManager(this.scene);
        await this.npcManager.initialize(25);
    }

    update(delta) {
        if (this.npcManager) {
            this.npcManager.update(delta);
        }
    }
}
