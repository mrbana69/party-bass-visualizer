import React, { useState, useRef } from "react";
import AudioPlayer from "./components/AudioPlayer";
import Visualizer from "./components/Visualizer";

export default function App() {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const audioElementRef = useRef(null);

  // Handle audio file selection and decoding
  async function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    // Stop previous playback if any
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAudioSource(null);
      setAnalyser(null);
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(buffer);

    // Set up analyser
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 2048;
    setAnalyser(analyserNode);
  }

  // Drag & drop handlers
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover" || e.type === "dragenter");
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]);
  }

  return (
    <>
      <h1>Party Bass Visualizer 🥳</h1>
      <div
        className={`uploader${dragActive ? " dragging" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <label htmlFor="audio-upload">
          <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
            {fileName ? "Change Song" : "Upload your MP3 or FLAC"}
          </span>
          <br />
          <input
            type="file"
            accept="audio/mp3, audio/flac, audio/wav, audio/x-flac"
            id="audio-upload"
            onChange={e => handleFile(e.target.files[0])}
          />
          <br />
          <button
            style={{
              marginTop: 10,
              background: "#ff2aad",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "8px 22px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 12px #ff2aad55",
            }}
            onClick={() => document.getElementById("audio-upload").click()}
            type="button"
          >
            {fileName ? "Select Another File" : "Choose File"}
          </button>
        </label>
        <div style={{ fontSize: "0.95rem", marginTop: 12, color: "#aaa" }}>
          {fileName ? `Loaded: ${fileName}` : "Supported: MP3, FLAC, WAV"}
        </div>
      </div>
      {audioBuffer && analyser && (
        <>
          <AudioPlayer
            audioBuffer={audioBuffer}
            audioContext={audioContext}
            audioSource={audioSource}
            setAudioSource={setAudioSource}
            analyser={analyser}
            setIsPlaying={setIsPlaying}
            isPlaying={isPlaying}
            audioElementRef={audioElementRef}
          />
          <div className="visualizer-container">
            <Visualizer
              analyser={analyser}
              audioContext={audioContext}
              isPlaying={isPlaying}
            />
          </div>
        </>
      )}
      <div style={{ marginTop: 36, color: "#888", fontSize: 13 }}>
        Open source. Made with ❤️ for wild parties.<br />
        <a
          href="https://github.com/mrbana69/party-bass-visualizer"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2affd3" }}
        >
          GitHub Repo
        </a>
      </div>
    </>
  );
}