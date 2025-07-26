import * as THREE from 'three';

class QuantumFractalVisualizer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        this.params = {
            iterations: 128,
            zoom: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            colorScheme: 'quantum',
            animationSpeed: 1.0,
            quantumPhase: 0.0,
            dimensionShift: 2.0,
            rotationSpeed: 0.01
        };
        
        this.init();
        this.updateUI();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        this.camera.position.z = 2;
        
        const geometry = new THREE.PlaneGeometry(4, 4);
        
        // Inline shaders to avoid import issues
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            
            uniform float time;
            uniform vec2 resolution;
            uniform float iterations;
            uniform float zoom;
            uniform vec2 offset;
            uniform int colorScheme;
            uniform float quantumPhase;
            uniform float dimensionShift;
            
            varying vec2 vUv;
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            float mandelbrot(vec2 c) {
                vec2 z = vec2(0.0);
                
                for (float i = 0.0; i < 256.0; i++) {
                    if (i >= iterations) break;
                    
                    float x2 = z.x * z.x;
                    float y2 = z.y * z.y;
                    
                    if (x2 + y2 > 4.0) {
                        // Smooth coloring
                        float log_zn = log(x2 + y2) / 2.0;
                        float nu = log(log_zn / log(2.0)) / log(2.0);
                        return (i - nu) / iterations;
                    }
                    
                    z = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
                }
                
                return 0.0;
            }
            
            vec3 getColor(float value) {
                if (colorScheme == 0) {
                    // Quantum colors
                    vec3 a = vec3(0.5, 0.5, 0.5);
                    vec3 b = vec3(0.5, 0.5, 0.5);
                    vec3 c = vec3(1.0, 1.0, 1.0);
                    vec3 d = vec3(0.263, 0.416, 0.557);
                    return a + b * cos(6.28318 * (c * value + d));
                } else if (colorScheme == 1) {
                    // Fire
                    return mix(
                        vec3(0.0, 0.0, 0.0),
                        mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), value),
                        smoothstep(0.0, 0.5, value)
                    );
                } else if (colorScheme == 2) {
                    // Ice
                    return mix(vec3(0.0, 0.1, 0.3), vec3(0.7, 0.9, 1.0), value);
                } else {
                    // Matrix
                    return vec3(0.0, value, 0.0);
                }
            }
            
            void main() {
                vec2 coord = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * 4.0;
                coord = coord / zoom + offset;
                
                // Rotate based on time
                float angle = quantumPhase + time * 0.1;
                float cs = cos(angle * 0.1);
                float sn = sin(angle * 0.1);
                coord = vec2(coord.x * cs - coord.y * sn, coord.x * sn + coord.y * cs);
                
                float value = mandelbrot(coord);
                
                vec3 color = getColor(value);
                
                // Add some glow
                color += vec3(0.1, 0.2, 0.3) * exp(-value * 2.0) * 0.5;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                iterations: { value: this.params.iterations },
                zoom: { value: this.params.zoom },
                offset: { value: new THREE.Vector2(this.params.offsetX, this.params.offsetY) },
                colorScheme: { value: 0 },
                quantumPhase: { value: this.params.quantumPhase },
                dimensionShift: { value: this.params.dimensionShift }
            },
            vertexShader,
            fragmentShader
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
        
        // Event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        this.mouseDown = false;
        this.lastMouse = { x: 0, y: 0 };
        window.addEventListener('mousedown', () => this.mouseDown = true);
        window.addEventListener('mouseup', () => this.mouseDown = false);
        
        // Add simple controls
        this.addControls();
    }
    
    addControls() {
        const controlsDiv = document.getElementById('controls');
        controlsDiv.style.background = 'rgba(0,0,0,0.7)';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.borderRadius = '5px';
        
        controlsDiv.innerHTML = `
            <style>
                #controls label { color: white; display: block; margin: 5px 0; }
                #controls input { width: 100px; }
                #controls select { width: 100px; }
            </style>
            <label>Iterations: <input type="range" id="ctrl-iterations" min="10" max="256" value="${this.params.iterations}"></label>
            <label>Zoom: <input type="range" id="ctrl-zoom" min="0.1" max="100" step="0.1" value="${this.params.zoom}"></label>
            <label>Speed: <input type="range" id="ctrl-speed" min="0" max="5" step="0.1" value="${this.params.animationSpeed}"></label>
            <label>Color: <select id="ctrl-color">
                <option value="0">Quantum</option>
                <option value="1">Fire</option>
                <option value="2">Ice</option>
                <option value="3">Matrix</option>
            </select></label>
        `;
        
        // Add event listeners
        document.getElementById('ctrl-iterations').addEventListener('input', (e) => {
            this.params.iterations = parseFloat(e.target.value);
            this.material.uniforms.iterations.value = this.params.iterations;
            document.getElementById('iterations').textContent = this.params.iterations;
        });
        
        document.getElementById('ctrl-zoom').addEventListener('input', (e) => {
            this.params.zoom = parseFloat(e.target.value);
            this.material.uniforms.zoom.value = this.params.zoom;
        });
        
        document.getElementById('ctrl-speed').addEventListener('input', (e) => {
            this.params.animationSpeed = parseFloat(e.target.value);
        });
        
        document.getElementById('ctrl-color').addEventListener('change', (e) => {
            this.material.uniforms.colorScheme.value = parseInt(e.target.value);
        });
    }
    
    updateUI() {
        document.getElementById('iterations').textContent = this.params.iterations;
        document.getElementById('dimension').textContent = this.params.dimensionShift.toFixed(3);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
    
    onWheel(event) {
        event.preventDefault();
        const zoomSpeed = 0.001;
        this.params.zoom *= 1 + event.deltaY * zoomSpeed;
        this.params.zoom = Math.max(0.1, Math.min(1000, this.params.zoom));
        this.material.uniforms.zoom.value = this.params.zoom;
        document.getElementById('ctrl-zoom').value = this.params.zoom;
    }
    
    onMouseMove(event) {
        if (this.mouseDown) {
            const deltaX = event.clientX - this.lastMouse.x;
            const deltaY = event.clientY - this.lastMouse.y;
            
            this.params.offsetX -= deltaX / window.innerWidth / this.params.zoom * 4;
            this.params.offsetY += deltaY / window.innerHeight / this.params.zoom * 4;
            
            this.material.uniforms.offset.value.set(this.params.offsetX, this.params.offsetY);
        }
        
        this.lastMouse.x = event.clientX;
        this.lastMouse.y = event.clientY;
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        this.material.uniforms.time.value = time * this.params.animationSpeed;
        
        this.mesh.rotation.z += this.params.rotationSpeed * this.params.animationSpeed;
        
        this.params.quantumPhase += 0.01 * this.params.animationSpeed;
        this.material.uniforms.quantumPhase.value = this.params.quantumPhase;
        
        this.renderer.render(this.scene, this.camera);
        
        const fps = Math.round(1 / delta);
        document.getElementById('fps').textContent = fps;
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new QuantumFractalVisualizer());
} else {
    new QuantumFractalVisualizer();
}