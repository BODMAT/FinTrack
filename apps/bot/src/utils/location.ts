import { Keyboard } from "grammy";
import type { MyContext } from "../context.js";

export type LatLng = { latitude: number; longitude: number };

// Reply keyboard offering to share a location ("📍 Yes") or skip ("No").
export function locationKeyboard(): Keyboard {
  return new Keyboard().requestLocation("📍 Yes").text("No").resized();
}

// Pulls a location off a message, or undefined when the user skipped / sent
// something else.
export function extractLocation(ctx: MyContext): LatLng | undefined {
  const loc = ctx.message?.location;
  if (!loc) return undefined;
  return { latitude: loc.latitude, longitude: loc.longitude };
}
