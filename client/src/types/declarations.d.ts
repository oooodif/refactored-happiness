// Declare modules for external packages that don't have TypeScript definitions

declare module 'three' {
  export class Scene {
    add(object: any): void;
    remove(object: any): void;
  }
  export class PerspectiveCamera {
    constructor(fov: number, aspect: number, near: number, far: number);
    position: { x: number; y: number; z: number };
    aspect: number;
    updateProjectionMatrix(): void;
  }
  export class WebGLRenderer {
    constructor(options: { canvas: HTMLCanvasElement, alpha: boolean, antialias: boolean });
    setSize(width: number, height: number): void;
    setPixelRatio(ratio: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    domElement: HTMLCanvasElement;
    dispose(): void;
  }
  export class TorusGeometry {
    constructor(radius: number, tube: number, radialSegments: number, tubularSegments: number, arc?: number);
    dispose(): void;
  }
  export class MeshNormalMaterial {
    constructor(options?: { wireframe?: boolean });
    dispose(): void;
  }
  export class Mesh {
    constructor(geometry: TorusGeometry, material: MeshNormalMaterial);
    rotation: { x: number; y: number; z: number };
  }
}

declare module 'particlesjs';
declare module 'splitting';
declare module 'locomotive-scroll';
declare module '@barba/core';