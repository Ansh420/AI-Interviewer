import React, { useState, useEffect, useRef, useCallback } from 'react';
import InterviewSession from './components/InterviewSession';
import FeedbackReport from './components/FeedbackReport';
import { Terminal, Code2, Presentation, ShieldCheck, UploadCloud } from 'lucide-react';

function App() {
  const [sessionStatus, setSessionStatus] = useState('idle');
  const [interviewMode, setInterviewMode] = useState('presentation');
  const [reportId, setReportId] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const socketRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        resolve(socketRef.current);
        return;
      }
      const socket = new WebSocket("ws://localhost:8000/ws/interview");
      socket.onopen = () => resolve(socket);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "FINAL_REPORT") {
          setFinalScores(data.scores);
          setReportId(data.report_id);
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
      const formData = new FormData();
      formData.append("file", file);
      try {
        setUploadStatus('Uploading...');
        const response = await fetch("http://localhost:8000/upload_resume", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
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
        <div className={`status-badge ${sessionStatus === 'active' ? 'status-active' : 'status-idle'}`}>
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

        {sessionStatus === 'active' && (
          <div className="active-session-wrapper">
            <InterviewSession 
              socket={socketRef.current} 
              onStop={endInterview} 
              initialMode={interviewMode}
            />
            <div className="session-footer">
              <button onClick={endInterview} className="btn-danger">Terminate & Evaluate Session</button>
            </div>
          </div>
        )}

        {sessionStatus === 'finished' && (
          <FeedbackReport scores={finalScores} reportId={reportId} />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 AI-Interview Systems. Powered by Gemini Flash 2.5 & ElevenLabs.</p>
      </footer>

      <style jsx>{`
        .app-layout { padding: 20px 5%; display: flex; flex-direction: column; min-height: 100vh; gap: 40px; }
        .navbar { display: flex; justify-content: space-between; padding: 15px 30px; align-items: center; position: sticky; top: 20px; z-index: 100; }
        .nav-brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px; }
        .v-tag { font-size: 0.6rem; background: #334155; padding: 2px 6px; border-radius: 4px; vertical-align: middle; color: #38bdf8; }
        .pulse-dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        
        .container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 1200px; margin: 0 auto; }
        .hero-section { text-align: center; display: flex; flex-direction: column; gap: 50px; width: 100%; }
        .hero-text h1 { font-size: 4rem; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 20px; }
        .text-gradient { background: linear-gradient(to right, #38bdf8, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-text p { color: #94a3b8; font-size: 1.2rem; max-width: 600px; margin: 0 auto; }

        .welcome-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; width: 100%; }
        .upload-zone { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 40px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; transition: all 0.2s; }
        .upload-zone:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
        .custom-file-upload { cursor: pointer; font-weight: 600; color: #38bdf8; }
        .custom-file-upload input { display: none; }
        .upload-status { font-size: 0.75rem; color: #10b981; }

        .mode-options { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .mode-card { padding: 30px; text-align: left; display: flex; flex-direction: column; gap: 15px; cursor: pointer; transition: transform 0.2s; }
        .mode-card:hover { transform: scale(1.02); }
        .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .ib-blue { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .ib-green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .mode-card h3 { font-size: 1.25rem; font-weight: 700; }
        .mode-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }

        .trust-badges { display: flex; justify-content: center; gap: 30px; color: #475569; font-size: 0.8rem; font-weight: 600; }
        .badge { display: flex; align-items: center; gap: 8px; }

        .active-session-wrapper { width: 100%; display: flex; flex-direction: column; gap: 30px; }
        .btn-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-danger:hover { background: #ef4444; color: white; }
        .session-footer { display: flex; justify-content: center; }

        .app-footer { text-align: center; padding: 40px; color: #475569; font-size: 0.8rem; }
      `}</style>
    </div>
  );
}

export default App;
