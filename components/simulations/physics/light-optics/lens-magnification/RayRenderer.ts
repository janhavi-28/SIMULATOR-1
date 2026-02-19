/**
 * RAY RENDERER — Convex lens diagram. Dark futuristic theme.
 * Supports zoom, rayProgress (sequential reveal for Play animation), objectType (pencil, arrow, tree, human, apple).
 */

import type { LensResult, RaySegment } from "./OpticsMath";
import type { ObjectType, LensType } from "./OpticsMath";

/** Reference palette: deep indigo bg, bright yellow incident, pink/magenta refracted, cyan center. */
const COLORS = {
  stageBackground: "#1e1b4b",
  incident: "#fef08a",
  refracted: "#f472b6",
  center: "#22d3ee",
  extension: "rgba(148, 163, 184, 0.45)",
  axis: "#94a3b8",
  object: "#fef08a",
  objectStroke: "#eab308",
  image: "#c084fc",
  imageGlow: "rgba(192, 132, 252, 0.45)",
  intersection: "#c084fc",
  label: "#e2e8f0",
  lens: "#38bdf8",
} as const;

const STROKE = {
  ray: 2.2,
  centerRay: 3,
  extension: 1.4,
  axis: 1.5,
  lens: 3,
} as const;

const OBJECT_SCALE = 1.6;

export interface RenderParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  result: LensResult;
  rays: RaySegment[];
  logicalExtent: number;
  pulseT: number;
  lensFlash?: number;
  /** 1 = full scale; >1 zoom in, <1 zoom out */
  zoom?: number;
  rayProgress?: number;
  objectType?: ObjectType;
  lensType?: LensType;
}

function logicalToCanvas(lx: number, ly: number, params: RenderParams): [number, number] {
  const { width, height, logicalExtent, zoom = 1 } = params;
  const baseScale = Math.min(width, height) * 0.4 / logicalExtent;
  const scale = baseScale * zoom;
  const cx = width / 2 + lx * scale;
  const cy = height / 2 - ly * scale;
  return [cx, cy];
}

function getScale(params: RenderParams): number {
  const { width, height, logicalExtent, zoom = 1 } = params;
  return (Math.min(width, height) * 0.4 / logicalExtent) * zoom;
}

function drawRaySegment(
  params: RenderParams,
  seg: RaySegment,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const { ctx } = params;
  const isCenter = seg.rayKind === "center";
  const isExtension = seg.type === "extension";
  ctx.save();
  if (isExtension) {
    ctx.strokeStyle = COLORS.extension;
    ctx.lineWidth = STROKE.extension;
    ctx.setLineDash([8, 6]);
    ctx.globalAlpha = 0.85;
  } else {
    ctx.setLineDash([]);
    ctx.lineWidth = isCenter ? STROKE.centerRay : STROKE.ray;
    ctx.strokeStyle = isCenter ? COLORS.center : seg.type === "incident" ? COLORS.incident : COLORS.refracted;
  }
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  color: string,
  glow: boolean,
  inverted: boolean
) {
  const h = height;
  const tipY = baseY - (inverted ? -h : h);
  const dir = inverted ? 1 : -1;
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX, tipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(baseX, tipY);
  ctx.lineTo(baseX - 6, tipY + dir * 12);
  ctx.lineTo(baseX + 6, tipY + dir * 12);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawObjectByType(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  color: string,
  inverted: boolean,
  objectType: ObjectType
) {
  const sign = inverted ? 1 : -1;
  const tipY = baseY + sign * height;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  if (inverted) {
    ctx.translate(baseX, baseY);
    ctx.scale(1, -1);
    ctx.translate(-baseX, -baseY);
  }
  switch (objectType) {
    case "arrow":
      drawArrow(ctx, baseX, baseY, height, color, false, false);
      break;
    case "pencil": {
      const w = height * 0.32;
      const tip = tipY + height * 0.08;
      ctx.fillStyle = color;
      ctx.strokeStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(baseX - w / 2, baseY);
      ctx.lineTo(baseX - w / 2, tip);
      ctx.lineTo(baseX, tipY);
      ctx.lineTo(baseX + w / 2, tip);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(baseX - w / 2, tip);
      ctx.lineTo(baseX, tipY);
      ctx.lineTo(baseX + w / 2, tip);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "apple": {
      const r = height * 0.42;
      const cy = baseY - height * 0.48;
      ctx.beginPath();
      ctx.arc(baseX, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#713f12";
      ctx.lineWidth = Math.max(1.2, height * 0.06);
      ctx.beginPath();
      ctx.moveTo(baseX, cy - r);
      ctx.lineTo(baseX, cy - r - height * 0.12);
      ctx.stroke();
      break;
    }
    case "tree": {
      const w = height * 0.55;
      const crownY = baseY - height * 0.55;
      ctx.fillStyle = "#4ade80";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseX, tipY + height * 0.12);
      ctx.lineTo(baseX - w / 2, crownY);
      ctx.lineTo(baseX + w / 2, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#a16207";
      ctx.strokeStyle = "#92400e";
      ctx.fillRect(baseX - height * 0.1, baseY - height * 0.22, height * 0.2, height * 0.22);
      ctx.strokeRect(baseX - height * 0.1, baseY - height * 0.22, height * 0.2, height * 0.22);
      break;
    }
    case "human": {
      const headR = height * 0.18;
      const neckY = baseY - height + headR * 2.2;
      const shoulderY = baseY - height * 0.55;
      const waistY = baseY - height * 0.32;
      ctx.beginPath();
      ctx.arc(baseX, baseY - height + headR, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(baseX, neckY);
      ctx.lineTo(baseX, waistY);
      ctx.moveTo(baseX, baseY - height * 0.48);
      ctx.lineTo(baseX - height * 0.18, baseY);
      ctx.moveTo(baseX, baseY - height * 0.48);
      ctx.lineTo(baseX + height * 0.18, baseY);
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    default:
      drawArrow(ctx, baseX, baseY, height, color, false, false);
  }
  ctx.restore();
}

export function renderLensDiagram(params: RenderParams): void {
  const {
    ctx,
    width,
    height,
    result,
    rays,
    logicalExtent,
    pulseT,
    lensFlash = 0,
    zoom = 1,
    rayProgress = 1,
    objectType = "arrow",
  } = params;
  const lensType = result.lensType ?? "convex";
  const T = (lx: number, ly: number) => logicalToCanvas(lx, ly, params);
  const scale = getScale(params);

  ctx.fillStyle = COLORS.stageBackground;
  ctx.fillRect(0, 0, width, height);

  const showAxis = rayProgress >= 0.04;
  const showObject = rayProgress >= 0.10;
  const showImage = rayProgress >= 0.86;
  const showIntersection = rayProgress >= 0.96;
  const rayStart = [0.14, 0.36, 0.58];
  const rayEnd = [0.30, 0.50, 0.72];

  if (showAxis) {
    const [, ay] = T(-logicalExtent, 0);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = STROKE.axis;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, ay);
    ctx.lineTo(width, ay);
    ctx.stroke();
    ctx.setLineDash([]);

    const lensHalfH = Math.min(120, logicalExtent * 0.6) * scale;
    const [lensCx, lensCy] = T(0, 0);
    ctx.save();
    if (lensFlash > 0) {
      ctx.shadowColor = COLORS.lens;
      ctx.shadowBlur = 12 + lensFlash * 20;
    }
    ctx.strokeStyle = COLORS.lens;
    ctx.lineWidth = STROKE.lens;
    if (lensType === "concave") {
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy - lensHalfH);
      ctx.lineTo(lensCx, lensCy + lensHalfH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy - lensHalfH);
      ctx.lineTo(lensCx + 8, lensCy - lensHalfH + 16);
      ctx.lineTo(lensCx - 8, lensCy - lensHalfH + 16);
      ctx.closePath();
      ctx.fillStyle = COLORS.lens;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy + lensHalfH);
      ctx.lineTo(lensCx + 8, lensCy + lensHalfH - 16);
      ctx.lineTo(lensCx - 8, lensCy + lensHalfH - 16);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy - lensHalfH);
      ctx.lineTo(lensCx, lensCy + lensHalfH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy - lensHalfH);
      ctx.lineTo(lensCx - 8, lensCy - lensHalfH + 16);
      ctx.lineTo(lensCx + 8, lensCy - lensHalfH + 16);
      ctx.closePath();
      ctx.fillStyle = COLORS.lens;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(lensCx, lensCy + lensHalfH);
      ctx.lineTo(lensCx - 8, lensCy + lensHalfH - 16);
      ctx.lineTo(lensCx + 8, lensCy + lensHalfH - 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.label;
    const [oLx, oLy] = T(0, 0);
    ctx.fillText("O", oLx, oLy + 8);
    const pts: Array<[number, string]> = [
      [result.fLeft, "F"],
      [result.f2Left, "2F"],
      [result.fRight, "F′"],
      [result.f2Right, "2F′"],
    ];
    pts.forEach(([lx, lbl]) => {
      const [cx, cy] = T(lx, 0);
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.label;
      ctx.fill();
      ctx.fillText(lbl, cx, cy + 10);
    });
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("Principal Axis", width / 2, ay + 8);
  }

  if (showObject) {
    const [objX, objY] = T(result.objectX, 0);
    const objH = Math.abs(result.objectTipY) * scale * OBJECT_SCALE;
    drawObjectByType(ctx, objX, objY, objH, COLORS.object, false, objectType);
    ctx.strokeStyle = COLORS.objectStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objX - 8, objY);
    ctx.lineTo(objX + 8, objY);
    ctx.stroke();
  }

  rays.forEach((seg) => {
    const rayIdx = seg.rayKind === "parallel" ? 0 : seg.rayKind === "center" ? 1 : 2;
    const start = rayStart[rayIdx];
    const end = rayEnd[rayIdx];
    if (rayProgress < start) return;
    const [x1, y1] = T(seg.x1, seg.y1);
    let [x2, y2] = T(seg.x2, seg.y2);
    const localT = Math.min(1, (rayProgress - start) / (end - start));
    if (localT < 1 && seg.type !== "extension") {
      x2 = x1 + (x2 - x1) * localT;
      y2 = y1 + (y2 - y1) * localT;
    }
    drawRaySegment(params, seg, x1, y1, x2, y2);
  });

  if (showImage && result.imageX != null && result.imageTipY != null) {
    const [imgX, imgY] = T(result.imageX, 0);
    const imgH = Math.abs(result.imageTipY) * scale * OBJECT_SCALE;
    const inverted = result.imageTipY < 0;
    ctx.save();
    ctx.shadowColor = COLORS.image;
    ctx.shadowBlur = 12;
    drawObjectByType(ctx, imgX, imgY, imgH, COLORS.image, inverted, objectType);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.strokeStyle = COLORS.image;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(imgX - 8, imgY);
    ctx.lineTo(imgX + 8, imgY);
    ctx.stroke();
  }

  if (showIntersection && result.imageX != null && result.imageTipY != null && result.isReal) {
    const [ix, iy] = T(result.imageX, result.imageTipY);
    const opacity = 0.7 + 0.3 * Math.sin(pulseT * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = COLORS.intersection;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.intersection;
    ctx.beginPath();
    ctx.arc(ix, iy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
