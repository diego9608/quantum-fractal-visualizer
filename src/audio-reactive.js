import * as Tone from 'tone';

export class AudioReactive {
    constructor() {
        this.isActive = false;
        this.analyser = null;
        this.fftSize = 256;
        this.frequencyData = new Uint8Array(this.fftSize / 2);
        this.smoothedData = new Float32Array(this.fftSize / 2);
        this.smoothingFactor = 0.8;
        this.mic = null;
        this.beatDetector = {
            threshold: 0.8,
            lastBeat: 0,
            beatInterval: 500,
            energy: 0,
            lastEnergy: 0
        };
    }
    
    async init() {
        try {
            await Tone.start();
            
            this.mic = new Tone.UserMedia();
            this.analyser = new Tone.Analyser({
                size: this.fftSize,
                type: 'fft'
            });
            
            this.mic.connect(this.analyser);
            
            this.compressor = new Tone.Compressor({
                threshold: -20,
                ratio: 8,
                attack: 0.003,
                release: 0.25
            });
            
            this.filter = new Tone.Filter({
                frequency: 200,
                type: 'highpass'
            });
            
            this.mic.connect(this.filter);
            this.filter.connect(this.compressor);
            this.compressor.connect(this.analyser);
            
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }
    
    async start() {
        try {
            await this.mic.open();
            this.isActive = true;
            this.animate();
        } catch (error) {
            console.error('Failed to start audio input:', error);
            this.isActive = false;
        }
    }
    
    stop() {
        if (this.mic) {
            this.mic.close();
        }
        this.isActive = false;
    }
    
    animate() {
        if (!this.isActive) return;
        
        requestAnimationFrame(() => this.animate());
        
        const rawData = this.analyser.getValue();
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            const dbValue = rawData[i];
            const normalized = (dbValue + 100) / 100;
            this.frequencyData[i] = Math.max(0, Math.min(255, normalized * 255));
            
            this.smoothedData[i] = this.smoothedData[i] * this.smoothingFactor + 
                                   this.frequencyData[i] * (1 - this.smoothingFactor);
        }
        
        this.detectBeat();
    }
    
    detectBeat() {
        const currentTime = Date.now();
        let sum = 0;
        
        for (let i = 0; i < 32; i++) {
            sum += this.frequencyData[i];
        }
        
        this.beatDetector.energy = sum / 32;
        
        if (this.beatDetector.energy > this.beatDetector.lastEnergy * this.beatDetector.threshold &&
            currentTime - this.beatDetector.lastBeat > this.beatDetector.beatInterval) {
            this.beatDetector.lastBeat = currentTime;
            this.onBeat();
        }
        
        this.beatDetector.lastEnergy = this.beatDetector.energy;
    }
    
    onBeat() {
        if (window.quantumVisualizer) {
            window.quantumVisualizer.onBeat();
        }
    }
    
    getFrequencyData() {
        return this.smoothedData;
    }
    
    getAverageVolume() {
        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return sum / this.frequencyData.length / 255;
    }
    
    getBassEnergy() {
        let sum = 0;
        const bassRange = Math.floor(this.frequencyData.length * 0.125);
        for (let i = 0; i < bassRange; i++) {
            sum += this.frequencyData[i];
        }
        return sum / bassRange / 255;
    }
    
    getMidEnergy() {
        let sum = 0;
        const start = Math.floor(this.frequencyData.length * 0.125);
        const end = Math.floor(this.frequencyData.length * 0.5);
        for (let i = start; i < end; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (end - start) / 255;
    }
    
    getHighEnergy() {
        let sum = 0;
        const start = Math.floor(this.frequencyData.length * 0.5);
        for (let i = start; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (this.frequencyData.length - start) / 255;
    }
    
    getSpectralCentroid() {
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            numerator += i * this.frequencyData[i];
            denominator += this.frequencyData[i];
        }
        
        return denominator > 0 ? numerator / denominator / this.frequencyData.length : 0;
    }
}