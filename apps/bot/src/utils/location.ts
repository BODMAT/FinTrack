import { Keyboard } from "grammy";
import type { MyContext } from "../context.js";

export type LatLng = { latitude: number; longitude: number };

export function locationKeyboard(): Keyboard {
  return new Keyboard().requestLocation("📍 Yes").text("No").resized();
}

export function extractLocation(ctx: MyContext): LatLng | undefined {
  const loc = ctx.message?.location;
  if (!loc) return undefined;
  return { latitude: loc.latitude, longitude: loc.longitude };
}
