export function playScratchAudio(audio: HTMLAudioElement, volume: number) {
  audio.muted = false;
  audio.loop = true;
  audio.volume = volume;

  if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    audio.load();
  }

  try {
    audio.currentTime = 0;
  } catch {
    // Some mobile browsers reject seeking before metadata is ready.
  }

  void audio.play().catch(() => {
    audio.load();
    void audio.play().catch(() => {});
  });
}
