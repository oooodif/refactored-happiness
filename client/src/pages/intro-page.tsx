import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import HyperIntro from '@/components/hero/HyperIntro';
import './intro-page.css';

/**
 * Intro page with animated storytelling experience
 * Features:
 * - Ultra-modern animations using GSAP, Three.js, Splitting.js
 * - Interactive particle system
 * - Smooth transitions with Barba.js
 * - Skip button for users who want to directly access the app
 */
const IntroPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Show skip button after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, 1500); // Show after 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Handle completion of the intro animation
  const handleIntroComplete = () => {
    setIsCompleting(true);
    
    // Add the fade-out class to container
    const container = document.querySelector('.intro-page-container');
    if (container) {
      container.classList.add('fade-out');
    }
    
    // Navigate to main app after fade animation completes
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  // Handle skip button click
  const handleSkip = () => {
    handleIntroComplete();
  };

  return (
    <div className={`intro-page-container ${isCompleting ? 'fade-out' : ''}`}>
      {/* Skip intro button */}
      {showSkipButton && (
        <button 
          className="skip-intro-button"
          onClick={handleSkip}
          aria-label="Skip intro animation"
        >
          Skip Intro
        </button>
      )}
      
      {/* Main intro animation component */}
      <HyperIntro onComplete={handleIntroComplete} />
    </div>
  );
};

export default IntroPage;