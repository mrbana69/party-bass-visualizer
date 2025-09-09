import React, { useEffect, useRef } from "react";

// Get average of bass frequencies (20-250Hz in 2048 FFT)
function getBassEnergy(freqData, sampleRate, fftSize) {
  const nyquist = sampleRate / 2;
  const minBassHz = 20;
  const maxBassHz = 250;
  const minIndex = Math.floor((minBassHz / nyquist) * (fftSize / 2));
  const maxIndex = Math.ceil((maxBassHz / nyquist) * (fftSize / 2));
  let sum = 0;
  let count = 0;
  for (let i = minIndex; i <= maxIndex; i++) {
    sum += freqData[i];
    count++;
  }
  return count ? sum / count : 0;
}

export default function Visualizer({ analyser, audioContext, isPlaying }) {
  const canvasRef = useRef(null);
  const partyParticles = useRef([]);

  useEffect(() => {
    if (!analyser || !audioContext) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    analyser.fftSize = 2048;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    // Responsive canvas size
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let lastBass = 0;
    let colorPhase = 0;
    let rafId;

    // Particle burst system
    function spawnParty(bass) {
      const n = Math.floor(5 + Math.random() * 10 + bass / 10);
      for (let i = 0; i < n; i++) {
        partyParticles.current.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          r: 10 + Math.random() * 20 + bass / 2,
          angle: Math.random() * Math.PI * 2,
          speed: 2 + Math.random() * 4 + bass / 40,
          color:
            "hsl(" +
            ((colorPhase + Math.random() * 50) % 360) +
            ",95%," +
            (60 + Math.random() * 30) +
            "%)",
          alpha: 1.0,
        });
      }
    }

    function draw() {
      analyser.getByteFrequencyData(freqData);
      const bass = getBassEnergy(
        freqData,
        audioContext.sampleRate,
        analyser.fftSize
      );
      // Color phase rotates with bass energy
      colorPhase = (colorPhase + 2 + bass / 10) % 360;

      // React to bass: if the bass spikes, spawn party!
      if (bass > 120 && lastBass < 100) spawnParty(bass);

      // Fade background for trailing effect
      ctx.fillStyle = "rgba(24,24,24,0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center pulse
      const pulseR =
        60 + Math.max(0, Math.min(140, bass * 1.2)); // 60-200px
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 200);
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        pulseR,
        0,
        2 * Math.PI,
        false
      );
      ctx.fillStyle = `hsl(${colorPhase},90%,60%)`;
      ctx.shadowColor = `hsl(${colorPhase},100%,60%)`;
      ctx.shadowBlur = 32 + bass / 2;
      ctx.fill();
      ctx.restore();

      // Particle bursts
      partyParticles.current = partyParticles.current.filter((p) => p.alpha > 0.02);
      for (const p of partyParticles.current) {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.r *= 0.96;
        p.alpha *= 0.97;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI, false);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
      }

      lastBass = bass;
      rafId = requestAnimationFrame(draw);
    }

    if (isPlaying) draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line
  }, [analyser, audioContext, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={320}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}