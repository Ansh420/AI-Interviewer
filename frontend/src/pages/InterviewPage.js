import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Camera, Code2, Monitor, Mic, MicOff, Settings2 } from 'lucide-react';

const InterviewPage = ({ socket, onStop, initialMode }) => {
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
    </div>
  );
};

export default InterviewPage;
