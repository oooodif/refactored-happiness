import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import Splitting from 'splitting';
import 'splitting/dist/splitting.css';
import 'splitting/dist/splitting-cells.css';
import barba from '@barba/core';
import LocomotiveScroll from 'locomotive-scroll';
import * as THREE from 'three';
import particlesJS from 'particlesjs';
import './HyperIntro.css';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

interface HyperIntroProps {
  onComplete?: () => void;
}

const HyperIntro: React.FC<HyperIntroProps> = ({ onComplete }) => {
  // References for DOM elements
  const introContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  // Reference for Three.js scene
  const threeScene = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    geometry?: THREE.TorusGeometry;
    material?: THREE.MeshNormalMaterial;
    torus?: THREE.Mesh;
    animate?: () => void;
  }>({});

  // Initialize Splitting.js for text effects
  useEffect(() => {
    Splitting({
      target: '[data-splitting]',
      by: 'chars',
      key: null
    });
    
    // Initialize LocomotiveScroll for smooth scrolling
    const scrollContainer = document.querySelector('[data-scroll-container]');
    const scroll = new LocomotiveScroll({
      el: scrollContainer as HTMLElement,
      smooth: true,
      smartphone: {
        smooth: true
      },
      tablet: {
        smooth: true
      }
    });

    // Update scroll when window resizes
    window.addEventListener('resize', () => scroll.update());

    // Initialize Particles.js with glowing ultraviolet effects
    if (particlesRef.current) {
      particlesJS.load(particlesRef.current, {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: ['#ff00ff', '#9c27b0', '#673ab7', '#3f51b5']
          },
          shape: {
            type: 'circle',
            stroke: {
              width: 0,
              color: '#000000'
            }
          },
          opacity: {
            value: 0.7,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false
            }
          },
          size: {
            value: 4,
            random: true,
            anim: {
              enable: true,
              speed: 6,
              size_min: 0.1,
              sync: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#9c27b0',
            opacity: 0.5,
            width: 1
          },
          move: {
            enable: true,
            speed: 4,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200
            }
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: {
              enable: true,
              mode: 'repulse'
            },
            onclick: {
              enable: true,
              mode: 'push'
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1
              }
            },
            bubble: {
              distance: 400,
              size: 40,
              duration: 2,
              opacity: 8,
              speed: 3
            },
            repulse: {
              distance: 200,
              duration: 0.4
            },
            push: {
              particles_nb: 4
            },
            remove: {
              particles_nb: 2
            }
          }
        },
        retina_detect: true
      });
    }

    // Initialize THREE.js scene
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Create glowing torus geometry
      const geometry = new THREE.TorusGeometry(6, 1.5, 16, 100);
      const material = new THREE.MeshNormalMaterial({
        wireframe: true
      });
      
      const torus = new THREE.Mesh(geometry, material);
      scene.add(torus);
      camera.position.z = 15;
      
      // Animation function
      const animate = () => {
        requestAnimationFrame(animate);
        
        torus.rotation.x += 0.01;
        torus.rotation.y += 0.005;
        torus.rotation.z += 0.01;
        
        renderer.render(scene, camera);
      };
      
      // Store references to objects
      threeScene.current.scene = scene;
      threeScene.current.camera = camera;
      threeScene.current.renderer = renderer;
      threeScene.current.geometry = geometry;
      threeScene.current.material = material;
      threeScene.current.torus = torus;
      threeScene.current.animate = animate;
      
      // Begin animation
      animate();
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('resize', () => scroll.update());
        scroll.destroy();
        
        // Clean up THREE.js resources
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      };
    }
  }, [onComplete]);

  // Text animation sequence with GSAP
  useEffect(() => {
    if (textContainerRef.current) {
      const timeline = gsap.timeline({
        defaults: { duration: 1, ease: "power3.out" }
      });
      
      timeline
        // Animate in the first text line
        .from(".hero-text-1 .char", {
          opacity: 0,
          y: 100,
          rotateX: -90,
          stagger: 0.04,
          duration: 1.2
        })
        // Glitch effect
        .to(".hero-text-1 .char", {
          color: "#ff00ff",
          textShadow: "0 0 15px rgba(255, 0, 255, 0.8)",
          stagger: 0.02,
          duration: 0.2
        })
        .to(".hero-text-1 .char", {
          color: "white",
          textShadow: "0 0 0px rgba(255, 255, 255, 0)",
          stagger: 0.02,
          duration: 0.2
        })
        // Animate in the second text line
        .from(".hero-text-2 .char", {
          opacity: 0,
          scale: 0,
          filter: "blur(10px)",
          stagger: 0.03,
          duration: 1
        }, "-=0.5")
        // Animate in the third text line
        .from(".hero-text-3 .char", {
          opacity: 0,
          x: -100,
          stagger: 0.02,
          duration: 0.8
        }, "-=0.3")
        // Add a colored glow pulsating effect
        .to(".hero-text-container", {
          boxShadow: "0 0 40px rgba(156, 39, 176, 0.7)",
          duration: 2,
          repeat: -1,
          yoyo: true
        }, "-=0.5");
    }
  }, []);

  // Barba.js page transitions
  useEffect(() => {
    barba.init({
      transitions: [{
        name: 'opacity-transition',
        async leave(data) {
          const tween = gsap.to(data.current.container, {
            opacity: 0,
            duration: 0.5
          });
          return new Promise(resolve => {
            tween.eventCallback('onComplete', resolve);
          });
        },
        async enter(data) {
          const tween = gsap.from(data.next.container, {
            opacity: 0,
            duration: 0.5
          });
          return new Promise(resolve => {
            tween.eventCallback('onComplete', resolve);
          });
        }
      }]
    });

    return () => {
      barba.destroy();
    };
  }, []);

  return (
    <div 
      ref={introContainerRef} 
      className="hyper-intro-container"
      data-scroll-container
    >
      {/* Particle background */}
      <div 
        ref={particlesRef} 
        className="particles-background"
        id="particles-js"
      ></div>
      
      {/* THREE.js canvas */}
      <canvas 
        ref={canvasRef} 
        className="three-canvas"
      ></canvas>
      
      {/* Text content with splitting.js */}
      <div 
        ref={textContainerRef} 
        className="hero-text-container"
        data-scroll
        data-scroll-speed="2"
      >
        <h1 
          className="hero-text-1" 
          data-splitting
        >
          Transform Plain Text
        </h1>
        <h2 
          className="hero-text-2" 
          data-splitting
        >
          Into Beautiful LaTeX
        </h2>
        <h3 
          className="hero-text-3" 
          data-splitting
        >
          Powered by AI
        </h3>
        
        <div 
          className="cta-container"
          data-scroll
          data-scroll-speed="1"
          data-scroll-delay="0.1"
        >
          <button className="cta-button pulse-effect">
            Try It Now
          </button>
        </div>
      </div>
      
      {/* Animated info cards */}
      <div className="info-cards-container">
        <div 
          className="info-card"
          data-scroll
          data-scroll-speed="1.2"
        >
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
          <h4>Smart Formatting</h4>
          <p>Automatically formats your content with proper LaTeX structure</p>
        </div>
        
        <div 
          className="info-card"
          data-scroll
          data-scroll-speed="1.5"
        >
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
            </svg>
          </div>
          <h4>Instant Preview</h4>
          <p>See your LaTeX and PDF output in real-time as you type</p>
        </div>
        
        <div 
          className="info-card"
          data-scroll
          data-scroll-speed="1.8"
        >
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM21 19H3V5H21V19Z" fill="currentColor" />
              <path d="M9.5 12C10.88 12 12 10.88 12 9.5C12 8.12 10.88 7 9.5 7C8.12 7 7 8.12 7 9.5C7 10.88 8.12 12 9.5 12Z" fill="currentColor" />
              <path d="M5 17H14L11.5 13.5L9.5 16L8 14.5L5 17Z" fill="currentColor" />
            </svg>
          </div>
          <h4>Template Gallery</h4>
          <p>Choose from our library of professional LaTeX templates</p>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div 
        className="scroll-indicator"
        data-scroll
        data-scroll-speed="3"
        data-scroll-position="bottom"
      >
        <span>Scroll to explore</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default HyperIntro;