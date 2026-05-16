import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Camera, Code2, Monitor, Mic, MicOff, Settings2 } from 'lucide-react';

const InterviewSession = ({ socket, onStop, initialMode }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("System Ready. Initialize hardware to begin.");
  const [transcript, setTranscript] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState("// Write your solution here...");
  const [showEditor, setShowEditor] = useState(initialMode === 'coding');

  const languageTemplates = {
    javascript: "// Write your JavaScript solution here...\n\nfunction solution() {\n  console.log('Hello World');\n}\n",
    python: "# Write your Python solution here...\n\ndef solution():\n    print('Hello World')\n",
    java: "// Write your Java solution here...\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}\n",
    cpp: "// Write your C++ solution here...\n\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello World\" << std::endl;\n    return 0;\n}\n"
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(languageTemplates[newLang] || "");
  };

  // Fix for the background running bug: Cleanup everything on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up session...");
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "AI_RESPONSE") {
        setIsThinking(false);
        setCurrentQuestion(data.text);
        if (data.audio) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
          audio.play().catch(e => console.error("Audio playback error", e));
        }
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  const captureAndSend = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && socket?.readyState === WebSocket.OPEN && isStarted) {
      setIsThinking(true);
      const context = canvas.getContext('2d');
      // Performance: Capture at lower resolution (720p max)
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Performance: Lower quality JPEG (0.3) for faster network transfer
      const frameData = canvas.toDataURL('image/jpeg', 0.3);
      
      socket.send(JSON.stringify({
        frame: frameData,
        text: transcript || "Presenting...",
        code: showEditor ? code : null,
        language: language // Pass language info to AI
      }));
    }
  }, [transcript, code, socket, showEditor, isStarted, language]);

  const startInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { frameRate: 10, width: { ideal: 1280 } }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setIsStarted(true);
      setCurrentQuestion("AI Agent connected. You may begin.");

      // Performance: 15s interval to reduce cumulative token load
      intervalRef.current = setInterval(captureAndSend, 15000); 
      startSTT();

      stream.getVideoTracks()[0].onended = () => stopInterview();
    } catch (err) {
      alert("Permission denied or hardware error.");
    }
  };

  const stopInterview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStarted(false);
    setCurrentQuestion("Session Terminated.");
  };

  const startSTT = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.continuous = true;
    rec.onresult = (e) => setTranscript(e.results[e.results.length - 1][0].transcript);
    rec.start();
  };

  return (
    <div className="session-container glass-card">
      <header className="session-header">
        <div className="ai-status">
          <div className={`ai-orb ${isThinking ? 'thinking' : 'ready'}`}></div>
          <div className="ai-text">
            <span className="label">{isThinking ? "AI ANALYZING" : "AI INTERVIEWER"}</span>
            <p className="message">{currentQuestion}</p>
          </div>
        </div>
        <div className="session-controls">
           {showEditor && (
             <select 
               className="lang-select" 
               value={language} 
               onChange={(e) => handleLanguageChange(e.target.value)}
             >
               <option value="javascript">JavaScript</option>
               <option value="python">Python</option>
               <option value="java">Java</option>
               <option value="cpp">C++</option>
             </select>
           )}
           <button className="icon-btn"><Settings2 size={18} /></button>
           <button className={`toggle-btn ${showEditor ? 'active' : ''}`} onClick={() => setShowEditor(!showEditor)}>
             <Code2 size={18} /> {showEditor ? "Hide Editor" : "Show Editor"}
           </button>
        </div>
      </header>

      <div className={`session-content ${showEditor ? 'split' : 'full'}`}>
        {showEditor && (
          <div className="editor-wrapper glass-card">
             <div className="pane-header">
               <Code2 size={14} /> SCRATCHPAD.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'js'}
             </div>
             <Editor
               height="500px"
               language={language}
               value={code}
               theme="vs-dark"
               onChange={(v) => setCode(v)}
               options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 20 } }}
             />
          </div>
        )}

        <div className="preview-wrapper glass-card">
           <div className="pane-header"><Monitor size={14} /> LIVE_FEED.stream</div>
           <div className="video-viewport">
              <video ref={videoRef} autoPlay playsInline muted className="main-video" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {!isStarted && (
                <div className="video-overlay" onClick={startInterview}>
                  <Camera size={48} />
                  <span>Start Live Feed</span>
                </div>
              )}
           </div>
           <div className="mic-status">
             {transcript ? <Mic size={14} color="#10b981" /> : <MicOff size={14} color="#ef4444" />}
             <span>{transcript || "Listening for speech..."}</span>
           </div>
        </div>
      </div>

      <style jsx>{`
        .session-container { padding: 25px; display: flex; flex-direction: column; gap: 25px; width: 100%; max-width: 1400px; margin: 0 auto; }
        .session-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
        
        .ai-status { display: flex; align-items: center; gap: 20px; }
        .ai-orb { width: 40px; height: 40px; border-radius: 50%; position: relative; }
        .ai-orb.ready { background: #38bdf8; box-shadow: 0 0 20px #38bdf8; }
        .ai-orb.thinking { background: #8b5cf6; animation: spin 2s linear infinite; }
        @keyframes spin { 0% { transform: scale(1); box-shadow: 0 0 10px #8b5cf6; } 50% { transform: scale(1.2); box-shadow: 0 0 30px #8b5cf6; } 100% { transform: scale(1); box-shadow: 0 0 10px #8b5cf6; } }
        
        .lang-select { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0 15px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; outline: none; }
        .lang-select option { background: #0f172a; color: white; }

        .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; }
        .message { font-size: 1.1rem; font-weight: 500; }

        .session-controls { display: flex; gap: 10px; }
        .icon-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; }
        .toggle-btn { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 0 20px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .toggle-btn.active { background: #38bdf8; color: white; }

        .session-content { display: flex; gap: 20px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .session-content.split > * { flex: 1; }
        .session-content.full .preview-wrapper { width: 100%; max-width: 900px; margin: 0 auto; }
        
        .pane-header { padding: 10px 15px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-muted); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); }
        .editor-wrapper, .preview-wrapper { overflow: hidden; border: 1px solid var(--border); }
        
        .video-viewport { position: relative; aspect-ratio: 16/9; background: #000; }
        .main-video { width: 100%; height: 100%; object-fit: cover; }
        .video-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; cursor: pointer; transition: background 0.2s; }
        .video-overlay:hover { background: rgba(0,0,0,0.4); color: #38bdf8; }
        
        .mic-status { padding: 15px; background: rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default InterviewSession;
