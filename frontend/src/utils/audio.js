// Web Audio API synthesizer for celebratory sound effects
export function playLevelUpFireworkSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Fanfare Chord (Celebratory synth sweep: C4, E4, G4, C5, E5)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.9);
    });

    // 2. Firework Whistle
    const whistleOsc = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistleOsc.type = 'sine';
    whistleOsc.frequency.setValueAtTime(350, ctx.currentTime + 0.35);
    whistleOsc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.75);

    whistleGain.gain.setValueAtTime(0.01, ctx.currentTime + 0.35);
    whistleGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.65);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(ctx.destination);

    whistleOsc.start(ctx.currentTime + 0.35);
    whistleOsc.stop(ctx.currentTime + 0.75);

    // 3. Firework Burst Pops (noise pops)
    for (let i = 0; i < 7; i++) {
      const burstDelay = 0.75 + Math.random() * 0.45;
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 2500, ctx.currentTime + burstDelay);

      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.35, ctx.currentTime + burstDelay);
      burstGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + burstDelay + 0.12);

      noise.connect(filter);
      filter.connect(burstGain);
      burstGain.connect(ctx.destination);

      noise.start(ctx.currentTime + burstDelay);
      noise.stop(ctx.currentTime + burstDelay + 0.12);
    }
  } catch (e) {
    console.warn("Audio Context error:", e);
  }
}
