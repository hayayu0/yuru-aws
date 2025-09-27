declare module 'roughjs/bundled/rough.esm' {
  export interface RoughGenerator {
    path(pathData: string, options?: any): Drawable;
    polygon(points: [number, number][], options?: any): Drawable;
  }

  export interface OpSet {
    type: string;
    ops: Op[];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  }

  export interface Op {
    op: string;
    data: number[];
  }

  export interface Drawable {
    shape: string;
    sets: OpSet[];
  }

  export interface RoughJS {
    generator(): RoughGenerator;
  }

  const rough: RoughJS;
  export default rough;
}

// Export types for use in other modules
export interface OpSet {
  type: string;
  ops: Op[];
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

export interface Op {
  op: string;
  data: number[];
}