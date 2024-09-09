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
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (peer && !peer.destroyed) {
        peer.signal(data);
        console.log("Signaling data applied:", data);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [peer]);

  useEffect(() => {
    if (audioStream && isStreaming) {
      const newPeer = new SimplePeer({
        initiator: window.location.hash === "#1",
        trickle: false,
        stream: audioStream,
      });

      newPeer.on("signal", (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(data));
        }
        console.log("Signal data sent:", data);
      });

      newPeer.on("stream", (stream) => {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.75;

        const biquadFilter = audioContext.createBiquadFilter();
        biquadFilter.type = "lowshelf";
        biquadFilter.frequency.setValueAtTime(200, audioContext.currentTime);
        biquadFilter.gain.setValueAtTime(0, audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(biquadFilter);
        biquadFilter.connect(audioContext.destination);

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
      gainNodeRef.current.disconnect(biquadFilterRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } else {
      gainNodeRef.current.connect(biquadFilterRef.current);
      biquadFilterRef.current.connect(audioContextRef.current.destination);
    }

    setIsFilterOn(!isFilterOn);
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
