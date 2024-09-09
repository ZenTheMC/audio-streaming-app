// src/AudioVisualizer.js
import React, { useRef, useEffect } from "react";

const AudioVisualizer = ({ audioContext, sourceNode }) => {
  const canvasRef = useRef(); // Keep this ref for the canvas

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext("2d");
    const analyser = audioContext.createAnalyser(); // Create AnalyserNode
    sourceNode.connect(analyser); // Ensure sourceNode is connected only once
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasContext.fillStyle = "rgb(200, 200, 200)";
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);

      canvasContext.lineWidth = 2;
      canvasContext.strokeStyle = "rgb(0, 0, 0)";
      canvasContext.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2);
      canvasContext.stroke();
    };

    draw();

    return () => {
      sourceNode.disconnect(analyser);
    };
  }, [audioContext, sourceNode]);

  return <canvas ref={canvasRef} width="600" height="200" />;
};

export default AudioVisualizer;
