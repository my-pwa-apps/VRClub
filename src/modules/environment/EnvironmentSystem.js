import { ClubStructure } from './ClubStructure.js';
import { DJBooth } from './DJBooth.js';
import { Bar } from './Bar.js';
import { Logo } from './Logo.js';

export class EnvironmentSystem {
    constructor(scene) {
        this.scene = scene;
        this.elements = new Map();
    }

    async init() {
        this.elements.set('structure', new ClubStructure(this.scene));
        this.elements.set('djbooth', new DJBooth(this.scene));
        this.elements.set('bar', new Bar(this.scene));
        this.elements.set('logo', new Logo(this.scene));

        for (const element of this.elements.values()) {
            await element.init();
        }
    }

    update(time) {
        for (const element of this.elements.values()) {
            // Only call update if the element has an update method
            if (element.update && typeof element.update === 'function') {
                element.update(time);
            }
        }
    }
}
