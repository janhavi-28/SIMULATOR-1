/**
 * RENDERER ENGINE — Professional simulator rendering.
 * Draw order: axis, mirror, points, object sprite, rays, image sprite, labels.
 */

import type { ObjectType, RayPhysicsResult, RaySegment } from "../physics/rayPhysics";
import type { ObjectImageCache } from "../utils/objectImageLoader";
import { drawObject } from "./drawObject";

const COLORS = {
  axis: "#ffffff",
  mirror: "#667eea",
  focus: "#4ecdc4",
  center: "#ffd93d",
  pole: "#ffffff",
  object: "#ff6b6b",
  imageReal: "#10b981",
  imageVirtual: "#a78bfa",
  incident: "#ff4444",
  reflected: "#ffcc00",
  virtual: "#ffffff",
  principal: "#00d4ff",
  label: "#e0e0e0",
};

const DIAGRAM_FILL = 0.85;
const LABEL_OFFSET_MIN = 18;
const LABEL_OFFSET_MAX = 24;
const AXIS_WIDTH = 2;
const MIRROR_WIDTH = 4;
const RAY_THICKNESS = 2;
const OBJECT_IMAGE_WIDTH = 4;
const SHADOW_BLUR = 4;
/** Scale object/image down so they don't overlap each other or labels (e.g. at C). */
const OBJECT_HEIGHT_SCALE = 0.28;
const MAX_OBJECT_HEIGHT_FRACTION = 0.12;
const MAX_IMAGE_HEIGHT_FRACTION = 0.16;

function toCanvas(
  lx: number,
  ly: number,
  cw: number,
  ch: number,
  scale: number
): [number, number] {
  return [cw / 2 + lx * scale, ch / 2 - ly * scale];
}

/** Extend segment (x1,y1)->(x2,y2) so the endpoint reaches canvas boundary. */
function extendToBoundary(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cw: number,
  ch: number
): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.hypot(dx, dy) < 1e-6) return [x2, y2];
  let tMin = Infinity;
  if (dx > 1e-6) {
    const tx = (cw - x2) / dx;
    if (tx > 0) tMin = Math.min(tMin, tx);
  } else if (dx < -1e-6) {
    const tx = (0 - x2) / dx;
    if (tx > 0) tMin = Math.min(tMin, tx);
  }
  if (dy > 1e-6) {
    const ty = (ch - y2) / dy;
    if (ty > 0) tMin = Math.min(tMin, ty);
  } else if (dy < -1e-6) {
    const ty = (0 - y2) / dy;
    if (ty > 0) tMin = Math.min(tMin, ty);
  }
  if (tMin <= 0 || !Number.isFinite(tMin)) return [x2, y2];
  return [x2 + tMin * dx, y2 + tMin * dy];
}

function drawRaySegment(
  ctx: CanvasRenderingContext2D,
  seg: RaySegment,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isPrincipal?: boolean
) {
  const color =
    seg.type === "incident"
      ? COLORS.incident
      : seg.type === "reflected"
        ? COLORS.reflected
        : COLORS.virtual;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = RAY_THICKNESS;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.shadowColor = isPrincipal ? COLORS.principal : color;
  ctx.setLineDash(seg.type === "virtual" ? [10, 8] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function placeLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  avoid: Array<{ x: number; y: number }>,
  cw: number,
  ch: number
): { x: number; y: number } {
  ctx.font = "bold 14px Arial";
  const m = ctx.measureText(text);
  const w = m.width;
  const h = 18;

  const offsets = [LABEL_OFFSET_MIN, LABEL_OFFSET_MAX, 22, 28];
  const candidates = [
    [x, y + offsets[0]],
    [x - w / 2, y + offsets[1]],
    [x, y + offsets[2]],
    [x - w, y + offsets[0]],
    [x, y - offsets[1] - h],
    [x - w / 2, y - offsets[0] - h],
    [x - w / 2, y + offsets[3]],
    [x - w, y],
    [x + offsets[1], y],
    [x + offsets[2], y],
  ];

  const minClear = LABEL_OFFSET_MAX + 22;
  for (const [cx, cy] of candidates) {
    const clear = avoid.every(
      (a) => Math.hypot(cx - a.x, cy - a.y) > minClear
    );
    if (clear && cx >= 0 && cx <= cw && cy >= 0 && cy <= ch) {
      return [cx, cy];
    }
  }
  return [x, y + LABEL_OFFSET_MIN];
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  data: RayPhysicsResult,
  mirrorType: "concave" | "convex" | "plane",
  rayProgress: number = 1,
  objectType: ObjectType = "arrow",
  imageCache: ObjectImageCache | null = null
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const logicalWidth = Math.max(data.logicalWidth, 100);
  const logicalHeight = Math.max(data.logicalHeight ?? 80, 80);
  const scaleX = (canvasWidth * DIAGRAM_FILL) / logicalWidth;
  const scaleY = (canvasHeight * DIAGRAM_FILL) / logicalHeight;
  const scale = Math.min(scaleX, scaleY);

  const t = (lx: number, ly: number) =>
    toCanvas(lx, ly, canvasWidth, canvasHeight, scale);

  // 1. Axis (2px)
  const [, ay] = t(0, 0);
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = AXIS_WIDTH;
  ctx.beginPath();
  ctx.moveTo(0, ay);
  ctx.lineTo(canvasWidth, ay);
  ctx.stroke();

  // 2. Mirror (4px): circle center at (centerX, centerY) = t(data.centerX, 0), radius R*scale; pole at canvas center
  ctx.strokeStyle = COLORS.mirror;
  ctx.lineWidth = MIRROR_WIDTH;
  ctx.beginPath();
  const [poleCx, poleCy] = t(0, 0);
  const centerX = poleCx + data.centerX * scale;
  const centerY = poleCy;
  const arcR = Math.abs(data.centerX) * scale;
  if (mirrorType === "concave") {
    // Left half of circle (mirror faces object on left): from top to bottom
    ctx.arc(centerX, centerY, arcR, -Math.PI / 2, Math.PI / 2);
  } else if (mirrorType === "convex") {
    // Right half of circle: from bottom to top
    ctx.arc(centerX, centerY, arcR, Math.PI / 2, (3 * Math.PI) / 2);
  } else {
    const vExt = 60 * scale;
    ctx.moveTo(poleCx, poleCy - vExt);
    ctx.lineTo(poleCx, poleCy + vExt);
  }
  ctx.stroke();

  // 3. Points F, C, P
  const [fX, fY] = t(data.focalX, 0);
  const [cX, cY] = t(data.centerX, 0);
  const [pX, pY] = t(data.poleX, 0);

  ctx.fillStyle = COLORS.focus;
  ctx.beginPath();
  ctx.arc(fX, fY, 5, 0, Math.PI * 2);
  ctx.fill();

  if (mirrorType !== "plane") {
    ctx.fillStyle = COLORS.center;
    ctx.beginPath();
    ctx.arc(cX, cY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = COLORS.pole;
  ctx.beginPath();
  ctx.arc(pX, pY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Object sprite: preserve object/image height ratio (imageHeight = objectHeight * |m|)
  const [oX, oY] = t(data.objectX, 0);
  const [oTipX, oTipY] = t(data.objectX, data.objectTopY);
  const rawObjH = Math.abs(oTipY - oY) || 20;
  const rawImgH =
    data.image && data.imageX != null && data.imageTopY != null
      ? Math.abs(t(data.imageX, data.imageTopY)[1] - t(data.imageX, 0)[1])
      : rawObjH;
  const maxH = Math.max(rawObjH, rawImgH) || 1;
  const k = Math.min(
    OBJECT_HEIGHT_SCALE,
    (canvasHeight * MAX_OBJECT_HEIGHT_FRACTION) / maxH
  );
  const objH = Math.max(rawObjH * k, 12);
  drawObject(
    ctx,
    objectType,
    oX,
    oY,
    objH,
    imageCache ?? {},
    COLORS.object,
    false
  );

  // 5. Rays (2.5px, shadowBlur glow, sequential)
  const numRays = data.rays.length;
  const segmentDuration = numRays > 0 ? 1 / numRays : 1;
  data.rays.forEach((ray, rayIndex) => {
    const rayStart = rayIndex * segmentDuration;
    if (rayProgress <= rayStart) return;
    const rayProgressLocal = Math.min(1, (rayProgress - rayStart) / segmentDuration);
    for (const seg of ray.segments) {
      const [x1, y1] = t(seg.x1, seg.y1);
      let [x2, y2] = t(seg.x2, seg.y2);
      if (rayProgressLocal >= 1 && (seg.type === "reflected" || seg.type === "virtual")) {
        [x2, y2] = extendToBoundary(x1, y1, x2, y2, canvasWidth, canvasHeight);
      }
      if (rayProgressLocal >= 1) {
        drawRaySegment(ctx, seg, x1, y1, x2, y2, rayIndex === 0);
      } else {
        const endX = x1 + (x2 - x1) * rayProgressLocal;
        const endY = y1 + (y2 - y1) * rayProgressLocal;
        drawRaySegment(ctx, seg, x1, y1, endX, endY, rayIndex === 0);
      }
    }
  });

  // 6. Image sprite (magnification scale, inverted if m < 0)
  let imgBaseY = oY;
  if (data.image && data.imageX !== null && data.imageTopY !== null) {
    const [iX, iY] = t(data.imageX, 0);
    const [iTx, iTy] = t(data.imageX, data.imageTopY);
    imgBaseY = iY;
    const imgH = Math.max(rawImgH * k, 10);
    const col = data.image.isReal ? COLORS.imageReal : COLORS.imageVirtual;
    const inverted = data.image.height < 0;
    if (!data.image.isReal) ctx.setLineDash([6, 6]);
    drawObject(
      ctx,
      objectType,
      iX,
      iY,
      imgH,
      imageCache ?? {},
      col,
      inverted
    );
    ctx.setLineDash([]);
  }

  // 7. Labels: avoid ray midpoints, segment endpoints, object/image so labels don't overlap rays
  const rayPoints: Array<{ x: number; y: number }> = [];
  for (const ray of data.rays) {
    for (const seg of ray.segments) {
      const [x1, y1] = t(seg.x1, seg.y1);
      const [x2, y2] = t(seg.x2, seg.y2);
      rayPoints.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 });
      rayPoints.push({ x: x1, y: y1 }, { x: x2, y: y2 });
    }
  }
  const objectBase = { x: oX, y: oY };
  const objectTip = { x: oX, y: oTipY };
  const imageBase = { x: data.image && data.imageX != null ? t(data.imageX, 0)[0] : oX, y: imgBaseY };
  const avoidAll = [...rayPoints, objectBase, objectTip, imageBase];
  if (data.image && data.imageX != null) {
    const [, iTy] = t(data.imageX, data.imageTopY);
    avoidAll.push({ x: imageBase.x, y: iTy });
  }

  ctx.fillStyle = COLORS.label;
  ctx.font = "bold 14px Arial";

  const [fLx, fLy] = placeLabel(ctx, fX, fY, "F", avoidAll, canvasWidth, canvasHeight);
  ctx.fillText("F", fLx, fLy);

  if (mirrorType !== "plane") {
    const [cLx, cLy] = placeLabel(ctx, cX, cY, "C", [...avoidAll, { x: fLx, y: fLy }], canvasWidth, canvasHeight);
    ctx.fillText("C", cLx, cLy);
  }

  const [pLx, pLy] = placeLabel(ctx, pX, pY, "P", avoidAll, canvasWidth, canvasHeight);
  ctx.fillText("P", pLx, pLy);

  const [oLx, oLy] = placeLabel(ctx, oX, oY + 10, "Object", avoidAll, canvasWidth, canvasHeight);
  ctx.fillText("Object", oLx, oLy);

  if (data.image && data.imageX !== null) {
    const iX = imageBase.x;
    const imgLabel = data.image.isReal ? "Image (Real)" : "Image (Virtual)";
    const [iLx, iLy] = placeLabel(ctx, iX, imgBaseY + 10, imgLabel, [...avoidAll, { x: oLx, y: oLy }], canvasWidth, canvasHeight);
    ctx.fillText(imgLabel, iLx, iLy);
  }
}
