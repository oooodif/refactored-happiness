import ScrollManager from './locomotive-scroll-manager';

interface KeyboardHelperOptions {
  // Target element to scroll to (default: document body)
  targetElement?: HTMLElement | null;
  
  // Whether debug logs should be shown
  debug?: boolean;
  
  // Mobile width breakpoint
  mobileBreakpoint?: number;
  
  // Animation duration in ms
  animationDuration?: number;
  
  // Whether to trigger animations along with scrolling
  animateUI?: boolean;
  
  // Custom animation class to add to elements with data-animate-on-keyboard-dismiss
  animationClass?: string;
  
  // Whether to use Locomotive Scroll instead of native scroll
  useLocomotiveScroll?: boolean;
}

/**
 * MobileKeyboardHelper
 * 
 * Provides robust keyboard detection and scroll handling for mobile devices,
 * particularly for iOS Safari where keyboard events are difficult to detect.
 */
export class MobileKeyboardHelper {
  private options: Required<KeyboardHelperOptions>;
  private isKeyboardOpen: boolean = false;
  private initialHeight: number = window.innerHeight;
  private touchStartY: number = 0;
  private focusedElement: Element | null = null;
  private isInitialized: boolean = false;
  
  // Default options
  private readonly DEFAULT_OPTIONS: Required<KeyboardHelperOptions> = {
    targetElement: null,
    debug: false,
    mobileBreakpoint: 768,
    animationDuration: 800,
    animateUI: true,
    animationClass: 'keyboard-dismiss-animate',
    useLocomotiveScroll: true,
  };
  
  constructor(options?: KeyboardHelperOptions) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
    this.log('Mobile keyboard helper initialized with options:', this.options);
  }
  
  /**
   * Initialize all keyboard detection methods
   */
  public init(): void {
    // Only run on mobile devices
    if (!this.isMobileDevice()) {
      this.log('Not a mobile device, skipping keyboard helper');
      return;
    }
    
    if (this.isInitialized) {
      this.log('Already initialized');
      return;
    }
    
    this.log('Initializing mobile keyboard helper');
    
    // Set initial height
    this.initialHeight = window.innerHeight;
    
    // Set up Locomotive Scroll if needed
    if (this.options.useLocomotiveScroll) {
      // Initialize with custom options
      ScrollManager.init(document.documentElement, {
        smooth: true,
        smoothMobile: true,
        lerp: 0.05, // Slightly lower is faster
        resetNativeScroll: true,
      });
    }
    
    // Initialize all detection methods
    this.setupInputListeners();
    this.setupResizeListener();
    this.setupTouchListeners();
    this.setupVisibilityListener();
    this.setupButtonPress();
    
    // Periodically update initial height to handle orientation changes
    setInterval(() => {
      if (!this.isKeyboardOpen) {
        this.initialHeight = window.innerHeight;
        this.log('Updated initial height:', this.initialHeight);
      }
    }, 5000);
    
    this.isInitialized = true;
  }
  
  /**
   * Clean up all event listeners
   */
  public destroy(): void {
    // Clean up Locomotive Scroll if used
    if (this.options.useLocomotiveScroll) {
      ScrollManager.destroy();
    }
    
    // Global event listeners should be cleaned up by the user
    this.log('Keyboard helper destroyed');
    this.isInitialized = false;
  }
  
  /**
   * Force a scroll to the target element
   */
  public scrollToTarget(): void {
    this.performScrollToTarget();
  }
  
  /**
   * DETECTION METHOD 1: Direct focus/blur tracking on input fields
   */
  private setupInputListeners(): void {
    // Focus event - keyboard opening
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLElement) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          this.log('Input focused - keyboard likely visible');
          this.isKeyboardOpen = true;
          this.focusedElement = e.target;
        }
      }
    }, true);
    
    // Blur event - keyboard dismissal
    document.addEventListener('focusout', (e) => {
      if (e.target instanceof HTMLElement) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          this.log('Input blurred - keyboard likely dismissed');
          
          // Wait to ensure keyboard is fully dismissed
          setTimeout(() => {
            if (document.activeElement !== e.target) {
              this.isKeyboardOpen = false;
              this.focusedElement = null;
              this.performScrollToTarget();
            }
          }, 250);
        }
      }
    }, true);
  }
  
  /**
   * DETECTION METHOD 2: Window resize monitoring for keyboard
   */
  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      // Keyboard opening (window height decreases significantly)
      if (!this.isKeyboardOpen && window.innerHeight < this.initialHeight * 0.8) {
        this.log('Window height decreased - keyboard detected');
        this.isKeyboardOpen = true;
      }
      
      // Keyboard dismissal (window height increases back to normal)
      if (this.isKeyboardOpen && window.innerHeight > this.initialHeight * 0.9) {
        this.log('Window height increased - keyboard dismissed');
        this.isKeyboardOpen = false;
        this.performScrollToTarget();
      }
    });
  }
  
  /**
   * DETECTION METHOD 3: Touch events to catch dismissals
   */
  private setupTouchListeners(): void {
    // Track touch start position
    document.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    // Detect downward swipes which often dismiss keyboard
    document.addEventListener('touchend', (e) => {
      if (this.isKeyboardOpen && e.changedTouches[0].clientY - this.touchStartY > 30) {
        this.log('Downward swipe detected - likely keyboard dismissal');
        
        // Short delay to let native keyboard animation complete
        setTimeout(() => {
          this.isKeyboardOpen = false;
          this.performScrollToTarget();
        }, 300);
      }
    }, { passive: true });
  }
  
  /**
   * DETECTION METHOD 4: Visibility change (user switches apps/tabs and returns)
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isKeyboardOpen) {
        this.log('Page became visible again - checking keyboard state');
        
        // User returned to the page - keyboard likely dismissed
        setTimeout(() => {
          if (window.innerHeight > this.initialHeight * 0.9) {
            this.isKeyboardOpen = false;
            this.performScrollToTarget();
          }
        }, 300);
      }
    });
  }
  
  /**
   * Special button press listener for iOS
   */
  private setupButtonPress(): void {
    // iOS "Done" button is typically at the bottom right of keyboard
    // Clicking anywhere near bottom of screen after typing might indicate Done button
    document.addEventListener('click', (e) => {
      if (this.isKeyboardOpen && e.clientY > window.innerHeight * 0.7) {
        this.log('Bottom screen click detected - might be keyboard dismissal');
        
        setTimeout(() => {
          if (document.activeElement !== this.focusedElement) {
            this.isKeyboardOpen = false;
            this.performScrollToTarget();
          }
        }, 200);
      }
    });
  }
  
  /**
   * Perform the actual scroll to target with animation
   */
  private performScrollToTarget(): void {
    this.log('Scrolling to target with animation');
    
    // Animate UI elements if enabled
    if (this.options.animateUI) {
      this.animateUIElements();
    }
    
    // Use Locomotive Scroll for smooth scrolling if enabled
    if (this.options.useLocomotiveScroll) {
      const targetElement = this.options.targetElement || document.documentElement;
      ScrollManager.scrollTo(targetElement, {
        duration: this.options.animationDuration, 
        callback: () => this.log('Scroll complete')
      });
    } 
    // Otherwise use native scroll
    else {
      // Method 1: Standard smooth scroll
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      
      // Method 2: Set scroll directly (fallback)
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
      
      // Method 3: Force body to top
      setTimeout(() => {
        if (window.scrollY > 0) {
          document.body.scrollTop = 0; // For Safari
          document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        }
      }, 100);
    }
  }
  
  /**
   * Animate UI elements for visual interest
   */
  private animateUIElements(): void {
    // Find elements with data-animate-on-keyboard-dismiss attribute
    const animatableElements = document.querySelectorAll('[data-animate-on-keyboard-dismiss]');
    
    if (animatableElements.length > 0) {
      animatableElements.forEach((element, index) => {
        // Add animation class
        element.classList.add(this.options.animationClass);
        
        // Also add sequential stagger class if the element has a data-stagger attribute
        if (element.hasAttribute('data-stagger')) {
          element.classList.add(`stagger-item-${index + 1}`);
        }
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          element.classList.remove(this.options.animationClass);
          element.classList.remove(`stagger-item-${index + 1}`);
        }, this.options.animationDuration);
      });
    } 
    // Fallback to header and floating rects if no specific elements are marked
    else {
      // Try to find some common elements
      const header = document.querySelector('header');
      const floatingRect1 = document.getElementById('FloatingRectInput');
      const floatingRect2 = document.getElementById('FloatingRectOutput');
      
      // Only animate elements if they exist
      if (header) {
        header.classList.add(this.options.animationClass);
        setTimeout(() => header.classList.remove(this.options.animationClass), this.options.animationDuration);
      }
      
      if (floatingRect1) {
        floatingRect1.classList.add(this.options.animationClass, 'ripple-out-animate');
        setTimeout(() => {
          floatingRect1.classList.remove(this.options.animationClass, 'ripple-out-animate');
        }, this.options.animationDuration);
      }
      
      if (floatingRect2) {
        floatingRect2.classList.add(this.options.animationClass);
        setTimeout(() => floatingRect2.classList.remove(this.options.animationClass), this.options.animationDuration);
      }
    }
  }
  
  /**
   * Check if the current device is a mobile device
   */
  private isMobileDevice(): boolean {
    return window.innerWidth < this.options.mobileBreakpoint;
  }
  
  /**
   * Log messages if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('📱 [KeyboardHelper]', ...args);
    }
  }
}

// Singleton instance for ease of use
let instance: MobileKeyboardHelper | null = null;

/**
 * Get or create the keyboard helper instance
 */
export function getMobileKeyboardHelper(options?: KeyboardHelperOptions): MobileKeyboardHelper {
  if (!instance) {
    instance = new MobileKeyboardHelper(options);
  }
  return instance;
}

export default getMobileKeyboardHelper;