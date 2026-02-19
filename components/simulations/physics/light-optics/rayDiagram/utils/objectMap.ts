/**
 * Object sprite paths. Sprites stored in public/objects/
 */

import type { ObjectType } from "../physics/rayPhysics";

export const OBJECT_SPRITES: Record<ObjectType, string> = {
  arrow: "/objects/arrow.png",
  apple: "/objects/apple.png",
  candle: "/objects/candle.png",
  tree: "/objects/tree.png",
  human: "/objects/human.png",
};

export const OBJECT_TYPE_OPTIONS: readonly ObjectType[] = [
  "arrow",
  "apple",
  "candle",
  "tree",
  "human",
];

export function getSpritePath(type: ObjectType): string {
  return OBJECT_SPRITES[type];
}
