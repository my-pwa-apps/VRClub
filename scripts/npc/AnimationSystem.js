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

    // Additional helper methods for other animations...
    // ...existing code...
}
