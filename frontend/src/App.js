import React, { useState, useEffect, useRef, useCallback } from 'react';
import InterviewSession from './components/InterviewSession';
import FeedbackReport from './components/FeedbackReport';

/**
 * AI Project Interviewer - Main Entry Point
 * 2026 Integrated Version
 */
function App() {
  // --- State Management ---
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle', 'active', 'finished'
  const [reportId, setReportId] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const socketRef = useRef(null);

  // --- WebSocket Setup ---
  // We manage the socket here so we can listen for the 'FINAL_REPORT' 
  // after the InterviewSession component is unmounted.
  const connectWebSocket = useCallback(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/interview");

    socket.onopen = () => console.log("🚀 App: WebSocket Connected");
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // If the backend sends the final evaluation
      if (data.type === "FINAL_REPORT") {
        console.log("📊 Report Received:", data.scores);
        setFinalScores(data.scores);
        setReportId(data.report_id);
        setSessionStatus('finished');
      }
    };

    socket.onclose = () => {
      console.warn("🔌 Socket closed. Reconnecting...");
      setTimeout(connectWebSocket, 3000);
    };

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => socketRef.current?.close();
  }, [connectWebSocket]);

  // --- Actions ---
  const startInterview = () => {
  // 1. "Unlock" audio by playing a tiny silent beep or just initializing a context
  const unlockAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
  unlockAudio.play().then(() => {
    console.log("🔊 Audio Context Unlocked");
    setSessionStatus('active');
  }).catch(e => {
    console.error("Audio unlock failed. Please click anywhere on the page first.", e);
    setSessionStatus('active'); // Still start, but warn user
  });
};

  const endInterview = () => {
    if (socketRef.current) {
      // Trigger the backend evaluation & SQL save
      socketRef.current.send(JSON.stringify({ type: "FINISH" }));
    }
  };

  return (
    <div style={appContainer}>
      <header style={headerStyle}>
        <h1>AI Technical Interviewer</h1>
        <div style={statusBadge(sessionStatus)}>
          {sessionStatus.toUpperCase()}
        </div>
      </header>

      <main style={mainContent}>
        {/* 1. Welcome Screen */}
        {sessionStatus === 'idle' && (
          <div style={cardStyle}>
            <h2>Ready for your project interview?</h2>
            <p>Share your screen, explain your code, and let the AI challenge your technical depth.</p>
            <button onClick={startInterview} style={primaryBtn}>
              Begin Presentation
            </button>
          </div>
        )}

        {/* 2. Active Interview Session */}
        {sessionStatus === 'active' && (
          <div style={{ width: '100%' }}>
            <InterviewSession 
              socket={socketRef.current} 
              onStop={endInterview} 
            />
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={endInterview} style={stopBtn}>
                Finish & Generate Report
              </button>
            </div>
          </div>
        )}

        {/* 3. Final Evaluation Dashboard */}
        {sessionStatus === 'finished' && (
          <FeedbackReport 
            scores={finalScores} 
            reportId={reportId} 
          />
        )}
      </main>

      <footer style={footerStyle}>
        Built for AI-Driven Automated Interviewing © 2026
      </footer>
    </div>
  );
}

// --- Styles ---
const appContainer = {
  fontFamily: "'Inter', sans-serif",
  backgroundColor: '#f0f2f5',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 5%',
  backgroundColor: '#fff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
};

const statusBadge = (status) => ({
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  backgroundColor: status === 'active' ? '#e74c3c' : '#bdc3c7',
  color: '#fff'
});

const mainContent = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px 5%'
};

const cardStyle = {
  textAlign: 'center',
  backgroundColor: '#fff',
  padding: '50px',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  maxWidth: '500px'
};

const primaryBtn = {
  padding: '15px 35px',
  fontSize: '1.1rem',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '20px',
  fontWeight: '600'
};

const stopBtn = {
  padding: '12px 25px',
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const footerStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#95a5a6',
  fontSize: '0.85rem'
};

export default App;