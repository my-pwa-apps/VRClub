import * as THREE from 'three';

export const LightingPatterns = {
    patterns: [
        {
            name: "SynchronizedWave",
            update: (time, lights) => {
                const wavePos = Math.sin(time) * 5;
                lights.forEach(lightObj => {
                    if (!lightObj.type) {
                        lightObj.light.target.position.x = wavePos;
                        if (lightObj.beam) {
                            lightObj.beam.position.copy(lightObj.light.position);
                            lightObj.beam.lookAt(lightObj.light.target.position);
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
                        if (!lightObj.type) {
                            lightObj.light.intensity = intensity;
                            if (lightObj.beam) {
                                lightObj.beam.material.opacity = intensity * 0.1;
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
                    if (!lightObj.type) {
                        const angle = time * 2 + (i * Math.PI / 2);
                        const position = new THREE.Vector3(
                            Math.sin(angle) * 5,
                            0,
                            Math.cos(angle) * 5
                        );
                        lightObj.light.target.position.copy(position);
                        if (lightObj.beam) {
                            lightObj.beam.position.copy(lightObj.light.position);
                            lightObj.beam.lookAt(position);
                        }
                    }
                });
            }
        }
    ]
};
