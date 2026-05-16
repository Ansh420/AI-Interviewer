import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PlayCircle, Award, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const FeedbackPage = ({ scores, reportId, videoUrl, timeline }) => {
  const videoRef = useRef(null);
  
  const { tech, clarity, originality, feedback } = scores || {
    tech: 0,
    clarity: 0,
    originality: 0,
    feedback: "No feedback available."
  };

  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-card glass-card">
        <header className="feedback-header">
          <Award size={48} color="#f59e0b" />
          <h1>Interview Performance Report</h1>
          <p>Session ID: #{reportId || 'N/A'}</p>
        </header>

        <div className="scores-grid">
          <ScoreWidget label="Technical Depth" score={tech} color="#38bdf8" />
          <ScoreWidget label="Communication" score={clarity} color="#10b981" />
          <ScoreWidget label="Originality" score={originality} color="#a855f7" />
        </div>

        {videoUrl && (
          <div className="video-review-section">
            <h3><PlayCircle size={20} /> Video Review & Timeline</h3>
            <div className="video-container glass-card">
              <video ref={videoRef} src={videoUrl} controls className="review-video" />
              
              <div className="timeline-heatmap">
                {timeline && timeline.map((event, idx) => (
                  <div 
                    key={idx}
                    className={`timeline-marker ${event.marker || 'blue'}`}
                    style={{ left: `${(event.timestamp / (timeline[timeline.length-1]?.timestamp || 1)) * 100}%` }}
                    title={`${event.type}: ${event.timestamp}s`}
                    onClick={() => jumpToTime(event.timestamp)}
                  />
                ))}
              </div>
            </div>
            
            <div className="timeline-list">
              {timeline && timeline.filter(e => e.type === "CODE_EXECUTION").map((event, idx) => (
                <div key={idx} className="timeline-item glass-card" onClick={() => jumpToTime(event.timestamp)}>
                  <div className="item-time"><Clock size={12} /> {event.timestamp}s</div>
                  <div className="item-content">
                    <div className="item-header">
                      {event.marker === 'red' ? <AlertCircle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#10b981" />}
                      <span>Code Execution Critique</span>
                    </div>
                    <p>{event.ai_comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="feedback-summary glass-card">
          <h3>Overall Interviewer Feedback</h3>
          <div className="feedback-text markdown-content">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
          style={{ marginTop: '20px' }}
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
};

const ScoreWidget = ({ label, score, color }) => (
  <div className="score-widget">
    <div className="score-bar-bg">
      <div className="score-bar-fill" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
    <div className="score-info">
      <span className="score-label">{label}</span>
      <span className="score-value">{score}%</span>
    </div>
  </div>
);

export default FeedbackPage;
