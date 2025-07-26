import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { QuantumFractalEngine } from './quantum-fractal-engine.js';
import { AudioReactive } from './audio-reactive.js';
import { shaderCode } from './shaders-simple.js';

class QuantumFractalVisualizer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        this.fractalEngine = new QuantumFractalEngine();
        this.audioReactive = new AudioReactive();
        
        this.params = {
            iterations: 128,
            zoom: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            colorScheme: 'quantum',
            animationSpeed: 1.0,
            audioReactive: false,
            fractalType: 'mandelbrot',
            quantumPhase: 0.0,
            dimensionShift: 2.0,
            chaosParameter: 1.5,
            symmetry: 4,
            rotationSpeed: 0.01
        };
        
        this.init();
        this.setupGUI();
        this.updateUI();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        this.camera.position.z = 2;
        
        const geometry = new THREE.PlaneGeometry(4, 4, 512, 512);
        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                iterations: { value: this.params.iterations },
                zoom: { value: this.params.zoom },
                offset: { value: new THREE.Vector2(this.params.offsetX, this.params.offsetY) },
                colorScheme: { value: 0 },
                quantumPhase: { value: this.params.quantumPhase },
                dimensionShift: { value: this.params.dimensionShift },
                chaosParameter: { value: this.params.chaosParameter },
                audioLevel: { value: 0.0 }
            },
            vertexShader: shaderCode.vertex,
            fragmentShader: shaderCode.fragment,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        this.mouseDown = false;
        this.lastMouse = { x: 0, y: 0 };
        window.addEventListener('mousedown', () => this.mouseDown = true);
        window.addEventListener('mouseup', () => this.mouseDown = false);
    }
    
    setupGUI() {
        const gui = new GUI({ autoPlace: false });
        document.getElementById('controls').appendChild(gui.domElement);
        
        gui.add(this.params, 'iterations', 1, 512, 1).onChange(v => {
            this.material.uniforms.iterations.value = v;
            document.getElementById('iterations').textContent = v;
        });
        
        gui.add(this.params, 'zoom', 0.1, 100).onChange(v => {
            this.material.uniforms.zoom.value = v;
        });
        
        gui.add(this.params, 'animationSpeed', 0, 5);
        
        gui.add(this.params, 'fractalType', ['mandelbrot', 'julia', 'burning-ship', 'tricorn', 'quantum-hybrid'])
            .onChange(v => this.fractalEngine.setType(v));
        
        gui.add(this.params, 'colorScheme', ['quantum', 'fire', 'ice', 'cosmic', 'matrix'])
            .onChange(v => {
                const schemes = { quantum: 0, fire: 1, ice: 2, cosmic: 3, matrix: 4 };
                this.material.uniforms.colorScheme.value = schemes[v];
            });
        
        gui.add(this.params, 'quantumPhase', 0, Math.PI * 2).onChange(v => {
            this.material.uniforms.quantumPhase.value = v;
        });
        
        gui.add(this.params, 'dimensionShift', 1.5, 3.0, 0.001).onChange(v => {
            this.material.uniforms.dimensionShift.value = v;
            document.getElementById('dimension').textContent = v.toFixed(3);
        });
        
        gui.add(this.params, 'chaosParameter', 0.1, 3.0).onChange(v => {
            this.material.uniforms.chaosParameter.value = v;
        });
        
        gui.add(this.params, 'audioReactive').onChange(async v => {
            if (v) {
                await this.audioReactive.init();
                this.audioReactive.start();
            } else {
                this.audioReactive.stop();
            }
        });
        
        gui.add(this.params, 'rotationSpeed', -0.1, 0.1);
        gui.add(this.params, 'symmetry', 1, 12, 1);
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
        const zoomSpeed = 0.001;
        this.params.zoom *= 1 + event.deltaY * zoomSpeed;
        this.params.zoom = Math.max(0.1, Math.min(1000, this.params.zoom));
        this.material.uniforms.zoom.value = this.params.zoom;
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
        
        if (this.params.audioReactive && this.audioReactive.isActive) {
            const audioData = this.audioReactive.getFrequencyData();
            this.material.uniforms.audioLevel.value = this.audioReactive.getAverageVolume();
            this.material.uniforms.frequencyData.value = audioData;
        }
        
        this.mesh.rotation.z += this.params.rotationSpeed;
        
        this.params.quantumPhase += 0.01 * this.params.animationSpeed;
        this.material.uniforms.quantumPhase.value = this.params.quantumPhase;
        
        this.renderer.render(this.scene, this.camera);
        
        const fps = Math.round(1 / delta);
        document.getElementById('fps').textContent = fps;
    }
}

new QuantumFractalVisualizer();