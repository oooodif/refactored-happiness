// TypeScript declarations for external modules

declare module 'splitting' {
  interface SplittingOptions {
    target?: string | HTMLElement;
    by?: string;
    matching?: string;
    key?: string | null;
  }

  interface SplittingResult {
    el: HTMLElement;
    chars: HTMLElement[];
    words: HTMLElement[];
    lines: HTMLElement[];
    [key: string]: any;
  }

  function splitting(options?: SplittingOptions): SplittingResult[];
  
  namespace splitting {
    function html(options?: SplittingOptions): string;
    function add(options?: { by: string, key: string, split: Function }): void;
  }
  
  export = splitting;
}

declare module '@barba/core' {
  interface BarbaOptions {
    transitions?: Array<{
      name?: string;
      leave?: (data: any) => Promise<any>;
      enter?: (data: any) => Promise<any>;
      once?: (data: any) => Promise<any>;
    }>;
    views?: Array<{
      namespace: string;
      beforeLeave?: (data: any) => void | Promise<any>;
      afterLeave?: (data: any) => void | Promise<any>;
      beforeEnter?: (data: any) => void | Promise<any>;
      afterEnter?: (data: any) => void | Promise<any>;
    }>;
    debug?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    prefetchIgnore?: boolean;
    timeout?: number;
    preventRunning?: boolean;
  }

  interface Barba {
    init(options?: BarbaOptions): void;
    destroy(): void;
    hooks: any;
    use: any;
  }

  const barba: Barba;
  export default barba;
}

declare module 'particlesjs' {
  interface ParticlesOptions {
    particles?: {
      number?: {
        value?: number;
        density?: {
          enable?: boolean;
          value_area?: number;
        };
      };
      color?: {
        value?: string | string[];
      };
      shape?: {
        type?: string | string[];
        stroke?: {
          width?: number;
          color?: string;
        };
      };
      opacity?: {
        value?: number;
        random?: boolean;
        anim?: {
          enable?: boolean;
          speed?: number;
          opacity_min?: number;
          sync?: boolean;
        };
      };
      size?: {
        value?: number;
        random?: boolean;
        anim?: {
          enable?: boolean;
          speed?: number;
          size_min?: number;
          sync?: boolean;
        };
      };
      line_linked?: {
        enable?: boolean;
        distance?: number;
        color?: string;
        opacity?: number;
        width?: number;
      };
      move?: {
        enable?: boolean;
        speed?: number;
        direction?: string;
        random?: boolean;
        straight?: boolean;
        out_mode?: string;
        bounce?: boolean;
        attract?: {
          enable?: boolean;
          rotateX?: number;
          rotateY?: number;
        };
      };
    };
    interactivity?: {
      detect_on?: string;
      events?: {
        onhover?: {
          enable?: boolean;
          mode?: string | string[];
        };
        onclick?: {
          enable?: boolean;
          mode?: string | string[];
        };
        resize?: boolean;
      };
      modes?: {
        grab?: {
          distance?: number;
          line_linked?: {
            opacity?: number;
          };
        };
        bubble?: {
          distance?: number;
          size?: number;
          duration?: number;
          opacity?: number;
          speed?: number;
        };
        repulse?: {
          distance?: number;
          duration?: number;
        };
        push?: {
          particles_nb?: number;
        };
        remove?: {
          particles_nb?: number;
        };
      };
    };
    retina_detect?: boolean;
  }

  interface Particles {
    load(element: HTMLElement | string, options: ParticlesOptions): void;
    extendArray: (source: any, target: any) => any;
    fn: any;
    hexToRgb: (hex: string) => any;
    init: (element: any, options: any) => void;
    pJS: any;
  }

  const particlesJS: Particles;
  export default particlesJS;
}

declare module 'locomotive-scroll' {
  export interface LocomotiveScrollOptions {
    el?: HTMLElement | Element | null;
    name?: string;
    offset?: [number, number];
    repeat?: boolean;
    smooth?: boolean;
    smoothMobile?: boolean;
    direction?: string;
    inertia?: number;
    class?: string;
    scrollbarClass?: string;
    scrollingClass?: string;
    draggingClass?: string;
    smoothClass?: string;
    initClass?: string;
    getSpeed?: boolean;
    getDirection?: boolean;
    getAcceleration?: boolean;
    multiplier?: number;
    firefoxMultiplier?: number;
    touchMultiplier?: number;
    resetNativeScroll?: boolean;
    reloadOnContextChange?: boolean;
    tablet?: {
      smooth?: boolean;
      direction?: string;
      breakpoint?: number;
    };
    smartphone?: {
      smooth?: boolean;
      direction?: string;
      breakpoint?: number;
    };
  }

  export default class LocomotiveScroll {
    constructor(options?: LocomotiveScrollOptions);
    
    destroy(): void;
    update(): void;
    start(): void;
    stop(): void;
    scrollTo(target: string | number | HTMLElement, options?: any): void;
    on(event: string, callback: (args?: any) => void): void;
  }
}

// For TS importing CSS files
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}