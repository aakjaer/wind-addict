import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WindCompass } from "@/components/WindCompass";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BEAUFORT_SCALE } from "@/lib/beaufort";
import { fetchStationHistory, type HistoryPoint } from "@/lib/dmi";
import { beaufortFor, textColorFor } from "@/lib/beaufort";
import type { Station } from "@/lib/stations";

interface Props {
  station: Station;
  currentSpeed: number | null;
  currentGust: number | null;
  currentDir: number | null;
  sourceRect: DOMRect | null;
  onClose: () => void;
}

function fmtHour(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", {
    timeZone: "Europe/Copenhagen",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StationDetailOverlay({ station, currentSpeed, currentGust, currentDir, sourceRect, onClose }: Props) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bf = beaufortFor(currentSpeed);
  const headerBg = bf.color;
  const headerText = textColorFor(bf.color);
  const headerMuted = `${headerText}80`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => { setReady(true); setExpanded(true); });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = () => {
    setExpanded(false);
    setTimeout(onClose, 420);
  };

  useEffect(() => {
    fetchStationHistory(station.id).then((pts) => {
      setHistory(pts);
      setLoading(false);
    });
  }, [station.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const maxVal = history.reduce((m, p) => Math.max(m, p.gust ?? 0, p.speed ?? 0), 0);
  const minSpeed = history.reduce((m, p) => Math.min(m, p.speed ?? Infinity), Infinity);
  const dataMin = isFinite(minSpeed) ? minSpeed : 0;
  const dataMax = Math.max(history.reduce((m, p) => Math.max(m, p.speed ?? 0), 0), 0.01);
  const yMax = Math.max(Math.ceil((maxVal + 2) / 2) * 2, 8);

  // Gradient stops for Beaufort colors, ordered top→bottom (high speed → low speed)
  const gradientStops = (() => {
    const range = dataMax - dataMin;
    if (range <= 0) return [{ offset: "0%", color: BEAUFORT_SCALE[0].color }];
    const stops: { offset: string; color: string }[] = [];
    for (let i = BEAUFORT_SCALE.length - 1; i >= 0; i--) {
      const lowerBound = i === 0 ? 0 : BEAUFORT_SCALE[i - 1].max;
      if (lowerBound >= dataMax) continue;
      const clampedLower = Math.max(lowerBound, dataMin);
      const offset = ((dataMax - clampedLower) / range * 100).toFixed(1) + "%";
      stops.push({ offset, color: BEAUFORT_SCALE[i].color });
    }
    return stops;
  })();

  const startTop = sourceRect?.top ?? window.innerHeight;
  const startHeight = sourceRect?.height ?? 80;

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        left: 0,
        right: 0,
        background: "#09090b",
        top: expanded ? 0 : startTop,
        height: expanded ? "100dvh" : startHeight,
        transition: !ready
          ? "none"
          : expanded
            ? "top 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "top 0.4s cubic-bezier(0.32, 0, 0.67, 0), height 0.4s cubic-bezier(0.32, 0, 0.67, 0)",
      }}
    >

      {/* Header — identical layout to StationCard */}
      <div className="relative" style={{ background: headerBg, color: headerText }}>
        <div className="relative px-6 py-5 flex items-center justify-between gap-4" style={{ minHeight: "clamp(100px, 20vw, 140px)" }}>
          {/* Close button where staleness sits */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-6 p-1 transition-opacity hover:opacity-60"
            style={{ color: headerText }}
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Left: station name + area */}
          <div className="flex flex-col justify-center">
            <div className="font-bold leading-tight" style={{ fontSize: "clamp(36px, 7vw, 64px)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "normal" }}>
              {station.name}
            </div>
            <div className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: headerMuted }}>
              {station.area}
            </div>
          </div>

          {/* Right: speed + gust + compass */}
          <div className="flex items-center gap-4 shrink-0">
            {currentSpeed != null && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold leading-none tabular-nums" style={{ fontSize: "clamp(48px, 10vw, 80px)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "normal" }}>
                      {currentSpeed.toFixed(1)}
                    </span>
                    <span className="text-base font-mono-nums font-medium">m/s</span>
                  </div>
                  {currentGust != null && (
                    <span className="text-sm font-mono-nums" style={{ color: headerMuted }}>↑ {currentGust.toFixed(1)}</span>
                  )}
                </div>
                <WindCompass dirDeg={currentDir} accentColor={headerText} size={44} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart area — always on dark bg */}
      <div className="flex-1 min-h-0 px-4 pt-6 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" className="animate-spin">
              <circle cx="22" cy="22" r="18" stroke="#3f3f46" strokeWidth="2.5" />
              <path d="M22 4 A18 18 0 0 1 40 22" stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={history} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="beaufortGradient" x1="0" y1="0" x2="0" y2="1">
                  {gradientStops.map((s, i) => (
                    <stop key={i} offset={s.offset} stopColor={s.color} />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={fmtHour}
                tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "'Space Mono', monospace" }}
                tickLine={false}
                axisLine={false}
                scale="time"
                minTickGap={60}
              />
              <YAxis
                domain={[0, yMax]}
                tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "'Space Mono', monospace" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: "'Space Mono', monospace",
                  color: "#fafafa",
                }}
                labelFormatter={(v) => fmtHour(v as number)}
                formatter={(value, name) => [
                  `${(value as number).toFixed(1)} m/s`,
                  name === "speed" ? "Wind" : "Gust",
                ]}
              />
              <Line dataKey="gust" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls name="gust" />
              <Line dataKey="speed" stroke="url(#beaufortGradient)" strokeWidth={2.5} dot={false} connectNulls name="speed" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-5 flex gap-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono-nums">
          <span className="inline-block w-6 h-0.5" style={{ background: "linear-gradient(to right, #bbf7d0, #22c55e, #facc15, #ef4444, #7e22ce)" }} />
          Wind
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono-nums">
          <span className="inline-block w-6 border-t-2 border-dashed border-[#ef4444]" />
          Gust
        </div>
      </div>
    </div>
  );
}
