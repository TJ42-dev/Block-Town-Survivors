export class AudioManager {
    private context: AudioContext | null = null;
    private buffers: Record<string, AudioBuffer> = {};
    private bgmSource: AudioBufferSourceNode | null = null;
    private bgmGain: GainNode | null = null;
    
    public sfxVolume: number = 0.5;
    public bgmVolume: number = 0.3; // Default lower than SFX
    public masterMute: boolean = false;
  
    constructor() {
      // Lazy init in methods to avoid issues with SSR or early execution
    }
  
    private getContext(): AudioContext {
      if (!this.context) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.context = new AudioContextClass();
      }
      return this.context;
    }
  
    async load(url: string): Promise<boolean> {
      const ctx = this.getContext();
      if (this.buffers[url]) return true;
      try {
          const res = await fetch(url);
          if (!res.ok) {
              console.warn('Failed to fetch sound', url, res.status);
              return false;
          }
          const arrayBuffer = await res.arrayBuffer();
          this.buffers[url] = await ctx.decodeAudioData(arrayBuffer);
          return true;
      } catch (e) {
          console.warn('Failed to load sound', url, e);
          return false;
      }
    }
  
    playSFX(url: string, volumeScale: number = 1.0) {
      if (this.masterMute) return;
      const ctx = this.getContext();
      
      // Try to resume if suspended
      if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
      }
      
      const buffer = this.buffers[url];
      if (!buffer) {
          this.load(url); // Try loading for next time
          return;
      }
  
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = this.sfxVolume * volumeScale;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    }
  
    playBGM(url: string) {
      if (this.bgmSource) return; // Already playing?

      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!this.buffers[url]) {
          // Load and then play - wait for it to complete
          this.load(url).then((success) => {
              if (success) this.startBGMNode(url);
          });
          return;
      }
      this.startBGMNode(url);
    }

    private startBGMNode(url: string) {
        if (this.bgmSource) this.stopBGM(); // Safety
        
        const ctx = this.getContext();
        const buffer = this.buffers[url];
        if (!buffer) return;

        this.bgmSource = ctx.createBufferSource();
        this.bgmSource.buffer = buffer;
        this.bgmSource.loop = true;
        
        this.bgmGain = ctx.createGain();
        this.updateBGMVolume();
        
        this.bgmSource.connect(this.bgmGain);
        this.bgmGain.connect(ctx.destination);
        this.bgmSource.start(0);
    }
  
    stopBGM() {
      if (this.bgmSource) {
          try {
            this.bgmSource.stop();
          } catch(e) {
             // ignore if already stopped
          }
          this.bgmSource = null;
      }
    }
  
    updateBGMVolume() {
      if (this.bgmGain) {
          // Smooth transition
          const target = this.masterMute ? 0 : this.bgmVolume;
          // Ramp to value to avoid clicks, but simple assignment is okay for settings sliders
          this.bgmGain.gain.setTargetAtTime(target, this.getContext().currentTime, 0.1);
      }
    }
  
    setSFXVolume(vol: number) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }

    setBGMVolume(vol: number) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        this.updateBGMVolume();
    }
    
    setMute(mute: boolean) {
        this.masterMute = mute;
        this.updateBGMVolume();
    }
  }
  
  export const audioManager = new AudioManager();
