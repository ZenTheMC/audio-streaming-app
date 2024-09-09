// src/PeerConnection.js
import React, { useState, useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import AudioVisualizer from "./AudioVisualizer";

const PeerConnection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const audioRef = useRef();
  const audioContextRef = useRef();
  const gainNodeRef = useRef();
  const biquadFilterRef = useRef();
  const sourceNodeRef = useRef();

  useEffect(() => {
    if (audioStream && isStreaming) {
      const newPeer = new SimplePeer({
        initiator: window.location.hash === "#1", // one user should be initiator
        trickle: false,
        stream: audioStream,
      });

      newPeer.on("signal", (data) => {
        console.log("Signal data:", data);
      });

      newPeer.on("stream", (stream) => {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        // Create Gain Node
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.75; // Set default gain

        // Create Frequency Filter
        const biquadFilter = audioContext.createBiquadFilter();
        biquadFilter.type = "lowshelf";
        biquadFilter.frequency.setValueAtTime(200, audioContext.currentTime); // Set frequency to 200 Hz
        biquadFilter.gain.setValueAtTime(0, audioContext.currentTime); // Neutral gain for frequency

        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(biquadFilter);
        biquadFilter.connect(audioContext.destination);

        // Store references for toggling
        audioContextRef.current = audioContext;
        gainNodeRef.current = gainNode;
        biquadFilterRef.current = biquadFilter;
        sourceNodeRef.current = source;

        audioRef.current.srcObject = stream;
        audioRef.current.play();
      });

      newPeer.on("connect", () => {
        console.log("Peer connected successfully!");
      });

      setPeer(newPeer);
    }
  }, [audioStream, isStreaming]);

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setAudioStream(stream);
    setIsStreaming(true);
  };

  const stopStreaming = () => {
    if (peer) peer.destroy();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsStreaming(false);
  };

  const toggleFilter = () => {
    if (!audioContextRef.current) return;

    if (isFilterOn) {
      // Disable filter
      gainNodeRef.current.disconnect(biquadFilterRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } else {
      // Enable filter
      gainNodeRef.current.connect(biquadFilterRef.current);
      biquadFilterRef.current.connect(audioContextRef.current.destination);
    }

    setIsFilterOn(!isFilterOn);
  };

  const handleSignalDataInput = (event) => {
    try {
      const data = JSON.parse(event.target.value);
      if (peer && !peer.destroyed) {
        peer.signal(data);
        console.log("Signaling data applied:", data);
      } else {
        console.error("Peer is destroyed or invalid. Cannot signal.");
      }
    } catch (err) {
      console.error("Invalid signal data format:", err);
    }
  };

  return (
    <div>
      <button onClick={startStreaming}>Start Streaming</button>
      <button onClick={stopStreaming} disabled={!isStreaming}>
        Stop Streaming
      </button>
      <button onClick={toggleFilter} disabled={!isStreaming}>
        {isFilterOn ? "Disable Filter" : "Enable Filter"}
      </button>
      <audio ref={audioRef} controls />
      <textarea
        placeholder="Paste signaling data here and press Enter"
        onKeyDown={(e) => e.key === "Enter" && handleSignalDataInput(e)}
        rows={4}
        cols={50}
      />
      {audioContextRef.current && sourceNodeRef.current && (
        <AudioVisualizer
          audioContext={audioContextRef.current}
          sourceNode={sourceNodeRef.current}
        />
      )}
    </div>
  );
};

export default PeerConnection;
