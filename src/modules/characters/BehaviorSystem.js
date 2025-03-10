export class BehaviorSystem {
    transitionState(npc) {
        const currentState = this.states[npc.behavior.currentState];
        const nextState = currentState.transitions[
            Math.floor(Math.random() * currentState.transitions.length)
        ];
        
        npc.behavior.currentState = nextState;
        npc.behavior.timeInState = 0;
        npc.behavior.nextStateChange = 
            Math.random() * 
            (this.states[nextState].duration.max - this.states[nextState].duration.min) +
            this.states[nextState].duration.min;
    }

    updateBehavior(npc, deltaTime) {
        switch (npc.behavior.currentState) {
            case 'dancing':
                this.updateDancing(npc, deltaTime);
                break;
            case 'socializing':
                this.updateSocializing(npc, deltaTime);
                break;
            case 'drinking':
                this.updateDrinking(npc, deltaTime);
                break;
        }
    }

    updateDancing(npc, deltaTime) {
        // Apply dancing animation weight
        if (npc.mixer && npc.actions.dancing) {
            npc.actions.dancing.weight = 1.0;
            npc.actions.socializing.weight = 0.0;
            npc.actions.idle.weight = 0.2;
        }
    }

    updateSocializing(npc, deltaTime) {
        // Apply socializing animation weight
        if (npc.mixer && npc.actions.socializing) {
            npc.actions.dancing.weight = 0.0;
            npc.actions.socializing.weight = 1.0;
            npc.actions.idle.weight = 0.3;
        }
    }

    updateDrinking(npc, deltaTime) {
        // Apply drinking animation blend
        if (npc.mixer && npc.actions.idle) {
            npc.actions.dancing.weight = 0.0;
            npc.actions.socializing.weight = 0.3;
            npc.actions.idle.weight = 1.0;
        }
    }
}
