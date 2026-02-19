/**
 * Object renderer: arrow (path), sprite (drawImage), or fallback shape when image missing.
 * Base-anchored, proportional scale, flip when inverted.
 */

import type { ObjectType } from "../physics/rayPhysics";
import type { ObjectImageCache } from "../utils/objectImageLoader";

const COLORS = {
  object: "#ff6b6b",
  imageReal: "#10b981",
  imageVirtual: "#a78bfa",
};

const OBJECT_IMAGE_WIDTH = 4;

export function drawArrowObject(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  color: string,
  inverted: boolean
) {
  const sign = inverted ? -1 : 1;
  const tipY = baseY - sign * height;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = OBJECT_IMAGE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX, tipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(baseX, tipY);
  ctx.lineTo(baseX - 6, tipY + sign * 12);
  ctx.lineTo(baseX + 6, tipY + sign * 12);
  ctx.closePath();
  ctx.fill();
}

export function drawRealObjectSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  baseX: number,
  baseY: number,
  height: number,
  inverted: boolean
) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return;

  const aspect = img.naturalWidth / img.naturalHeight;
  const width = height * aspect;

  const x = baseX - width / 2;
  const y = inverted ? baseY : baseY - height;

  ctx.save();
  if (inverted) {
    ctx.translate(baseX, baseY);
    ctx.scale(1, -1);
    ctx.translate(-baseX, -baseY);
  }
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}

/** Fallback shapes when PNG is missing: base at baseY, extends upward by height (or downward if inverted). */
function drawFallbackShape(
  ctx: CanvasRenderingContext2D,
  objectType: ObjectType,
  baseX: number,
  baseY: number,
  height: number,
  color: string,
  inverted: boolean
) {
  const sign = inverted ? 1 : -1;
  const topY = baseY + sign * height;
  const w = height * 0.5;
  const left = baseX - w / 2;
  const right = baseX + w / 2;

  ctx.save();
  if (inverted) {
    ctx.translate(baseX, baseY);
    ctx.scale(1, -1);
    ctx.translate(-baseX, -baseY);
  }

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  switch (objectType) {
    case "apple": {
      ctx.beginPath();
      ctx.arc(baseX, baseY - height * 0.4, height * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2d5016";
      ctx.fillRect(baseX - 3, baseY - height, 6, height * 0.25);
      break;
    }
    case "candle": {
      const cy = baseY - height * 0.5;
      const r = 4;
      ctx.fillStyle = "#e8d5b5";
      ctx.beginPath();
      ctx.moveTo(left + r, cy);
      ctx.lineTo(right - r, cy);
      ctx.quadraticCurveTo(right, cy, right, cy + r);
      ctx.lineTo(right, cy + height * 0.7 - r);
      ctx.quadraticCurveTo(right, cy + height * 0.7, right - r, cy + height * 0.7);
      ctx.lineTo(left + r, cy + height * 0.7);
      ctx.quadraticCurveTo(left, cy + height * 0.7, left, cy + height * 0.7 - r);
      ctx.lineTo(left, cy + r);
      ctx.quadraticCurveTo(left, cy, left + r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff9944";
      ctx.beginPath();
      ctx.ellipse(baseX, topY + 8, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "tree": {
      ctx.fillStyle = "#2d5016";
      ctx.beginPath();
      ctx.moveTo(baseX, topY);
      ctx.lineTo(left, baseY - height * 0.3);
      ctx.lineTo(right, baseY - height * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5a3d1e";
      ctx.fillRect(baseX - 4, baseY - height * 0.25, 8, height * 0.25);
      break;
    }
    case "human": {
      const headR = height * 0.15;
      ctx.beginPath();
      ctx.arc(baseX, baseY - height + headR, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(baseX, baseY - height + headR * 2);
      ctx.lineTo(baseX, baseY - height * 0.4);
      ctx.moveTo(baseX, baseY - height * 0.6);
      ctx.lineTo(left, baseY);
      ctx.moveTo(baseX, baseY - height * 0.6);
      ctx.lineTo(right, baseY);
      ctx.stroke();
      break;
    }
    default:
      drawArrowObject(ctx, baseX, baseY, height, color, false);
  }

  ctx.restore();
}

export function drawObject(
  ctx: CanvasRenderingContext2D,
  objectType: ObjectType,
  baseX: number,
  baseY: number,
  height: number,
  images: ObjectImageCache | null,
  color: string,
  inverted: boolean
) {
  if (objectType === "arrow") {
    drawArrowObject(ctx, baseX, baseY, height, color, inverted);
    return;
  }

  const sprite = images?.[objectType] ?? null;
  if (sprite) {
    drawRealObjectSprite(ctx, sprite, baseX, baseY, height, inverted);
  } else {
    drawFallbackShape(ctx, objectType, baseX, baseY, height, color, inverted);
  }
}
