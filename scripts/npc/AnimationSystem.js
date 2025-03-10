import * as THREE from 'three';

export class AnimationSystem {
    constructor() {
        this.animations = {
            dancing: [
                this.createDanceAnimation('dance1', 128),
                this.createDanceAnimation('dance2', 130),
                this.createDanceAnimation('dance3', 126)
            ],
            socializing: [
                this.createSocialAnimation('talking'),
                this.createSocialAnimation('gesturing'),
                this.createSocialAnimation('laughing')
            ],
            idle: this.createIdleAnimation()
        };
    }

    createDanceAnimation(name, bpm) {
        // Create realistic dance moves synced to music BPM
        const keyframes = this.generateDanceKeyframes(bpm);
        return new THREE.AnimationClip(name, keyframes);
    }

    generateDanceKeyframes(bpm) {
        const duration = 60 / bpm; // Duration of one beat in seconds
        const totalDuration = duration * 4; // Four beats per sequence
        const fps = 30;
        const frameCount = Math.floor(totalDuration * fps);

        // Create keyframe tracks for different body parts
        const tracks = [];

        // Body movement (up/down bounce)
        const bodyPositions = [];
        const bodyTimes = [];
        
        for (let i = 0; i <= frameCount; i++) {
            const time = (i / frameCount) * totalDuration;
            const beat = (time / duration) % 1;
            
            // Bouncing motion synchronized with beat
            const y = Math.sin(beat * Math.PI * 2) * 0.1;
            bodyPositions.push(0, y, 0);
            bodyTimes.push(time);
        }

        tracks.push(
            new THREE.VectorKeyframeTrack(
                '.position',
                bodyTimes,
                bodyPositions
            )
        );

        // Arms movement
        const armRotations = [];
        const armTimes = [];

        for (let i = 0; i <= frameCount; i++) {
            const time = (i / frameCount) * totalDuration;
            const beat = (time / duration) % 1;
            
            // Arm swaying motion
            const rotation = Math.sin(beat * Math.PI * 2) * 0.3;
            armRotations.push(0, 0, rotation);
            armTimes.push(time);
        }

        tracks.push(
            new THREE.VectorKeyframeTrack(
                '.children[2].rotation', // Left arm
                armTimes,
                armRotations
            ),
            new THREE.VectorKeyframeTrack(
                '.children[3].rotation', // Right arm
                armTimes,
                armRotations.map(x => -x) // Opposite rotation for right arm
            )
        );

        // Hip movement
        const hipRotations = [];
        const hipTimes = [];

        for (let i = 0; i <= frameCount; i++) {
            const time = (i / frameCount) * totalDuration;
            const beat = (time / duration) % 1;
            
            // Hip swaying motion
            const rotation = Math.sin(beat * Math.PI * 2) * 0.15;
            hipRotations.push(0, rotation, 0);
            hipTimes.push(time);
        }

        tracks.push(
            new THREE.VectorKeyframeTrack(
                '.rotation',
                hipTimes,
                hipRotations
            )
        );

        // Head bobbing
        const headRotations = [];
        const headTimes = [];

        for (let i = 0; i <= frameCount; i++) {
            const time = (i / frameCount) * totalDuration;
            const beat = (time / duration) % 1;
            
            // Head bobbing motion
            const rotation = Math.sin(beat * Math.PI * 2) * 0.1;
            headRotations.push(rotation, 0, 0);
            headTimes.push(time);
        }

        tracks.push(
            new THREE.VectorKeyframeTrack(
                '.children[0].rotation', // Head
                headTimes,
                headRotations
            )
        );

        return tracks;
    }

    createSocialAnimation(type) {
        // Create social interaction animations
        const duration = 2;
        const fps = 30;
        const frameCount = duration * fps;
        const tracks = [];

        switch (type) {
            case 'talking':
                // Add head movement and arm gestures
                tracks.push(this.generateTalkingHeadMovement(duration, fps));
                tracks.push(this.generateTalkingArmGestures(duration, fps));
                break;
            case 'gesturing':
                // Add more pronounced arm movements
                tracks.push(this.generateGesturingArms(duration, fps));
                break;
            case 'laughing':
                // Add head tilt back and body shake
                tracks.push(this.generateLaughingAnimation(duration, fps));
                break;
        }

        return new THREE.AnimationClip(type, duration, tracks);
    }

    createIdleAnimation() {
        // Create subtle idle movement
        const duration = 3;
        const fps = 30;
        const frameCount = duration * fps;
        const tracks = [];

        // Add subtle weight shifting and breathing
        tracks.push(this.generateIdleBodyMovement(duration, fps));
        tracks.push(this.generateBreathingMotion(duration, fps));

        return new THREE.AnimationClip('idle', duration, tracks);
    }

    // Helper method to generate talking head movement
    generateTalkingHeadMovement(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            // Small random head movements
            values.push(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                0
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.children[0].rotation',
            times,
            values
        );
    }

    generateTalkingArmGestures(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            
            // Subtle arm movement during talking
            const phase = (i / frameCount) * Math.PI * 2;
            const rightArmRotation = Math.sin(phase) * 0.2;
            const leftArmRotation = Math.sin(phase + Math.PI * 0.5) * 0.15;
            
            // Right arm values
            values.push(
                rightArmRotation,  // X rotation
                0,                 // Y rotation
                Math.PI / 4        // Z rotation base pose
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.children[3].rotation', // Right arm node
            times,
            values
        );
    }

    generateGesturingArms(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            
            // More pronounced arm movements for gesturing
            const phase = (i / frameCount) * Math.PI * 2;
            const armRotation = Math.sin(phase) * 0.5;
            
            values.push(
                armRotation,    // X rotation
                0,             // Y rotation
                Math.PI / 3    // Z rotation base pose
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.children[2].rotation', // Left arm node
            times,
            values
        );
    }

    generateLaughingAnimation(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            
            // Body shaking for laugh
            const phase = (i / frameCount) * Math.PI * 4; // Faster oscillation
            const shakeAmount = Math.sin(phase) * 0.08;
            
            values.push(
                -0.2 + shakeAmount, // X rotation (lean back + shake)
                shakeAmount,        // Y rotation (side shake)
                0                   // Z rotation
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.rotation', // Body root rotation
            times,
            values
        );
    }

    generateIdleBodyMovement(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            
            // Subtle weight shifting
            const phase = (i / frameCount) * Math.PI * 2;
            const shift = Math.sin(phase) * 0.02;
            
            values.push(
                0,     // X position
                shift, // Y position (subtle up/down)
                0      // Z position
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.position',
            times,
            values
        );
    }

    generateBreathingMotion(duration, fps) {
        const times = [];
        const values = [];
        const frameCount = duration * fps;

        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
            
            // Subtle breathing motion
            const phase = (i / frameCount) * Math.PI * 2;
            const breathe = 1 + Math.sin(phase) * 0.02;
            
            values.push(
                1,       // X scale
                breathe, // Y scale (subtle expand/contract)
                1        // Z scale
            );
        }

        return new THREE.VectorKeyframeTrack(
            '.scale',
            times,
            values
        );
    }
}
