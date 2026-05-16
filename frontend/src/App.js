import React, { useState, useRef, useCallback } from 'react';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import { uploadResume, getWebSocketUrl } from './services/api';
import { Terminal, Code2, Presentation, ShieldCheck, UploadCloud } from 'lucide-react';
import './styles/App.css';

function App() {
  const [sessionStatus, setSessionStatus] = useState('idle');
  const [interviewMode, setInterviewMode] = useState('presentation');
  const [reportId, setReportId] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [sessionVideo, setSessionVideo] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const socketRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        resolve(socketRef.current);
        return;
      }
      const socket = new WebSocket(getWebSocketUrl());
      socket.onopen = () => resolve(socket);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "FINAL_REPORT") {
          setFinalScores(data.scores);
          setReportId(data.report_id);
          setTimeline(data.timeline || []);
          setSessionStatus('finished');
        }
      };
      socket.onerror = (err) => reject(err);
      socket.onclose = () => console.warn("🔌 Socket closed.");
      socketRef.current = socket;
    });
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      try {
        setUploadStatus('Uploading...');
        const result = await uploadResume(file);
        if (result.message) setUploadStatus('✅ Verified');
        else setUploadStatus('❌ Failed');
      } catch (err) {
        setUploadStatus('❌ Error');
      }
    }
  };

  const startInterview = async (mode) => {
    try {
      setInterviewMode(mode);
      await connectWebSocket();
      const unlockAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      await unlockAudio.play();
      setSessionStatus('active');
    } catch (e) {
      alert("Backend connection failed. Please ensure the server is running on port 8000.");
    }
  };

  const endInterview = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setSessionStatus('evaluating');
      socketRef.current.send(JSON.stringify({ type: "FINISH" }));
    } else {
      setSessionStatus('idle');
    }
  };

  return (
    <div className="app-layout">
      <nav className="navbar glass-card">
        <div className="nav-brand">
          <Terminal size={24} color="#38bdf8" />
          <span>AI Interviewer <small className="v-tag">v2.0</small></span>
        </div>
        <div className={`status-badge ${sessionStatus === 'active' ? 'status-active' : sessionStatus === 'evaluating' ? 'status-evaluating' : 'status-idle'}`}>
          <div className="pulse-dot"></div>
          {sessionStatus}
        </div>
      </nav>

      <main className="container">
        {sessionStatus === 'idle' && (
          <div className="hero-section">
            <div className="hero-text">
              <h1>Elevate Your <span className="text-gradient">Technical Career</span></h1>
              <p>The first AI-driven platform that evaluates your real-world coding and presentation skills in real-time.</p>
            </div>

            <div className="welcome-grid">
              <div className="welcome-card glass-card">
                <div className="upload-zone">
                  <UploadCloud size={32} color="#94a3b8" />
                  <label className="custom-file-upload">
                    {resumeFile ? resumeFile.name : "Drop your resume here (PDF)"}
                    <input type="file" accept=".pdf" onChange={handleFileUpload} />
                  </label>
                  {uploadStatus && <span className="upload-status">{uploadStatus}</span>}
                </div>
              </div>

              <div className="mode-options">
                <div className="mode-card glass-card" onClick={() => startInterview('presentation')}>
                  <div className="icon-box ib-blue"><Presentation size={24} /></div>
                  <h3>Project Presentation</h3>
                  <p>Pitch your architecture and walkthrough your existing codebase.</p>
                  <button className="btn-primary">Initialize Session</button>
                </div>

                <div className="mode-card glass-card" onClick={() => startInterview('coding')}>
                  <div className="icon-box ib-green"><Code2 size={24} /></div>
                  <h3>Coding Challenge</h3>
                  <p>Solve dynamic problems within our secure integrated environment.</p>
                  <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}>
                    Begin Challenge
                  </button>
                </div>
              </div>
            </div>

            <div className="trust-badges">
              <div className="badge"><ShieldCheck size={16} /> AES-256 Encrypted</div>
              <div className="badge"><Code2 size={16} /> Real-time Analysis</div>
            </div>
          </div>
        )}

        {(sessionStatus === 'active' || sessionStatus === 'evaluating') && (
          <div className="active-session-wrapper">
            {sessionStatus === 'evaluating' ? (
              <div className="evaluating-overlay glass-card">
                <div className="loader"></div>
                <h2>Analyzing Performance...</h2>
                <p>AI is reviewing your session and generating detailed feedback.</p>
              </div>
            ) : (
              <InterviewPage 
                socket={socketRef.current} 
                onStop={endInterview} 
                initialMode={interviewMode}
                setSessionVideo={setSessionVideo}
              />
            )}
            <div className="session-footer">
              <button 
                onClick={endInterview} 
                className="btn-danger"
                disabled={sessionStatus === 'evaluating'}
              >
                {sessionStatus === 'evaluating' ? "Processing..." : "Terminate & Evaluate Session"}
              </button>
            </div>
          </div>
        )}

        {sessionStatus === 'finished' && (
          <FeedbackPage 
            scores={finalScores} 
            reportId={reportId} 
            videoUrl={sessionVideo} 
            timeline={timeline}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 AI-Interview Systems. Powered by Gemini Flash 2.5 & ElevenLabs.</p>
      </footer>
    </div>
  );
}

export default App;
