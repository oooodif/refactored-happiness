import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './HyperIntro.css';

// Ultra-modern intro component with ultraviolent anthropomorphized afterglow effect

interface HyperIntroProps {
  onComplete?: () => void;
}

const HyperIntro: React.FC<HyperIntroProps> = ({ onComplete }) => {
  // References for DOM elements
  const introContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);
  
  // Create particles and orb effects
  useEffect(() => {
    try {
      // Create particles
      if (particlesRef.current) {
        const particlesContainer = particlesRef.current;
        particlesContainer.innerHTML = '';
        particlesContainer.style.position = 'absolute';
        particlesContainer.style.top = '0';
        particlesContainer.style.left = '0';
        particlesContainer.style.width = '100%';
        particlesContainer.style.height = '100%';
        particlesContainer.style.overflow = 'hidden';
        particlesContainer.style.pointerEvents = 'none';
        
        // Create custom particles
        const particleCount = 80;
        const colors = ['#ff00ff', '#9c27b0', '#673ab7', '#3f51b5'];
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = 'ultraviolent-particle';
          
          // Random position
          const posX = Math.random() * 100;
          const posY = Math.random() * 100;
          
          // Random size
          const size = Math.random() * 5 + 2;
          
          // Random color from our palette
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          // Set particle styles
          particle.style.position = 'absolute';
          particle.style.left = `${posX}%`;
          particle.style.top = `${posY}%`;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.borderRadius = '50%';
          particle.style.backgroundColor = color;
          particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
          particle.style.opacity = `${Math.random() * 0.7 + 0.3}`;
          
          // Add random animation with keyframes
          const duration = Math.random() * 15 + 10;
          const delay = Math.random() * 10;
          
          // Create unique animation name
          const animName = `particle-${i}-float`;
          
          // Create and append style with keyframes
          const style = document.createElement('style');
          style.innerHTML = `
            @keyframes ${animName} {
              0% {
                transform: translate(0, 0) scale(1);
                opacity: ${Math.random() * 0.5 + 0.5};
              }
              25% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(${Math.random() + 0.5});
              }
              50% {
                transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(${Math.random() + 0.2});
                opacity: ${Math.random() * 0.5 + 0.3};
              }
              75% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(${Math.random() + 0.5});
              }
              100% {
                transform: translate(0, 0) scale(1);
                opacity: ${Math.random() * 0.5 + 0.5};
              }
            }
          `;
          document.head.appendChild(style);
          
          // Apply animation
          particle.style.animation = `${animName} ${duration}s ease-in-out ${delay}s infinite`;
          
          // Add to container
          particlesContainer.appendChild(particle);
        }
        
        // Add mouse follow effect
        particlesContainer.addEventListener('mousemove', (e) => {
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          
          // Get all particles
          const particles = particlesContainer.querySelectorAll('.ultraviolent-particle');
          
          // Animate particles to slightly follow mouse
          particles.forEach((particle) => {
            const rect = particle.getBoundingClientRect();
            const particleX = rect.left + rect.width / 2;
            const particleY = rect.top + rect.height / 2;
            
            // Calculate distance
            const distX = mouseX - particleX;
            const distY = mouseY - particleY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            // Only affect particles within 200px
            if (distance < 200) {
              const moveX = distX * 0.05;
              const moveY = distY * 0.05;
              
              // Apply gentle attraction effect
              gsap.to(particle, {
                x: `+=${moveX}`,
                y: `+=${moveY}`,
                duration: 2,
                ease: 'power2.out'
              });
            }
          });
        });
      }

      // Create the glowing orb effect
      if (orbContainerRef.current) {
        const container = orbContainerRef.current;
        container.innerHTML = '';
        
        // Central orb
        const orb = document.createElement('div');
        orb.className = 'glowing-orb';
        container.appendChild(orb);
        
        // Pulsing rings
        for (let i = 0; i < 3; i++) {
          const ring = document.createElement('div');
          ring.className = `glowing-orb-ring ring${i+1}`;
          container.appendChild(ring);
        }
      }
    } catch (error) {
      console.error("Error creating particles:", error);
    }
  }, []);

  // Text animation sequence with GSAP
  useEffect(() => {
    try {
      if (textContainerRef.current) {
        const timeline = gsap.timeline({
          defaults: { duration: 1, ease: "power3.out" }
        });
        
        // Create text animation for each heading
        const title = textContainerRef.current.querySelector('.hero-text-1');
        const subtitle = textContainerRef.current.querySelector('.hero-text-2');
        const subsubtitle = textContainerRef.current.querySelector('.hero-text-3');
        const cta = textContainerRef.current.querySelector('.cta-button');
        
        if (title && subtitle && subsubtitle && cta) {
          timeline
            .from(title, {
              opacity: 0,
              y: 50,
              duration: 1.2
            })
            .to(title, {
              color: "#ff00ff",
              textShadow: "0 0 15px rgba(255, 0, 255, 0.8)",
              duration: 0.2
            })
            .to(title, {
              color: "white",
              textShadow: "0 0 0px rgba(255, 255, 255, 0)",
              duration: 0.2
            })
            .from(subtitle, {
              opacity: 0,
              y: 30,
              duration: 1
            }, "-=0.5")
            .from(subsubtitle, {
              opacity: 0,
              y: 30,
              duration: 0.8
            }, "-=0.3")
            .from(cta, {
              opacity: 0,
              scale: 0.8,
              duration: 0.8
            }, "-=0.2")
            .to(".hero-text-container", {
              boxShadow: "0 0 40px rgba(156, 39, 176, 0.7)",
              duration: 2,
              repeat: -1,
              yoyo: true
            }, "-=0.5");
        }
      }
    } catch (error) {
      console.error("Error animating text:", error);
    }
  }, []);

  // Page transitions using GSAP
  useEffect(() => {
    try {
      // Create fade-in animation on component mount
      if (introContainerRef.current) {
        gsap.fromTo(introContainerRef.current, 
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: 0.8, 
            ease: "power2.out" 
          }
        );
      }
    } catch (error) {
      console.error("Error with page transitions:", error);
    }

    return () => {
      // Clean up any animations on unmount
      if (introContainerRef.current) {
        gsap.killTweensOf(introContainerRef.current);
      }
    };
  }, []);

  // Handle click on Enter button
  const handleEnterClick = () => {
    if (onComplete && introContainerRef.current) {
      // Create exit animation
      gsap.to(introContainerRef.current, {
        opacity: 0, 
        duration: 0.8,
        ease: "power2.in",
        onComplete: onComplete
      });
    }
  };

  return (
    <div 
      ref={introContainerRef} 
      className="hyper-intro-container"
    >
      {/* Custom particle background */}
      <div 
        ref={particlesRef} 
        className="ultraviolent-particles-container"
      ></div>
      
      {/* Text content */}
      <div 
        ref={textContainerRef} 
        className="hero-text-container"
      >
        <h1 className="hero-text-1">
          Unleash LaTeX Power
        </h1>
        <h2 className="hero-text-2">
          With Artificial Intelligence
        </h2>
        <h3 className="hero-text-3">
          From Thought to Publication in Seconds
        </h3>
        
        {/* Glowing orb effect - represents the "ultraviolent afterglow" */}
        <div ref={orbContainerRef} className="glowing-orb-container"></div>
        
        <div className="cta-container">
          <button 
            className="cta-button pulse-effect"
            onClick={handleEnterClick}
            aria-label="Generate LaTeX with AI"
          >
            Generate Brilliance
          </button>
        </div>
      </div>
      
      {/* Animated info cards */}
      <div className="info-cards-container">
        <div className="info-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 7H7V9H9V7Z" fill="currentColor" />
              <path d="M7 13V11H9V13H7Z" fill="currentColor" />
              <path d="M7 15V17H9V15H7Z" fill="currentColor" />
              <path d="M11 15V17H17V15H11Z" fill="currentColor" />
              <path d="M17 13V11H11V13H17Z" fill="currentColor" />
              <path d="M17 7V9H11V7H17Z" fill="currentColor" />
            </svg>
          </div>
          <h4>Mathematical Perfection</h4>
          <p>Advanced AI algorithms transform your ideas into flawless LaTeX equations and structures instantly</p>
        </div>
        
        <div className="info-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
            </svg>
          </div>
          <h4>Anthropomorphic Intelligence</h4>
          <p>Our AI understands the way you think, adapting to your research style and academic preferences over time</p>
        </div>
        
        <div className="info-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM21 19H3V5H21V19Z" fill="currentColor" />
              <path d="M9.5 12C10.88 12 12 10.88 12 9.5C12 8.12 10.88 7 9.5 7C8.12 7 7 8.12 7 9.5C7 10.88 8.12 12 9.5 12Z" fill="currentColor" />
              <path d="M5 17H14L11.5 13.5L9.5 16L8 14.5L5 17Z" fill="currentColor" />
            </svg>
          </div>
          <h4>Ultraviolent Speed</h4>
          <p>Destroy writer's block instantly with text-to-LaTeX conversion that's faster than human thought</p>
        </div>
      </div>
      
      {/* Animated glitch text */}
      <div className="glitch-text-container">
        <div className="glitch-text" data-text="AI LATEX GENERATOR">AI LATEX GENERATOR</div>
      </div>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <span>ENTER THE VOID</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default HyperIntro;