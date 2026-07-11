type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export class ScratchAudioEngine {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private reverseBuffer: AudioBuffer | null = null;
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
    const duration = Math.min(0.055 + intensity * 0.09, 0.18);
    const selectedBuffer = delta < 0 ? this.reverseBuffer ?? buffer : buffer;
    const maxOffset = Math.max(selectedBuffer.duration - duration - 0.02, 0);
    this.nextOffset = maxOffset ? (this.nextOffset + 0.045 + intensity * 0.025) % maxOffset : 0;

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = selectedBuffer;
    source.playbackRate.value = Math.min(0.7 + intensity * 0.95, 2.15);

    const level = Math.min(volume, 0.9);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.025), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(context.destination);
    source.start(now, this.nextOffset, duration);
    source.stop(now + duration + 0.02);
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
    return this.context;
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
