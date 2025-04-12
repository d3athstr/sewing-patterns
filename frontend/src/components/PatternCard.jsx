import React, { useState } from 'react';
import './lcars.css';

function PatternCard({ pattern }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="pattern-card-container" onClick={toggleExpand}>
      <img
        src={`data:image/jpeg;base64,${pattern.image_data}`}
        alt={pattern.title}
        className={`pattern-card ${isExpanded ? 'pattern-card-large' : ''}`}
      />
      <div className="pattern-details">
        <h3>{pattern.title}</h3>
        {isExpanded && (
          <div className="pattern-description">
            <p>{pattern.description}</p>
            {/* Include any additional details you want to show when expanded */}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatternCard;
