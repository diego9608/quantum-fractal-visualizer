import * as THREE from 'three';

class SimpleFractalVisualizer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        this.init();
        this.animate();
    }
    
    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Camera setup
        this.camera.position.z = 1;
        
        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(4, 4);
        
        // Simple working shader
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            varying vec2 vUv;
            uniform float time;
            uniform vec2 resolution;
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void main() {
                // Map to complex plane
                vec2 c = (vUv - 0.5) * 3.0;
                c.x *= resolution.x / resolution.y;
                
                // Simple mandelbrot
                vec2 z = vec2(0.0);
                float iter = 0.0;
                
                for (int i = 0; i < 100; i++) {
                    float x2 = z.x * z.x;
                    float y2 = z.y * z.y;
                    
                    if (x2 + y2 > 4.0) break;
                    
                    z = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
                    iter += 1.0;
                }
                
                // Color
                float t = iter / 100.0;
                vec3 color = hsv2rgb(vec3(t * 0.8 + time * 0.05, 0.8, 1.0 - t * 0.5));
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader,
            fragmentShader
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        });
        
        // Update UI
        document.getElementById('iterations').textContent = '100';
        document.getElementById('dimension').textContent = '2.000';
        
        console.log('Simple fractal visualizer initialized');
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        this.material.uniforms.time.value = time;
        
        this.renderer.render(this.scene, this.camera);
        
        // Update FPS
        const fps = Math.round(1 / this.clock.getDelta());
        document.getElementById('fps').textContent = fps;
    }
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SimpleFractalVisualizer());
} else {
    new SimpleFractalVisualizer();
}