// VRButton module
// Download from: https://cdn.jsdelivr.net/npm/three@0.147.0/examples/jsm/webxr/VRButton.js

import * as THREE from './three.module.js';

// VRButton implementation
export const VRButton = {
  createButton(renderer) {
    const button = document.createElement('button');
    button.style.display = 'block';
    button.style.padding = '12px';
    button.style.border = '1px solid #fff';
    button.style.borderRadius = '4px';
    button.style.background = 'rgba(0,0,0,0.1)';
    button.style.color = '#fff';
    button.style.font = 'normal 13px sans-serif';
    button.textContent = 'ENTER VR';
    
    // Add actual VR functionality here
    
    return button;
  }
};
