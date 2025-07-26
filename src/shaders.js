export const shaderCode = {
    vertex: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
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
        uniform float chaosParameter;
        uniform float audioLevel;
        uniform float frequencyData[128];
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        vec2 complexMul(vec2 a, vec2 b) {
            return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
        }
        
        vec2 complexPow(vec2 z, float n) {
            float r = length(z);
            float theta = atan(z.y, z.x);
            float newR = pow(r, n);
            float newTheta = theta * n;
            return vec2(newR * cos(newTheta), newR * sin(newTheta));
        }
        
        float mandelbrot(vec2 c, float maxIter) {
            vec2 z = vec2(0.0);
            float n = 0.0;
            
            for (float i = 0.0; i < 512.0; i++) {
                if (i >= maxIter) break;
                
                z = complexMul(z, z) + c;
                
                if (dot(z, z) > 4.0) {
                    float smooth = i - log2(log2(dot(z, z))) + 4.0;
                    return smooth / maxIter;
                }
                n = i;
            }
            
            return 0.0;
        }
        
        float julia(vec2 z, vec2 c, float maxIter) {
            float n = 0.0;
            
            for (float i = 0.0; i < 512.0; i++) {
                if (i >= maxIter) break;
                
                z = complexMul(z, z) + c;
                
                if (dot(z, z) > 4.0) {
                    return i / maxIter;
                }
                n = i;
            }
            
            return 0.0;
        }
        
        float quantumFractal(vec2 c, float maxIter, float phase) {
            vec2 z = vec2(0.0);
            float n = 0.0;
            float quantumCollapse = 0.0;
            
            for (float i = 0.0; i < 512.0; i++) {
                if (i >= maxIter) break;
                
                float probability = sin(phase + i * 0.1) * 0.5 + 0.5;
                
                if (probability > 0.7) {
                    z += vec2(cos(phase), sin(phase)) * 0.1;
                    quantumCollapse = 1.0;
                }
                
                z = complexPow(z, dimensionShift) + c;
                
                if (quantumCollapse > 0.5) {
                    float angle = phase * 0.1;
                    float cs = cos(angle);
                    float sn = sin(angle);
                    z = vec2(z.x * cs - z.y * sn, z.x * sn + z.y * cs);
                }
                
                z *= (1.0 + sin(time * 0.5 + phase) * 0.1 * chaosParameter);
                
                if (dot(z, z) > 4.0) {
                    float smooth = i - log2(log2(dot(z, z))) + 4.0;
                    return smooth / maxIter;
                }
                n = i;
            }
            
            return 0.0;
        }
        
        vec3 getQuantumColor(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.263, 0.416, 0.557);
            
            vec3 color = a + b * cos(6.28318 * (c * t + d));
            
            color += vec3(sin(time * 2.0), cos(time * 3.0), sin(time * 5.0)) * 0.1;
            
            float pulse = sin(time * 10.0 + t * 20.0) * 0.1 + 0.9;
            color *= pulse;
            
            return color;
        }
        
        vec3 getFireColor(float t) {
            return mix(
                vec3(0.0, 0.0, 0.0),
                mix(
                    vec3(1.0, 0.0, 0.0),
                    mix(
                        vec3(1.0, 1.0, 0.0),
                        vec3(1.0, 1.0, 1.0),
                        smoothstep(0.6, 1.0, t)
                    ),
                    smoothstep(0.3, 0.6, t)
                ),
                smoothstep(0.0, 0.3, t)
            );
        }
        
        vec3 getIceColor(float t) {
            vec3 ice1 = vec3(0.0, 0.1, 0.3);
            vec3 ice2 = vec3(0.2, 0.5, 0.8);
            vec3 ice3 = vec3(0.7, 0.9, 1.0);
            vec3 ice4 = vec3(1.0, 1.0, 1.0);
            
            if (t < 0.33) return mix(ice1, ice2, t * 3.0);
            else if (t < 0.66) return mix(ice2, ice3, (t - 0.33) * 3.0);
            else return mix(ice3, ice4, (t - 0.66) * 3.0);
        }
        
        vec3 getCosmicColor(float t) {
            float hue = t * 0.8 + sin(time * 0.5) * 0.1;
            float sat = 0.8 + sin(t * 10.0 + time) * 0.2;
            float val = 0.3 + t * 0.7;
            
            vec3 stars = vec3(0.0);
            if (fract(t * 100.0 + time) > 0.98) {
                stars = vec3(1.0);
            }
            
            return hsv2rgb(vec3(hue, sat, val)) + stars;
        }
        
        vec3 getMatrixColor(float t) {
            vec3 green = vec3(0.0, 1.0, 0.0);
            float brightness = t * (0.5 + sin(time * 5.0 + t * 20.0) * 0.5);
            
            vec3 color = green * brightness;
            
            if (fract(t * 50.0 + time * 2.0) > 0.95) {
                color += vec3(0.5, 1.0, 0.5);
            }
            
            return color;
        }
        
        void main() {
            vec2 coord = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * 4.0;
            coord = coord / zoom + offset;
            
            float freqModulation = 0.0;
            if (audioLevel > 0.01) {
                int freqIndex = int(vUv.x * 127.0);
                freqModulation = frequencyData[freqIndex] / 255.0;
                coord += vec2(sin(time + freqModulation), cos(time + freqModulation)) * audioLevel * 0.1;
            }
            
            float value;
            
            if (mod(time, 30.0) < 10.0) {
                value = mandelbrot(coord, iterations);
            } else if (mod(time, 30.0) < 20.0) {
                vec2 juliaC = vec2(-0.7 + sin(time * 0.1) * 0.1, 0.27015 + cos(time * 0.1) * 0.1);
                value = julia(coord, juliaC, iterations);
            } else {
                value = quantumFractal(coord, iterations, quantumPhase);
            }
            
            value = pow(value, 0.5 + sin(time * 0.2) * 0.3);
            
            value += freqModulation * 0.2;
            
            vec3 color;
            
            if (colorScheme == 0) color = getQuantumColor(value);
            else if (colorScheme == 1) color = getFireColor(value);
            else if (colorScheme == 2) color = getIceColor(value);
            else if (colorScheme == 3) color = getCosmicColor(value);
            else if (colorScheme == 4) color = getMatrixColor(value);
            else color = vec3(value);
            
            float vignette = 1.0 - length(vUv - 0.5) * 0.5;
            color *= vignette;
            
            float glow = exp(-value * 2.0) * 0.5;
            color += vec3(glow * 0.2, glow * 0.3, glow * 0.5);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};