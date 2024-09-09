import React, { useState, useEffect, useRef } from "react";
import SimplePeer from "simple-peer";

const PeerConnection = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const audioRef = useRef();

  useEffect(() => {
    if (audioStream && isStreaming) {
      const newPeer = new SimplePeer({
        initiator: window.location.hash === "#1",
        trickle: false,
        stream: audioStream,
      });

      newPeer.on("signal", (data) => {
        console.log("Signal data:", data);
      });

      newPeer.on("stream", (stream) => {
        audioRef.current.srcObject = stream;
        audioRef.current.play();
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
    setIsStreaming(false);
  };

  return (
    <div>
      <button onClick={startStreaming}>Start Streaming</button>
      <button onClick={stopStreaming} disabled={!isStreaming}>
        Stop Streaming
      </button>
      <audio ref={audioRef} controls />
    </div>
  );
};

export default PeerConnection;
