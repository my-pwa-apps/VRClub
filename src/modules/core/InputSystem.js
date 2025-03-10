import * as THREE from 'three';

export class InputSystem {
    constructor(camera) {
        this.camera = camera;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
    }

    init() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update(delta) {
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 0.04;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 0.04;

        this.velocity.multiplyScalar(0.9);
        
        this.camera.position.x += this.velocity.x;
        this.camera.position.z += this.velocity.z;

        // Collision detection with walls
        if (this.camera.position.x > 9.5) this.camera.position.x = 9.5;
        if (this.camera.position.x < -9.5) this.camera.position.x = -9.5;
        if (this.camera.position.z < -9.5) this.camera.position.z = -9.5;
        if (this.camera.position.z > 9.5) this.camera.position.z = 9.5;
    }
}
