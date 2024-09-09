import React, { useState, useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import { Buffer } from "buffer";
import process from "process";

window.Buffer = Buffer;
window.process = process;

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
    setIsStreaming(false);
  };

  // const handleSignalDataInput = (event) => {
  //   try {
  //     const data = JSON.parse(event.target.value);
  //     if (peer) {
  //       peer.signal(data);
  //       console.log("Signaling data applied:", data);
  //     }
  //   } catch (err) {
  //     console.error("Invalid signal data format:", err);
  //   }
  // };

  const handleSignalDataInput = (event) => {
    try {
      const data = JSON.parse(event.target.value);
      if (peer && !peer.destroyed) {
        // Check if peer is not destroyed
        peer.signal(data); // Apply the received signal data to the current peer
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
      <audio ref={audioRef} controls />
      <textarea
        placeholder="Paste signaling data here and press Enter"
        onKeyDown={(e) => e.key === "Enter" && handleSignalDataInput(e)}
        rows={4}
        cols={50}
      />
    </div>
  );
};

export default PeerConnection;
