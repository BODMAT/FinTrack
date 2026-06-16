import { Keyboard } from "grammy";
import type { MyContext } from "../context.js";

export type LatLng = { latitude: number; longitude: number };

export const REMOVE_LOCATION_LABEL = "🗑 Remove";

export function locationKeyboard(): Keyboard {
  return new Keyboard().requestLocation("📍 Yes").text("No").resized();
}

export function locationEditKeyboard(): Keyboard {
  return new Keyboard()
    .requestLocation("📍 Update")
    .text("Keep")
    .text(REMOVE_LOCATION_LABEL)
    .resized();
}

export function extractLocation(ctx: MyContext): LatLng | undefined {
  const loc = ctx.message?.location;
  if (!loc) return undefined;
  return { latitude: loc.latitude, longitude: loc.longitude };
}

export function extractLocationEdit(ctx: MyContext): LatLng | null | undefined {
  const loc = ctx.message?.location;
  if (loc) return { latitude: loc.latitude, longitude: loc.longitude };
  if (ctx.message?.text === REMOVE_LOCATION_LABEL) return null;
  return undefined;
}
