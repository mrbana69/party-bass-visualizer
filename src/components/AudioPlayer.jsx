import React, { useEffect, useRef, useState } from "react";

export default function AudioPlayer({
  audioBuffer,
  audioContext,
  audioSource,
  setAudioSource,
  analyser,
  setIsPlaying,
  isPlaying,
  audioElementRef,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioBuffer.duration);

  // Play/Pause logic
  useEffect(() => {
    if (!audioBuffer || !audioContext || !analyser) return;
    let source;
    let startTime = 0;
    let pausedAt = 0;
    let rafId;

    function play() {
      source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.start(0, pausedAt);
      setAudioSource(source);
      setIsPlaying(true);
      startTime = audioContext.currentTime - pausedAt;
      rafId = requestAnimationFrame(updateTime);
      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(duration);
      };
    }

    function pause() {
      if (source) {
        source.stop();
        pausedAt = audioContext.currentTime - startTime;
        setAudioSource(null);
        setIsPlaying(false);
        cancelAnimationFrame(rafId);
      }
    }

    function updateTime() {
      if (isPlaying) {
        setCurrentTime(audioContext.currentTime - startTime);
        if (audioContext.currentTime - startTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(duration);
        } else {
          rafId = requestAnimationFrame(updateTime);
        }
      }
    }

    audioElementRef.current = {
      play,
      pause,
      seek: (time) => {
        pause();
        pausedAt = time;
        setCurrentTime(time);
        play();
      },
      isPlaying: () => isPlaying,
    };

    return () => {
      if (source) source.disconnect();
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line
  }, [audioBuffer, audioContext, analyser]);

  // Play/Pause button
  function handlePlayPause() {
    if (!audioElementRef.current) return;
    if (isPlaying) audioElementRef.current.pause();
    else audioElementRef.current.play();
  }

  // Seek bar
  function handleSeek(e) {
    const val = parseFloat(e.target.value);
    if (audioElementRef.current) {
      audioElementRef.current.seek(val);
    }
  }

  return (
    <div>
      <div className="audio-controls">
        <button
          onClick={handlePlayPause}
          style={{
            background: isPlaying ? "#2affd3" : "#ff2aad",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            padding: "6px 18px",
            fontWeight: 600,
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          step="0.01"
          style={{ width: 240 }}
        />
        <span style={{ fontFamily: "monospace" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}