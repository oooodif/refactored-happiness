/**
 * Locomotive Scroll Manager
 * A wrapper for the Locomotive Scroll library to manage smooth scrolling behavior
 */

import LocomotiveScroll from 'locomotive-scroll';
import { ScrollInstance } from 'locomotive-scroll';

interface ScrollOptions {
  el?: HTMLElement;
  smooth?: boolean;
  smoothMobile?: boolean;
  resetNativeScroll?: boolean;
  lerp?: number; // Linear interpolation factor (0 = instant, 1 = never)
  getDirection?: boolean;
  getSpeed?: boolean;
  class?: string;
  initPosition?: { x: number, y: number };
  scrollFromAnywhere?: boolean;
  multiplier?: number;
  touchMultiplier?: number;
  scrollbarContainer?: HTMLElement;
  reloadOnContextChange?: boolean;
  smartphone?: {
    smooth?: boolean;
    breakpoint?: number;
  };
  tablet?: {
    smooth?: boolean;
    breakpoint?: number;
  };
}

class ScrollManager {
  private static instance: ScrollManager;
  private locomotiveScroll: ScrollInstance | null = null;
  private initialized: boolean = false;
  private rootElement: HTMLElement | null = null;
  private options: ScrollOptions = {
    smooth: true,
    smoothMobile: true,
    lerp: 0.08, // Lower value = faster scrolling
    resetNativeScroll: true,
    smartphone: {
      smooth: true,
      breakpoint: 767
    },
    tablet: {
      smooth: true, 
      breakpoint: 1024
    },
    class: 'is-inview',
    getDirection: true,
    getSpeed: true,
    scrollFromAnywhere: true,
    reloadOnContextChange: true
  };

  private constructor() {}

  public static getInstance(): ScrollManager {
    if (!ScrollManager.instance) {
      ScrollManager.instance = new ScrollManager();
    }
    
    return ScrollManager.instance;
  }

  /**
   * Initialize the Locomotive Scroll instance
   */
  public init(rootElement?: HTMLElement, options?: Partial<ScrollOptions>): void {
    // Don't initialize if already initialized or if we're not in a browser context
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      console.log('Initializing Locomotive Scroll');
      
      // Use provided root element or default to document.body
      this.rootElement = rootElement || document.body;
      
      // Merge default options with provided options
      const mergedOptions: ScrollOptions = { 
        ...this.options, 
        ...options,
        el: this.rootElement
      };
      
      // Create locomotive scroll instance
      this.locomotiveScroll = new LocomotiveScroll(mergedOptions);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      
      // Let it settle
      setTimeout(() => {
        this.update();
      }, 100);

    } catch (error) {
      console.error('Failed to initialize Locomotive Scroll:', error);
    }
  }

  /**
   * Update the scroll instance (call after DOM changes)
   */
  public update(): void {
    if (this.locomotiveScroll) {
      try {
        this.locomotiveScroll.update();
      } catch (error) {
        console.error('Failed to update Locomotive Scroll:', error);
      }
    }
  }

  /**
   * Scroll smoothly to a specific target
   */
  public scrollTo(target: string | HTMLElement | number, options?: { offset?: number, duration?: number, callback?: () => void }): void {
    if (!this.locomotiveScroll) return;
    
    try {
      this.locomotiveScroll.scrollTo(target, options);
    } catch (error) {
      console.error('Failed to scroll to target:', error);
      
      // Fallback to native scroll if locomotive scroll fails
      if (typeof target === 'number') {
        window.scrollTo({
          top: target,
          behavior: 'smooth'
        });
      } else if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  /**
   * Destroy the Locomotive Scroll instance
   */
  public destroy(): void {
    if (this.locomotiveScroll) {
      try {
        this.locomotiveScroll.destroy();
        this.locomotiveScroll = null;
        this.initialized = false;
      } catch (error) {
        console.error('Failed to destroy Locomotive Scroll:', error);
      }
    }
  }

  /**
   * Set up additional event listeners
   */
  private setupEventListeners(): void {
    if (!this.locomotiveScroll) return;
    
    // Listen for scroll start
    this.locomotiveScroll.on('scroll', (instance: any) => {
      // You can trigger custom animations based on scroll position here
    });
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', this.destroy.bind(this));
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (this.locomotiveScroll) {
      // Debounce the update
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        this.update();
      }, 200);
    }
  }

  private resizeTimeout: NodeJS.Timeout | null = null;
}

export default ScrollManager.getInstance();