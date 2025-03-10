import * as THREE from 'three';

export class ResourceManager {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = new Map();
        this.loadingPromises = new Map();
    }

    async loadTexture(url, options = {}) {
        if (this.loadedTextures.has(url)) {
            return this.loadedTextures.get(url);
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const loadPromise = new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    if (options.repeat) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(...options.repeat);
                    }
                    this.loadedTextures.set(url, texture);
                    this.loadingPromises.delete(url);
                    resolve(texture);
                },
                undefined,
                reject
            );
        });

        this.loadingPromises.set(url, loadPromise);
        return loadPromise;
    }

    dispose() {
        this.loadedTextures.forEach(texture => texture.dispose());
        this.loadedTextures.clear();
        this.loadingPromises.clear();
    }
}
