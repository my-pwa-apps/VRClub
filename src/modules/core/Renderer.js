import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

export class Renderer {
    constructor(canvas) {
        // Check if canvas is a valid HTMLCanvasElement
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error("Invalid canvas provided to Renderer");
        }
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.setupRenderer();
        this.setupVR();
    }

    setupRenderer() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
    }

    setupVR() {
        this.renderer.xr.enabled = true;
        document.getElementById('vr-button').appendChild(VRButton.createButton(this.renderer));
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    setAnimationLoop(callback) {
        this.renderer.setAnimationLoop(callback);
    }
}
