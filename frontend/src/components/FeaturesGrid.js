import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturesGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🔍',
      title: 'Search',
      description: 'Search and explore our comprehensive database of apple varieties with detailed information and characteristics.',
      onClick: () => navigate('/library')
    },
    {
      icon: '📥',
      title: 'Export Data',
      description: 'Download variety information as PDF documents for offline reference and sharing.',
      onClick: () => navigate('/library')
    }
  ];

  return (
    <section className="features-section">
      <h2>Why Choose AppleVerse 2.0?</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            onClick={feature.onClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesGrid;