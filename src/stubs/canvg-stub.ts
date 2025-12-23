/**
 * Stub module for canvg and its dependencies.
 *
 * canvg is only needed for SVG-to-canvas conversion in jsPDF.
 * Since we use html2canvas for PDF generation (which captures DOM as raster images),
 * we don't need canvg's SVG parsing functionality.
 *
 * This stub prevents the canvg circular dependency issues from breaking the build.
 */

// Empty Canvg class that satisfies jsPDF's optional dependency check
export class Canvg {
  static from(): Promise<Canvg> {
    return Promise.resolve(new Canvg());
  }

  static fromString(): Promise<Canvg> {
    return Promise.resolve(new Canvg());
  }

  render(): Promise<void> {
    return Promise.resolve();
  }

  start(): void {
    // no-op
  }

  stop(): void {
    // no-op
  }
}

// Default export for canvg
export default Canvg;

// RGBColor stub
export class RGBColor {
  r = 0;
  g = 0;
  b = 0;
  a = 1;
  ok = false;

  constructor(_color?: string) {
    // no-op
  }

  toRGB(): string {
    return 'rgb(0,0,0)';
  }

  toHex(): string {
    return '#000000';
  }
}

// stackblur-canvas stub
export function blur(): void {
  // no-op
}

export function blurCanvas(): void {
  // no-op
}

export function blurImage(): void {
  // no-op
}
