// Beaufort scale — WMO authoritative m/s thresholds
// Each entry: [upperBound_exclusive, bfNumber, danishLabel, hex color]
// Colors follow the standard meteorological wind speed ramp (white → blue → teal → green → yellow → orange → red → purple)
// using Tailwind palette hex values for consistency
export const BEAUFORT_SCALE = [
  { max: 0.3,      bf: 0,  label: "Calm",            color: "#f8fafc" }, // slate-50    (white)
  { max: 1.6,      bf: 1,  label: "Light air",       color: "#bae6fd" }, // sky-200     (pale blue)
  { max: 3.4,      bf: 2,  label: "Light breeze",    color: "#7dd3fc" }, // sky-300     (light blue)
  { max: 4.5,      bf: 3,  label: "Gentle breeze",   color: "#60a5fa" }, // blue-400    (medium blue)
  { max: 5.5,      bf: 3,  label: "Gentle breeze",   color: "#34d399" }, // emerald-400 (teal bridge)
  { max: 6.7,      bf: 4,  label: "Moderate breeze", color: "#4ade80" }, // green-400   (light green)
  { max: 8.0,      bf: 4,  label: "Moderate breeze", color: "#22c55e" }, // green-500   (medium green)
  { max: 10.8,     bf: 5,  label: "Fresh breeze",    color: "#84cc16" }, // lime-500    (yellow-green)
  { max: 12.2,     bf: 6,  label: "Strong breeze",   color: "#fde047" }, // yellow-300  (bright yellow)
  { max: 13.9,     bf: 6,  label: "Strong breeze",   color: "#eab308" }, // yellow-500  (deep yellow)
  { max: 15.5,     bf: 7,  label: "Near gale",       color: "#fb923c" }, // orange-400  (light orange)
  { max: 17.2,     bf: 7,  label: "Near gale",       color: "#f97316" }, // orange-500  (orange)
  { max: 19.0,     bf: 8,  label: "Gale",            color: "#f87171" }, // red-400     (light red)
  { max: 20.8,     bf: 8,  label: "Gale",            color: "#ef4444" }, // red-500     (red)
  { max: 24.5,     bf: 9,  label: "Strong gale",     color: "#dc2626" }, // red-600     (deep red)
  { max: 28.5,     bf: 10, label: "Storm",           color: "#9f1239" }, // rose-800    (dark red)
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

