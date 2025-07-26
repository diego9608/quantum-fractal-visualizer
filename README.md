# Quantum Fractal Visualizer

A revolutionary WebGL-based fractal visualization system that combines quantum mechanics principles with chaos theory to generate infinite, evolving mathematical patterns.

## Features

- **Quantum-Inspired Fractals**: Implements quantum superposition and phase collapse in fractal generation
- **Multiple Fractal Types**: Mandelbrot, Julia, Burning Ship, Tricorn, and Quantum Hybrid
- **Real-time WebGL Rendering**: Hardware-accelerated visualization with custom GLSL shaders
- **Audio Reactive Mode**: Fractals respond to microphone input with frequency analysis
- **Interactive Controls**: Zoom, pan, and adjust parameters in real-time
- **Dynamic Color Schemes**: Quantum, Fire, Ice, Cosmic, and Matrix themes
- **Chaos Theory Integration**: Lorenz, Rössler, and Chua attractors influence patterns

## Technology Stack

- **Three.js**: 3D graphics and WebGL abstraction
- **GLSL Shaders**: Custom vertex and fragment shaders for GPU computation
- **Tone.js**: Audio processing and analysis
- **dat.GUI**: Real-time parameter control interface
- **Vite**: Modern build tool for fast development

## Mathematical Foundation

The visualizer implements several fractal equations:

1. **Mandelbrot Set**: z(n+1) = z(n)² + c
2. **Julia Set**: Similar iteration with fixed c parameter
3. **Quantum Hybrid**: Introduces probabilistic phase collapse and dimensional shifts
4. **Chaos Attractors**: Differential equations creating strange attractors

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan across the fractal space
- **GUI Panel**: Adjust iterations, colors, quantum parameters
- **Audio Toggle**: Enable microphone input for reactive visuals

## Quantum Features

- **Superposition**: Multiple fractal states exist simultaneously
- **Phase Collapse**: Probabilistic transitions between states
- **Dimensional Shift**: Non-integer dimensional exploration (1.5 - 3.0)
- **Entanglement**: Cross-parameter quantum correlations

## Performance

- Optimized GLSL shaders for real-time rendering
- Adaptive quality based on performance metrics
- Smooth parameter interpolation
- 60 FPS target with dynamic adjustment

## License

MIT License - Free for all creative and educational use