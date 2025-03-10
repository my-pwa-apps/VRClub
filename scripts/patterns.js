import * as THREE from 'three';

export const LightingPatterns = {
    patterns: [
        {
            name: "SynchronizedWave",
            update: (time, lights) => {
                const wavePos = Math.sin(time) * 5;
                lights.forEach(lightObj => {
                    if (lightObj.light && !lightObj.type) {
                        // Update spotlight target
                        lightObj.light.target.position.x = wavePos;
                        
                        // Update beam direction to follow target
                        if (lightObj.beam) {
                            // Calculate direction vector from light to target
                            const targetVector = new THREE.Vector3()
                                .subVectors(lightObj.light.target.position, lightObj.light.position)
                                .normalize();
                            
                            // Set beam rotation based on target direction
                            lightObj.beam.lookAt(
                                lightObj.light.position.x + targetVector.x * 10,
                                lightObj.light.position.y + targetVector.y * 10,
                                lightObj.light.position.z + targetVector.z * 10
                            );
                        }
                    }
                });
            }
        },
        {
            name: "RandomStrobe",
            update: (time, lights) => {
                if (Math.random() > 0.9) {
                    const intensity = Math.random() * 3;
                    lights.forEach(lightObj => {
                        if (lightObj.light && !lightObj.type) {
                            // Update spotlight intensity
                            lightObj.light.intensity = intensity;
                            
                            // Update beam intensity
                            if (lightObj.beam) {
                                lightObj.beam.children.forEach(child => {
                                    if (child.material) {
                                        child.material.opacity = intensity * 0.1;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        },
        {
            name: "CircularChase",
            update: (time, lights) => {
                lights.forEach((lightObj, i) => {
                    if (lightObj.light && !lightObj.type) {
                        const angle = time * 2 + (i * Math.PI / 2);
                        const x = Math.sin(angle) * 5;
                        const z = Math.cos(angle) * 5;
                        
                        // Update spotlight target
                        lightObj.light.target.position.set(x, 0, z);
                        
                        // Update beam direction to follow target
                        if (lightObj.beam) {
                            // Calculate direction vector from light to target
                            const targetVector = new THREE.Vector3()
                                .subVectors(lightObj.light.target.position, lightObj.light.position)
                                .normalize();
                            
                            // Set beam rotation based on target direction
                            lightObj.beam.lookAt(
                                lightObj.light.position.x + targetVector.x * 10,
                                lightObj.light.position.y + targetVector.y * 10,
                                lightObj.light.position.z + targetVector.z * 10
                            );
                        }
                    }
                });
            }
        }
    ]
};
