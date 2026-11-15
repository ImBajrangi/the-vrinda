/**
 * ChimeService - Zero-Latency Sacred Temple Audio & Chime Engine
 * Provides authentic temple bell, shankh chime, and sadhana resonance
 * with Web Audio API AudioBuffer zero-latency playback and synthesized fallback.
 */

export type ChimeType = 'temple-bell' | 'shankh-chime' | 'sadhana-tone';

const CHIME_PATHS: Record<ChimeType, string> = {
  'temple-bell': '/audio/chimes/temple-bell.mp3',
  'shankh-chime': '/audio/chimes/shankh-chime.mp3',
  'sadhana-tone': '/audio/chimes/sadhana-tone.mp3',
};

const STORAGE_KEY = 'vrindopnisad_chimes_muted';

class SacredChimeEngine {
  private ctx: AudioContext | null = null;
  private audioBuffers: Map<ChimeType, AudioBuffer> = new Map();
  private isLoading = false;
  private isMuted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private hasPreloaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        this.isMuted = saved === 'true';
      } catch {
        this.isMuted = false;
      }

      // Automatically register user gesture unlock
      const unlockAudio = () => {
        this.ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (!this.hasPreloaded) {
          this.preload();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    return this.ctx;
  }

  /**
   * Pre-fetches and decodes all chime files into uncompressed AudioBuffers
   * ensuring strictly zero latency upon bead taps.
   */
  public async preload(): Promise<void> {
    if (this.hasPreloaded || this.isLoading || typeof window === 'undefined') return;
    this.isLoading = true;

    const ctx = this.ensureContext();
    const chimeTypes: ChimeType[] = ['temple-bell', 'shankh-chime', 'sadhana-tone'];

    try {
      await Promise.all(
        chimeTypes.map(async (type) => {
          try {
            const res = await fetch(CHIME_PATHS[type]);
            if (!res.ok) return;
            const arrayBuffer = await res.arrayBuffer();
            if (ctx) {
              const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
              this.audioBuffers.set(type, audioBuffer);
            }
          } catch (e) {
            console.debug(`[ChimeService] Preload buffer fallback for ${type}:`, e);
          }
        })
      );
      this.hasPreloaded = true;
    } catch (err) {
      console.debug('[ChimeService] Preload error, falling back to synthesis:', err);
    } finally {
      this.isLoading = false;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    } catch {
      // safe storage fallback
    }
    this.listeners.forEach((fn) => fn(this.isMuted));
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Plays a pre-buffered audio file with exact microsecond timing,
   * with automatic Web Audio synthesizer fallback if audio file was not decoded.
   */
  public async play(type: ChimeType, volume = 0.5): Promise<void> {
    if (this.isMuted || typeof window === 'undefined') return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Safe context resume catch
      }
    }

    const buffer = this.audioBuffers.get(type);
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);
        return;
      } catch (e) {
        console.debug('[ChimeService] Buffer source error, falling back:', e);
      }
    }

    // HTML5 Audio element fallback if buffer not yet decoded
    try {
      const audioEl = new Audio(CHIME_PATHS[type]);
      audioEl.volume = Math.max(0.01, Math.min(1, volume));
      const playPromise = audioEl.play();
      if (playPromise) {
        playPromise.catch(() => {
          // If browser blocked HTML5 audio, play synthesized fallback
          this.playSynthesizedFallback(type, volume);
        });
        return;
      }
    } catch {
      // Proceed to synthesized fallback
    }

    this.playSynthesizedFallback(type, volume);
  }

  /**
   * Pure Web Audio API synthesized harmonic bell/chime fallback (0 external files needed).
   */
  private playSynthesizedFallback(type: ChimeType, volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state === 'suspended') return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.7)), now);
    masterGain.connect(ctx.destination);

    if (type === 'temple-bell') {
      // Multi-harmonic temple bell synthesis (528Hz Love/Dhyana frequency + harmonic partials)
      const partials = [
        { freq: 528, gain: 0.6, decay: 2.2 },
        { freq: 1056, gain: 0.3, decay: 1.6 },
        { freq: 1584, gain: 0.15, decay: 1.1 },
        { freq: 2112, gain: 0.08, decay: 0.8 },
      ];

      partials.forEach(({ freq, gain, decay }) => {
        const osc = ctx.createOscillator();
        const pGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        pGain.gain.setValueAtTime(gain, now);
        pGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(pGain);
        pGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay);
      });
    } else if (type === 'shankh-chime') {
      // Resonant sacred conch (Shankh) tone simulation (Warm brass swell & harmonic resonance)
      const osc = ctx.createOscillator();
      const sGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // Middle C
      osc.frequency.exponentialRampToValueAtTime(392.0, now + 0.4); // Rise to G

      sGain.gain.setValueAtTime(0.001, now);
      sGain.gain.linearRampToValueAtTime(0.5, now + 0.25);
      sGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(sGain);
      sGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 2.8);
    } else {
      // 'sadhana-tone': Soft, gentle bell click for individual bead taps (432Hz)
      const osc = ctx.createOscillator();
      const bGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now);

      bGain.gain.setValueAtTime(0.3, now);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(bGain);
      bGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  /**
   * Delicate resonance for each individual Tulsi bead chant.
   */
  public playBeadChime(): void {
    this.play('sadhana-tone', 0.4);
  }

  /**
   * Auspicious temple chime when completing a 108-bead Mala.
   */
  public playMalaCompleteChime(): void {
    this.play('shankh-chime', 0.7);
    setTimeout(() => {
      this.play('temple-bell', 0.6);
    }, 350);
  }
}

// Singleton export
export const chimeService = new SacredChimeEngine();
