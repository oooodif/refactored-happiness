import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import HyperIntro from '@/components/hero/HyperIntro';
import '../components/hero/HyperIntro.css';

const IntroPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [introComplete, setIntroComplete] = useState(false);
  
  // Anthropomorphized blobs and glow effects for the background
  useEffect(() => {
    // Create glowing blobs
    const createGlowElements = () => {
      const container = document.getElementById('intro-container');
      if (!container) return;
      
      // Create ultraviolet glows
      for (let i = 1; i <= 3; i++) {
        const glow = document.createElement('div');
        glow.className = `ultraviolet-glow glow-${i}`;
        container.appendChild(glow);
      }
      
      // Create animated blobs
      for (let i = 1; i <= 3; i++) {
        const blob = document.createElement('div');
        blob.className = `animated-blob blob-${i}`;
        container.appendChild(blob);
      }
    };
    
    createGlowElements();
    
    // Create sparkle effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      // Create sparkle at random intervals
      if (Math.random() > 0.9) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${e.pageX}px`;
        sparkle.style.top = `${e.pageY}px`;
        document.body.appendChild(sparkle);
        
        // Remove sparkle after animation completes
        setTimeout(() => {
          sparkle.remove();
        }, 1500);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Handle the completion of the intro animation
  const handleIntroComplete = () => {
    setIntroComplete(true);
    
    // Navigate to the main application after a delay
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };
  
  // Function to skip intro and go directly to the application
  const handleSkipIntro = () => {
    setIntroComplete(true);
    navigate('/');
  };
  
  return (
    <div 
      id="intro-container" 
      className={`intro-page-container ${introComplete ? 'fade-out' : ''}`}
    >
      <HyperIntro onComplete={handleIntroComplete} />
      
      {/* Skip button */}
      <button 
        className="skip-intro-button"
        onClick={handleSkipIntro}
      >
        Skip Intro
      </button>
      
      {/* Additional UI elements could be added here */}
    </div>
  );
};

export default IntroPage;