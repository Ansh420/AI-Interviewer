import React from 'react';

const FeedbackReport = ({ scores, reportId }) => {
  // If scores weren't passed directly, you could fetch them here using the reportId
  const { tech, clarity, originality, feedback } = scores || {
    tech: 0,
    clarity: 0,
    originality: 0,
    feedback: "No feedback available."
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={headerStyle}>Interview Performance Report</h1>
        <p style={subHeaderStyle}>Session ID: #{reportId || 'N/A'}</p>

        <div style={gridStyle}>
          <ScoreCircle label="Technical Depth" score={tech} color="#3498db" />
          <ScoreCircle label="Clarity" score={clarity} color="#2ecc71" />
          <ScoreCircle label="Originality" score={originality} color="#9b59b6" />
        </div>

        <div style={feedbackSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Interviewer's Detailed Feedback</h3>
          <p style={feedbackText}>{feedback}</p>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          style={buttonStyle}
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
};

// Helper Component for the Circular/Bar Scores
const ScoreCircle = ({ label, score, color }) => (
  <div style={scoreItemStyle}>
    <div style={progressBarContainer}>
      <div style={progressBar(score, color)} />
    </div>
    <span style={scoreLabel}>{label}</span>
    <span style={scoreValue}>{score}%</span>
  </div>
);

// --- Styles ---
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '40px 20px',
  backgroundColor: '#f4f7f6',
  minHeight: '80vh'
};

const cardStyle = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  maxWidth: '800px',
  width: '100%',
  textAlign: 'center'
};

const headerStyle = { color: '#2c3e50', fontSize: '2rem', marginBottom: '5px' };
const subHeaderStyle = { color: '#95a5a6', fontSize: '0.9rem', marginBottom: '30px' };

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
  marginBottom: '40px'
};

const scoreItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center' };

const progressBarContainer = {
  width: '100%',
  height: '10px',
  backgroundColor: '#ecf0f1',
  borderRadius: '5px',
  overflow: 'hidden',
  marginBottom: '10px'
};

const progressBar = (score, color) => ({
  width: `${score}%`,
  height: '100%',
  backgroundColor: color,
  transition: 'width 1s ease-in-out'
});

const scoreLabel = { fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase' };
const scoreValue = { fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' };

const feedbackSection = {
  textAlign: 'left',
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: '5px solid #3498db',
  marginBottom: '30px'
};

const feedbackText = { lineHeight: '1.6', color: '#34495e', fontStyle: 'italic' };

const buttonStyle = {
  padding: '12px 30px',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '30px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.3s'
};

export default FeedbackReport;