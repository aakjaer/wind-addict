// Beaufort scale — WMO authoritative m/s thresholds
// Each entry: [upperBound_exclusive, bfNumber, danishLabel, hex color]
// Colors follow the standard meteorological wind speed ramp (white → blue → teal → green → yellow → orange → red → purple)
// using Tailwind palette hex values for consistency
export const BEAUFORT_SCALE = [
  { max: 0.3,      bf: 0,  label: "Calm",            color: "#bbf7d0" }, // green-200
  { max: 1.6,      bf: 1,  label: "Light air",       color: "#86efac" }, // green-300
  { max: 3.4,      bf: 2,  label: "Light breeze",    color: "#4ade80" }, // green-400
  { max: 5.5,      bf: 3,  label: "Gentle breeze",   color: "#22c55e" }, // green-500
  { max: 8.0,      bf: 4,  label: "Moderate breeze", color: "#16a34a" }, // green-600
  { max: 10.8,     bf: 5,  label: "Fresh breeze",    color: "#15803d" }, // green-700
  { max: 13.9,     bf: 6,  label: "Strong breeze",   color: "#facc15" }, // yellow-400
  { max: 17.2,     bf: 7,  label: "Near gale",       color: "#fb923c" }, // orange-400
  { max: 20.8,     bf: 8,  label: "Gale",            color: "#f97316" }, // orange-500
  { max: 24.5,     bf: 9,  label: "Strong gale",     color: "#ef4444" }, // red-500
  { max: 28.5,     bf: 10, label: "Storm",           color: "#b91c1c" }, // red-700
  { max: 32.7,     bf: 11, label: "Violent storm",   color: "#7e22ce" }, // purple-700
  { max: Infinity, bf: 12, label: "Hurricane",       color: "#581c87" }, // purple-900
] as const;

export type BeaufortEntry = (typeof BEAUFORT_SCALE)[number];

export function textColorFor(hexBg: string): string {
  const r = parseInt(hexBg.slice(1, 3), 16) / 255;
  const g = parseInt(hexBg.slice(3, 5), 16) / 255;
  const b = parseInt(hexBg.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.35 ? "#0E0D0B" : "#EEEAE5";
}

export function beaufortFor(ms: number | null | undefined): BeaufortEntry {
  if (ms == null || isNaN(ms)) return BEAUFORT_SCALE[0];
  for (const entry of BEAUFORT_SCALE) {
    if (ms < entry.max) return entry;
  }
  return BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
}

