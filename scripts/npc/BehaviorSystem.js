export class BehaviorSystem {
    constructor() {
        this.states = {
            dancing: {
                duration: { min: 30, max: 120 },
                transitions: ['socializing', 'drinking']
            },
            socializing: {
                duration: { min: 20, max: 60 },
                transitions: ['dancing', 'drinking']
            },
            drinking: {
                duration: { min: 5, max: 15 },
                transitions: ['dancing', 'socializing']
            }
        };
    }

    update(npc, deltaTime) {
        npc.behavior.timeInState += deltaTime;

        // Check for state transitions
        if (npc.behavior.timeInState >= npc.behavior.nextStateChange) {
            this.transitionState(npc);
        }

        // Update current behavior
        this.updateBehavior(npc, deltaTime);
    }

    // ... implementation of helper methods
}
