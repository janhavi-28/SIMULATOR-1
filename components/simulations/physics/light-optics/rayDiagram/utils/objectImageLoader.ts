/**
 * Load object sprites on demand. Cache once per type. Never load in render loop.
 */

import type { ObjectType } from "../physics/rayPhysics";
import { OBJECT_SPRITES } from "./objectMap";

export type ObjectImageCache = Partial<Record<ObjectType, HTMLImageElement | null>>;

const imageCache: ObjectImageCache = {};

function loadOne(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function getCachedImage(type: ObjectType): HTMLImageElement | null {
  if (type === "arrow") return null;
  return imageCache[type] ?? null;
}

export function ensureSpriteLoaded(type: ObjectType): Promise<HTMLImageElement | null> {
  if (type === "arrow") return Promise.resolve(null);
  if (imageCache[type] !== undefined) return Promise.resolve(imageCache[type] ?? null);

  const src = OBJECT_SPRITES[type];
  if (!src) return Promise.resolve(null);

  return loadOne(src).then((img) => {
    imageCache[type] = img;
    return img;
  });
}

export function getImageCacheSnapshot(): ObjectImageCache {
  return { ...imageCache };
}
