export const shaderCode = {
    vertex: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    fragment: `
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
            float n = 0.0;
            
            for (float i = 0.0; i < 256.0; i++) {
                if (i >= iterations) break;
                
                float x2 = z.x * z.x;
                float y2 = z.y * z.y;
                
                if (x2 + y2 > 4.0) {
                    return i / iterations;
                }
                
                z = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
                n = i;
            }
            
            return 0.0;
        }
        
        void main() {
            vec2 coord = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * 4.0;
            coord = coord / zoom + offset;
            
            float value = mandelbrot(coord);
            
            // Simple color mapping
            vec3 color;
            if (colorScheme == 0) {
                // Quantum colors
                color = hsv2rgb(vec3(value * 0.8 + time * 0.05, 0.8, 1.0 - value * 0.5));
            } else {
                // Basic gradient
                color = vec3(value);
            }
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};