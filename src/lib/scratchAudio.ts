type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export class ScratchAudioEngine {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private reverseBuffer: AudioBuffer | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer | null> | null = null;
  private lastPlayAt = 0;
  private nextOffset = 0;

  constructor(private readonly src: string) {}

  preload() {
    void this.load();
  }

  async arm() {
    const context = this.getContext();
    if (!context) return;

    if (context.state === "suspended") {
      await context.resume().catch(() => {});
    }

    void this.load();
  }

  async play(delta: number, elapsed: number, volume: number) {
    const context = this.getContext();
    if (!context) return;

    if (context.state === "suspended") {
      await context.resume().catch(() => {});
    }

    const buffer = this.buffer ?? (await this.load());
    if (!buffer) return;

    const now = context.currentTime;
    if (now - this.lastPlayAt < 0.038) return;
    this.lastPlayAt = now;

    const intensity = Math.min(Math.max(Math.abs(delta) / Math.max(elapsed, 16), 0.08), 2.1);
    const duration = Math.min(0.05 + intensity * 0.075, 0.165);
    const selectedBuffer = delta < 0 ? this.reverseBuffer ?? buffer : buffer;
    const maxOffset = Math.max(selectedBuffer.duration - duration - 0.02, 0);
    this.nextOffset = maxOffset ? (this.nextOffset + 0.038 + intensity * 0.026) % maxOffset : 0;

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = selectedBuffer;
    source.playbackRate.value = Math.min(0.58 + intensity * 1.05, 2.25);

    const level = Math.min(volume, 0.9);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.025), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(context.destination);
    source.start(now, this.nextOffset, duration);
    source.stop(now + duration + 0.02);

    this.playFriction(context, now, duration, intensity, delta);
  }

  stop() {
    this.lastPlayAt = 0;
  }

  private async load() {
    if (this.buffer) return this.buffer;
    if (this.loading) return this.loading;

    const context = this.getContext();
    if (!context) return null;

    this.loading = fetch(this.src)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        this.buffer = buffer;
        this.reverseBuffer = this.createReverseBuffer(context, buffer);
        return buffer;
      })
      .catch(() => null)
      .finally(() => {
        this.loading = null;
      });

    return this.loading;
  }

  private getContext() {
    if (this.context) return this.context;
    const AudioContextCtor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextCtor) return null;
    this.context = new AudioContextCtor();
    this.noiseBuffer = this.createNoiseBuffer(this.context);
    return this.context;
  }

  private playFriction(context: AudioContext, now: number, duration: number, intensity: number, delta: number) {
    const noiseBuffer = this.noiseBuffer ?? this.createNoiseBuffer(context);
    this.noiseBuffer = noiseBuffer;

    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    const filter = context.createBiquadFilter();
    const tone = context.createOscillator();
    const toneGain = context.createGain();

    noise.buffer = noiseBuffer;
    noise.loop = true;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900 + intensity * 1350, now);
    filter.Q.setValueAtTime(0.7 + intensity * 2.2, now);

    const hiss = Math.min(0.012 + intensity * 0.045, 0.085);
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(hiss, now + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

    tone.type = "sawtooth";
    tone.frequency.setValueAtTime(delta < 0 ? 74 : 92, now);
    tone.frequency.exponentialRampToValueAtTime(delta < 0 ? 48 : 132, now + duration);
    toneGain.gain.setValueAtTime(0.001, now);
    toneGain.gain.exponentialRampToValueAtTime(Math.min(0.018 + intensity * 0.028, 0.07), now + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(context.destination);
    tone.connect(toneGain);
    toneGain.connect(context.destination);

    noise.start(now);
    noise.stop(now + duration);
    tone.start(now);
    tone.stop(now + duration);
  }

  private createNoiseBuffer(context: AudioContext) {
    const length = Math.max(1, Math.floor(context.sampleRate * 0.32));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.82 + white * 0.18;
      data[index] = previous;
    }
    return buffer;
  }

  private createReverseBuffer(context: AudioContext, source: AudioBuffer) {
    const reversed = context.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
    for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
      const input = source.getChannelData(channel);
      const output = reversed.getChannelData(channel);
      for (let index = 0, last = input.length - 1; index < input.length; index += 1) {
        output[index] = input[last - index];
      }
    }
    return reversed;
  }
}
