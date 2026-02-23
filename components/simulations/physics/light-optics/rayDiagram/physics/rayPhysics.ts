/**
 * PHYSICS ENGINE — Ray Diagram Simulator
 * Logical units only. Pole at origin. Object left (negative x).
 * Mirror formula: 1/f = 1/v + 1/u, m = -v/u
 */

export type MirrorType = "concave" | "convex" | "plane";

export type ObjectType = "arrow" | "apple" | "candle" | "tree" | "human";

export interface SimState {
  mirrorType: MirrorType;
  objectDistance: number;
  objectHeight: number;
  focalLength: number;
  launched: boolean;
  objectType: ObjectType;
}

export interface RaySegment {
  type: "incident" | "reflected" | "virtual";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RayPath {
  segments: RaySegment[];
}

export interface ImageData {
  distance: number;
  height: number;
  isReal: boolean;
}

export interface RayPhysicsResult {
  rays: RayPath[];
  image: ImageData | null;
  type: "real" | "virtual" | "at-infinity";
  focalX: number;
  centerX: number;
  poleX: number;
  objectX: number;
  objectTopY: number;
  imageX: number | null;
  imageTopY: number | null;
  logicalWidth: number;
  logicalHeight: number;
}

export function calculateImageDistance(f: number, u: number): number | null {
  if (f === 0 || u === 0) return null;
  const v = (f * u) / (u - f);
  if (!Number.isFinite(v)) return null;
  return v;
}

export function calculateMagnification(v: number, u: number): number {
  if (u === 0) return 0;
  return -v / u;
}

const EPSILON = 0.01;

export function getImagePosition(state: SimState): { image: ImageData | null; type: "real" | "virtual" | "at-infinity" } {
  const { mirrorType, objectDistance, focalLength, objectHeight } = state;
  const u = -objectDistance;

  if (mirrorType === "plane") {
    return {
      image: { distance: objectDistance, height: objectHeight, isReal: false },
      type: "virtual",
    };
  }

  const f = mirrorType === "concave" ? -focalLength : focalLength;
  if (Math.abs(u - f) < EPSILON) return { image: null, type: "at-infinity" };

  const v = calculateImageDistance(f, u);
  if (v === null || !Number.isFinite(v)) return { image: null, type: "at-infinity" };

  const m = calculateMagnification(v, u);
  const isReal = mirrorType === "concave" ? v < 0 : false;
  /** Image position in logical coords: v (signed). Height = objectHeight * m (signed; use |m| for size). */
  const imageHeight = objectHeight * m;
  return {
    image: { distance: v, height: imageHeight, isReal },
    type: isReal ? "real" : "virtual",
  };
}

export function getDynamicExplanation(state: SimState): string {
  const { mirrorType, objectDistance, focalLength } = state;
  const u = Math.abs(objectDistance);
  const f = focalLength;

  if (mirrorType === "plane") {
    return "Virtual, erect, same size — image as far behind mirror as object in front.";
  }
  if (mirrorType === "convex") {
    return "Virtual, erect, diminished — convex mirrors always form virtual images.";
  }

  if (Math.abs(u - f) < EPSILON) {
    return "Image at infinity — object at focus; reflected rays parallel.";
  }
  if (u < f) {
    return "Virtual, erect, magnified — object inside focal point.";
  }
  if (Math.abs(u - 2 * f) < EPSILON) {
    return "Real, inverted, same size — object at center of curvature.";
  }
  if (u > 2 * f) {
    return "Real, inverted, diminished — object beyond center of curvature.";
  }
  if (u > f && u < 2 * f) {
    return "Real, inverted, magnified — object between F and C.";
  }

  return "Real, inverted image formed by concave mirror.";
}

export interface OpticalFeedback {
  imageDistanceCm: number;
  magnification: number;
  imageTypeText: string;
}

/** For educational panel: image distance, magnification, and type. */
export function getOpticalFeedback(state: SimState): OpticalFeedback | null {
  const { image, type } = getImagePosition(state);
  if (!image) return null;
  const u = -state.objectDistance;
  const f = state.mirrorType === "concave" ? -state.focalLength : state.focalLength;
  const v = image.distance;
  const m = calculateMagnification(v, u);
  const distCm = Math.round(Math.abs(v) * 10) / 10;
  const magRounded = Math.round(m * 100) / 100;
  const typeText =
    type === "virtual"
      ? "Virtual, Erect"
      : image.height < 0
        ? "Real, Inverted"
        : "Real, Erect";
  const sizeNote =
    Math.abs(m - 1) < 0.05
      ? ", Same Size"
      : m > 1
        ? ", Magnified"
        : ", Diminished";
  return {
    imageDistanceCm: distCm,
    magnification: magRounded,
    imageTypeText: typeText + sizeNote,
  };
}

/** Mirror: circle center (cx, 0), radius R = |cx|. Return t > 0 for first (closest) hit from origin along dir. */
function intersectRayCircle(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  cx: number,
  R: number
): number | null {
  const ocx = ox - cx;
  const a = dx * dx + dy * dy;
  const b = 2 * (ocx * dx + oy * dy);
  const c = ocx * ocx + oy * oy - R * R;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sqrtD = Math.sqrt(disc);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  const tol = 1e-6;
  if (t1 > tol && t2 > tol) return Math.min(t1, t2);
  if (t1 > tol) return t1;
  if (t2 > tol) return t2;
  return null;
}

/** Mirror hit M from object (ox,oy) along unit direction (dx,dy). Returns (mx, my) or null. */
function mirrorHit(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  cx: number,
  R: number
): { mx: number; my: number } | null {
  const t = intersectRayCircle(ox, oy, dx, dy, cx, R);
  if (t == null) return null;
  return { mx: ox + t * dx, my: oy + t * dy };
}

/**
 * Reflected ray: R = I − 2(I·N)N.
 * N = surface normal at M (outward from mirror into light side).
 * Concave: normal from M toward C. Convex: normal from C toward M.
 */
function reflectedRayEndpoint(
  mx: number,
  my: number,
  ox: number,
  oy: number,
  cx: number,
  ix: number,
  iy: number
): { rx: number; ry: number } {
  const nlen = Math.hypot(mx - cx, my) || 1;
  const Nx = cx < 0 ? (cx - mx) / nlen : (mx - cx) / nlen;
  const Ny = cx < 0 ? -my / nlen : my / nlen;

  const ix_in = mx - ox;
  const iy_in = my - oy;
  const ilen = Math.hypot(ix_in, iy_in) || 1;
  const Ix = ix_in / ilen;
  const Iy = iy_in / ilen;

  const idotn = Ix * Nx + Iy * Ny;
  const Rx = Ix - 2 * idotn * Nx;
  const Ry = Iy - 2 * idotn * Ny;

  if (Math.abs(Rx) < 1e-10) return { rx: ix, ry: iy };
  const t = (ix - mx) / Rx;
  return { rx: ix, ry: my + t * Ry };
}

function buildRays(
  ox: number,
  oy: number,
  fx: number,
  cx: number,
  ix: number,
  iy: number,
  type: "real" | "virtual",
  mirrorType: "concave" | "convex"
): RayPath[] {
  const rays: RayPath[] = [];
  const isVirtual = type === "virtual";
  const R = Math.abs(cx);

  const origin = { x: ox, y: oy };
  if (mirrorType === "concave") {
    const d1x = 1;
    const d1y = 0;
    const M1 = mirrorHit(ox, oy, d1x, d1y, cx, R);
    if (M1) {
      const end1 = reflectedRayEndpoint(M1.mx, M1.my, ox, oy, cx, ix, iy);
      rays.push({
        segments: [
          { type: "incident", x1: origin.x, y1: origin.y, x2: M1.mx, y2: M1.my },
          { type: isVirtual ? "virtual" : "reflected", x1: M1.mx, y1: M1.my, x2: end1.rx, y2: end1.ry },
        ],
      });
    }
    const d2mag = Math.hypot(fx - ox, -oy);
    if (d2mag > 1e-6) {
      const d2x = (fx - ox) / d2mag;
      const d2y = -oy / d2mag;
      const M2 = mirrorHit(ox, oy, d2x, d2y, cx, R);
      if (M2) {
        const end2 = reflectedRayEndpoint(M2.mx, M2.my, ox, oy, cx, ix, iy);
        rays.push({
          segments: [
            { type: "incident", x1: origin.x, y1: origin.y, x2: M2.mx, y2: M2.my },
            { type: isVirtual ? "virtual" : "reflected", x1: M2.mx, y1: M2.my, x2: end2.rx, y2: end2.ry },
          ],
        });
      }
    }
    const d3mag = Math.hypot(cx - ox, -oy);
    if (d3mag > 1e-6) {
      const d3x = (cx - ox) / d3mag;
      const d3y = -oy / d3mag;
      const M3 = mirrorHit(ox, oy, d3x, d3y, cx, R);
      if (M3) {
        const end3 = reflectedRayEndpoint(M3.mx, M3.my, ox, oy, cx, ix, iy);
        rays.push({
          segments: [
            { type: "incident", x1: origin.x, y1: origin.y, x2: M3.mx, y2: M3.my },
            { type: isVirtual ? "virtual" : "reflected", x1: M3.mx, y1: M3.my, x2: end3.rx, y2: end3.ry },
          ],
        });
      }
    }
  } else {
    const d1x = 1;
    const d1y = 0;
    const M1 = mirrorHit(ox, oy, d1x, d1y, cx, R);
    if (M1) {
      const end1 = reflectedRayEndpoint(M1.mx, M1.my, ox, oy, cx, ix, iy);
      rays.push({
        segments: [
          { type: "incident", x1: origin.x, y1: origin.y, x2: M1.mx, y2: M1.my },
          { type: "virtual", x1: M1.mx, y1: M1.my, x2: end1.rx, y2: end1.ry },
        ],
      });
    }
    const d2mag = Math.hypot(fx - ox, -oy);
    if (d2mag > 1e-6) {
      const d2x = (fx - ox) / d2mag;
      const d2y = -oy / d2mag;
      const M2 = mirrorHit(ox, oy, d2x, d2y, cx, R);
      if (M2) {
        const end2 = reflectedRayEndpoint(M2.mx, M2.my, ox, oy, cx, ix, iy);
        rays.push({
          segments: [
            { type: "incident", x1: origin.x, y1: origin.y, x2: M2.mx, y2: M2.my },
            { type: "virtual", x1: M2.mx, y1: M2.my, x2: end2.rx, y2: end2.ry },
          ],
        });
      }
    }
    const d3mag = Math.hypot(cx - ox, -oy);
    if (d3mag > 1e-6) {
      const d3x = (cx - ox) / d3mag;
      const d3y = -oy / d3mag;
      const M3 = mirrorHit(ox, oy, d3x, d3y, cx, R);
      if (M3) {
        const end3 = reflectedRayEndpoint(M3.mx, M3.my, ox, oy, cx, ix, iy);
        rays.push({
          segments: [
            { type: "incident", x1: origin.x, y1: origin.y, x2: M3.mx, y2: M3.my },
            { type: "virtual", x1: M3.mx, y1: M3.my, x2: end3.rx, y2: end3.ry },
          ],
        });
      }
    }
  }

  return rays;
}

export function getRayPaths(state: SimState): RayPhysicsResult {
  const { mirrorType, objectDistance, objectHeight, focalLength } = state;

  const poleX = 0;
  const ox = -objectDistance;
  const oy = objectHeight;

  const fx =
    mirrorType === "plane" ? 0 : mirrorType === "convex" ? focalLength : -focalLength;
  const cx =
    mirrorType === "plane" ? 0 : mirrorType === "convex" ? 2 * focalLength : -2 * focalLength;

  const { image, type } = getImagePosition(state);

  let ix: number | null = null;
  let iy: number | null = null;
  if (image) {
    ix = image.distance;
    iy = image.height;
  }

  let rays: RayPath[] = [];
  if (image && ix !== null && iy !== null) {
    if (mirrorType === "plane") {
      rays = [
        {
          segments: [
            { type: "incident", x1: ox, y1: oy, x2: 0, y2: oy },
            { type: "virtual", x1: 0, y1: oy, x2: ix, y2: iy },
          ],
        },
      ];
    } else {
      rays = buildRays(ox, oy, fx, cx, ix, iy, type as "real" | "virtual", mirrorType);
    }
  }

  const extentX = Math.max(
    Math.abs(ox) + 10,
    Math.abs(fx) + 10,
    Math.abs(cx) + 10,
    image ? Math.abs(ix!) + 10 : 50
  );
  const logicalWidth = Math.max(120, extentX * 2);
  const extentY = Math.max(
    Math.abs(oy) + 10,
    image && iy != null ? Math.abs(iy) + 10 : 40
  );
  const logicalHeight = Math.max(80, extentY * 2);

  return {
    rays,
    image,
    type,
    focalX: fx,
    centerX: cx,
    poleX,
    objectX: ox,
    objectTopY: oy,
    imageX: ix,
    imageTopY: iy,
    logicalWidth,
    logicalHeight,
  };
}
