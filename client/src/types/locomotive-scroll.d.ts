declare module 'locomotive-scroll' {
  export interface ScrollOptions {
    el?: HTMLElement;
    smooth?: boolean;
    smoothMobile?: boolean;
    resetNativeScroll?: boolean;
    lerp?: number;
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

  export interface ScrollInstance {
    destroy(): void;
    update(): void;
    start(): void;
    stop(): void;
    scrollTo(target: string | HTMLElement | number, options?: { offset?: number, duration?: number, callback?: () => void }): void;
    on(event: string, callback: (instance: any) => void): void;
    off(event: string, callback: (instance: any) => void): void;
  }

  export default class LocomotiveScroll {
    constructor(options?: ScrollOptions);
    
    destroy(): void;
    update(): void;
    start(): void;
    stop(): void;
    scrollTo(target: string | HTMLElement | number, options?: { offset?: number, duration?: number, callback?: () => void }): void;
    on(event: string, callback: (instance: any) => void): void;
    off(event: string, callback: (instance: any) => void): void;
  }
}