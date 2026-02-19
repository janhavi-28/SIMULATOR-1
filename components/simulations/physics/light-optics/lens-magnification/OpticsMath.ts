/**
 * OPTICS MATH — Convex lens physics only.
 * All lens formula and ray geometry live here. No UI, no canvas.
 *
 * Sign conventions:
 * - School Geometry: u, v, f positive as distances; object left at -u, F at ±f, image at +v (real) or -v (virtual).
 * - Cartesian: u negative (object left), v positive (image right) for real; f positive for convex.
 *
 * Formula: 1/f = 1/v + 1/u  =>  v = f*u/(u-f) (school, u>0) or v = f*u/(u+f) with u negative (cartesian).
 * m = v/u,  hi = m * ho.
 * Origin = optical center. x-axis = principal axis, y = height; object base on axis (y = 0).
 */

export type SignConvention = "school" | "cartesian";

export type ObjectType = "pencil" | "arrow" | "tree" | "human" | "apple";

export type LensType = "convex" | "concave";

export interface LensState {
  u: number;
  f: number;
  ho: number;
  signConvention: SignConvention;
  objectType: ObjectType;
  /** Convex (converging) or concave (diverging). */
  lensType: LensType;
}

export const LENS_TYPE_OPTIONS: readonly LensType[] = ["convex", "concave"];

export const OBJECT_TYPE_OPTIONS: readonly ObjectType[] = ["pencil", "arrow", "tree", "human", "apple"];

export interface LensResult {
  objectX: number;
  objectTipY: number;
  fLeft: number;
  fRight: number;
  f2Left: number;
  f2Right: number;
  imageX: number | null;
  imageTipY: number | null;
  m: number;
  hi: number;
  v: number | null;
  isReal: boolean;
  isErect: boolean;
  sizeType: "enlarged" | "diminished" | "same";
  /** Convex or concave for drawing. */
  lensType: LensType;
}

const EPS = 0.01;

/**
 * Image distance from 1/f = 1/v + 1/u => v = f*u/(u-f).
 * Convex: f > 0, real image (v > 0) when u > f; virtual when u < f.
 * Concave: f_eff = -|f|, always virtual (v < 0), image on same side as object.
 */
export function computeImageDistance(
  u: number,
  f: number,
  lensType: LensType,
  _signConvention: SignConvention
): number | null {
  const uMag = Math.abs(u);
  if (uMag < EPS) return null;
  const fMag = Math.abs(f);
  if (fMag < EPS) return null;
  const fEff = lensType === "convex" ? fMag : -fMag;
  const v = (fEff * uMag) / (uMag - fEff);
  if (!Number.isFinite(v)) return null;
  if (Math.abs(v) > 1e6) return null;
  return v;
}

/** m = v/u. With u as positive magnitude: school m = -v/u; Cartesian u_signed = -u => m = v/(-u) = -v/u. */
export function computeMagnification(v: number, u: number, _signConvention: SignConvention): number {
  const uMag = Math.abs(u);
  if (uMag < EPS) return 0;
  return -v / uMag;
}

/**
 * Full lens result in logical coordinates (origin = optical center, x right, y up).
 * Object base always on axis (y = 0); object tip at (objectX, objectTipY) with objectTipY = ho (up) or -ho (down); we use positive = up.
 */
export function computeLensResult(state: LensState): LensResult {
  const { u, f, ho, signConvention, lensType } = state;
  const uMag = Math.abs(u);
  const fMag = Math.abs(f);
  const objectX = -uMag;
  const fLeft = lensType === "convex" ? -fMag : -fMag;
  const fRight = lensType === "convex" ? fMag : fMag;
  const f2Left = -2 * fMag;
  const f2Right = 2 * fMag;

  const v = computeImageDistance(u, f, lensType, signConvention);
  if (v === null || !Number.isFinite(v) || Math.abs(v) > 1e5) {
    return {
      objectX,
      objectTipY: ho,
      fLeft,
      fRight,
      f2Left,
      f2Right,
      imageX: null,
      imageTipY: null,
      m: 0,
      hi: 0,
      v: null,
      isReal: false,
      isErect: true,
      sizeType: "same",
      lensType,
    };
  }

  const m = computeMagnification(v, u, signConvention);
  const hi = m * ho;
  const imageX = v;
  const imageTipY = hi;
  const isReal = v > 0;
  const isErect = m > 0;
  const absM = Math.abs(m);
  const sizeType: LensResult["sizeType"] =
    absM > 1.05 ? "enlarged" : absM < 0.95 ? "diminished" : "same";

  return {
    objectX,
    objectTipY: ho,
    fLeft,
    fRight,
    f2Left,
    f2Right,
    imageX,
    imageTipY,
    m,
    hi,
    v,
    isReal,
    isErect,
    sizeType,
    lensType,
  };
}

/**
 * Principal ray segments for drawing. All in logical coords (origin = optical center).
 * - Parallel: from (objectX, objectTipY) to lens parallel to axis; after refraction through F′ (fRight, 0).
 * - Center: through (0,0) undeviated, object tip to image tip.
 * - Focal: from object tip through F (fLeft, 0); after refraction parallel to axis.
 * Intersection of refracted rays must lie at (imageX, imageTipY).
 */
export interface RaySegment {
  type: "incident" | "refracted" | "extension";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rayKind: "parallel" | "center" | "focal";
}

export function getPrincipalRays(result: LensResult): RaySegment[] {
  const { objectX, objectTipY, fLeft, fRight, imageX, imageTipY, lensType } = result;
  const segments: RaySegment[] = [];
  const lensX = 0;
  const extend = 400;
  if (imageX === null || imageTipY === null) return segments;
  const yTip = objectTipY;

  if (lensType === "concave") {
    segments.push({ type: "incident", x1: objectX, y1: yTip, x2: lensX, y2: yTip, rayKind: "parallel" });
    const slopeP = fLeft !== 0 ? (yTip - 0) / (0 - fLeft) : 0;
    segments.push({
      type: "refracted",
      x1: lensX,
      y1: yTip,
      x2: -extend,
      y2: yTip + slopeP * (-extend - lensX),
      rayKind: "parallel",
    });
    segments.push({ type: "extension", x1: imageX, y1: imageTipY, x2: lensX, y2: yTip, rayKind: "parallel" });
    segments.push({ type: "incident", x1: objectX, y1: yTip, x2: lensX, y2: 0, rayKind: "center" });
    const sc = imageX !== 0 ? imageTipY / imageX : 0;
    segments.push({ type: "refracted", x1: lensX, y1: 0, x2: imageX, y2: imageTipY, rayKind: "center" });
    segments.push({
      type: "extension",
      x1: imageX,
      y1: imageTipY,
      x2: imageX - extend,
      y2: imageTipY + sc * (-extend - imageX),
      rayKind: "center",
    });
    const slopeF = fRight !== objectX ? (0 - yTip) / (fRight - objectX) : 0;
    const yL = objectX !== lensX ? yTip + slopeF * (lensX - objectX) : yTip;
    segments.push({ type: "incident", x1: objectX, y1: yTip, x2: lensX, y2: yL, rayKind: "focal" });
    segments.push({ type: "refracted", x1: lensX, y1: yL, x2: lensX + extend, y2: yL, rayKind: "focal" });
    segments.push({ type: "extension", x1: imageX, y1: imageTipY, x2: imageX - extend, y2: imageTipY, rayKind: "focal" });
    return segments;
  }

  segments.push({
    type: "incident",
    x1: objectX,
    y1: yTip,
    x2: lensX,
    y2: yTip,
    rayKind: "parallel",
  });
  // Refracted: through (fRight, 0) to (imageX, imageTipY). Line from (lensX, yTip) through F′ to image.
  segments.push({
    type: "refracted",
    x1: lensX,
    y1: yTip,
    x2: imageX,
    y2: imageTipY,
    rayKind: "parallel",
  });
  // Extension (backward): from image point back along refracted ray (dashed)
  const dxP = imageX - lensX;
  const dyP = imageTipY - yTip;
  const extLeft = imageX - extend * Math.sign(dxP);
  segments.push({
    type: "extension",
    x1: imageX,
    y1: imageTipY,
    x2: extLeft,
    y2: imageTipY + (extLeft - imageX) * (dyP / (dxP || 1)),
    rayKind: "parallel",
  });

  // Center ray: through origin, no deviation
  segments.push({
    type: "incident",
    x1: objectX,
    y1: yTip,
    x2: lensX,
    y2: 0,
    rayKind: "center",
  });
  const slopeCenter = imageX !== 0 ? imageTipY / imageX : 0;
  segments.push({
    type: "refracted",
    x1: lensX,
    y1: 0,
    x2: imageX,
    y2: imageTipY,
    rayKind: "center",
  });
  segments.push({
    type: "extension",
    x1: imageX,
    y1: imageTipY,
    x2: imageX + extend * Math.sign(imageX),
    y2: imageTipY + extend * slopeCenter,
    rayKind: "center",
  });

  // Focal ray: from object tip through F (fLeft, 0) to lens; after lens emerges parallel to axis (horizontal)
  const slopeFocal = fLeft !== objectX ? (0 - yTip) / (fLeft - objectX) : 0;
  const yAtLens = objectX !== lensX ? yTip + slopeFocal * (lensX - objectX) : yTip;
  segments.push({
    type: "incident",
    x1: objectX,
    y1: yTip,
    x2: lensX,
    y2: yAtLens,
    rayKind: "focal",
  });
  // After lens: parallel to axis → horizontal at yAtLens (may not meet image point; intersection is from other two rays)
  segments.push({
    type: "refracted",
    x1: lensX,
    y1: yAtLens,
    x2: imageX,
    y2: yAtLens,
    rayKind: "focal",
  });
  segments.push({
    type: "extension",
    x1: imageX,
    y1: yAtLens,
    x2: imageX + extend,
    y2: yAtLens,
    rayKind: "focal",
  });

  return segments;
}
