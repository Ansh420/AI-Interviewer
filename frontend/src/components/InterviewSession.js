import React, { useRef, useState, useEffect, useCallback } from 'react';

const InterviewSession = ({ onFinish }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("System Ready. Connect your screen to begin.");
  const [transcript, setTranscript] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 1. WebSocket Connection Manager
  const connectWebSocket = useCallback(() => {
    console.log("Connect attempt: ws://localhost:8000/ws/interview");
    socketRef.current = new WebSocket("ws://localhost:8000/ws/interview");

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket Connected Successfully");
      setCurrentQuestion("Connected to AI. Click 'Start' to present.");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 AI Response Received:", data.text);
      setIsThinking(false);

      if (data.type === "AI_RESPONSE") {
        setCurrentQuestion(data.text);
        if (data.audio) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
          audio.play().catch(e => console.error("Playback Error:", e));
        }
      }
    };

    socketRef.current.onerror = (err) => console.error("❌ Socket Error:", err);
    
    socketRef.current.onclose = () => {
      console.warn("⚠️ Socket Closed. Reconnecting in 3s...");
      setTimeout(connectWebSocket, 3000);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWebSocket]);

  // 2. Capture and Send Logic
  const captureAndSend = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const socket = socketRef.current;

    if (video && canvas && socket?.readyState === WebSocket.OPEN) {
      console.log("📸 Capturing & Sending Frame...");
      setIsThinking(true);
      
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // We use 0.4 quality to reduce network delay (latency)
      const frameData = canvas.toDataURL('image/jpeg', 0.4);
      
      socket.send(JSON.stringify({
        frame: frameData,
        text: transcript || "Student is presenting code/slides."
      }));
    } else {
      console.warn("Skipping frame: Socket not ready or Video hidden.");
    }
  }, [transcript]);

  // 3. Main Start Trigger
  const startInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { frameRate: 15 }, // Lower framerate = less CPU load
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsStarted(true);
      setCurrentQuestion("AI is watching. Start your presentation!");

      // Start the Heartbeat (Every 8 seconds)
      intervalRef.current = setInterval(captureAndSend, 8000);

      // Start Browser Voice Recognition
      startSTT();

      // Stop if user stops sharing via browser bar
      stream.getVideoTracks()[0].onended = () => {
        stopInterview();
      };

    } catch (err) {
      console.error("Stream Error:", err);
      alert("Failed to share screen. Check permissions.");
    }
  };

  const stopInterview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsStarted(false);
    setCurrentQuestion("Presentation Ended.");
    // In a full app, you would call onFinish(someReportId) here
  };

  const startSTT = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.continuous = true;
    rec.onresult = (e) => {
      const result = e.results[e.results.length - 1][0].transcript;
      console.log("🎤 Speech:", result);
      setTranscript(result);
    };
    rec.start();
  };

  return (
    <div style={containerStyle}>
      <div style={statusBox(isThinking)}>
        <strong>{isThinking ? "🤖 AI is thinking..." : "👨‍🏫 Interviewer"}</strong>
        <p style={{ margin: '10px 0 0 0' }}>{currentQuestion}</p>
      </div>

      <div style={videoWrapper}>
        <video ref={videoRef} autoPlay playsInline muted style={videoStyle} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: '20px' }}>
        {!isStarted ? (
          <button onClick={startInterview} style={btnStyle('#27ae60')}>
            Start Project Presentation
          </button>
        ) : (
          <button onClick={stopInterview} style={btnStyle('#e74c3c')}>
            Stop Presentation
          </button>
        )}
      </div>

      {transcript && (
        <p style={transcriptStyle}><strong>Live Transcript:</strong> {transcript}</p>
      )}
    </div>
  );
};

// --- CSS-in-JS Styles ---
const containerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' };

const statusBox = (thinking) => ({
  width: '100%',
  maxWidth: '800px',
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: thinking ? '#f1c40f' : '#2c3e50',
  color: thinking ? '#000' : '#fff',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
});

const videoWrapper = { width: '100%', maxWidth: '800px', borderRadius: '12px', overflow: 'hidden', border: '3px solid #ddd' };
const videoStyle = { width: '100%', display: 'block', backgroundColor: '#000' };

const btnStyle = (color) => ({
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 'bold',
  color: 'white',
  backgroundColor: color,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
});

const transcriptStyle = { color: '#666', fontStyle: 'italic', fontSize: '0.9rem' };

export default InterviewSession;