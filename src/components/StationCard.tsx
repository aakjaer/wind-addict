import { useEffect, useRef, useState } from "react";
import { beaufortFor, textColorFor } from "@/lib/beaufort";
import { formatRelativeTime } from "@/lib/dmi";
import type { StationData } from "@/lib/dmi";
import type { Station } from "@/lib/stations";
import { WindCompass } from "./WindCompass";
import { WindFlow } from "./WindFlow";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: Station;
  data: StationData | null;
  initialLoading: boolean;
  onRetry: (stationId: string) => void;
  onClick: (rect: DOMRect) => void;
  gaugeType: 'compass' | 'flow';
  onGaugeClick: () => void;
}

export function StationCard({ station, data, initialLoading, onRetry, onClick, gaugeType, onGaugeClick }: StationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const ms = data?.speed.value ?? null;
  const dirDeg = data?.dir.value ?? null;
  const gustMs = data?.gust.value ?? null;
  const bf = beaufortFor(ms);
  const hasError = !!data?.error;
  const showSkeleton = initialLoading && data == null;

  const bgColor = hasError || showSkeleton ? "#18181b" : bf.color;
  const textColor = hasError || showSkeleton ? "#fafafa" : textColorFor(bf.color);
  const mutedColor = hasError || showSkeleton
    ? "rgba(238,234,229,0.45)"
    : `${textColor}99`;

  const lastObserved =
    [data?.speed.observed, data?.dir.observed, data?.gust.observed]
      .filter(Boolean).sort().reverse()[0] ?? null;

  // Flash animation on value change
  const prevMs = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (ms != null && prevMs.current != null && ms !== prevMs.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
    prevMs.current = ms;
  }, [ms]);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={hasError ? undefined : () => onClick(cardRef.current!.getBoundingClientRect())}
      onKeyDown={(e) => { if (!hasError && (e.key === "Enter" || e.key === " ")) onClick(cardRef.current!.getBoundingClientRect()); }}
      className={cn(
        "relative w-full border-b border-black/10 last:border-b-0 transition-all duration-300",
        !hasError && !showSkeleton && "cursor-pointer"
      )}
      style={{ background: bgColor, color: textColor }}
    >
      <div className="relative px-6 py-5 flex items-center justify-between gap-4" style={{ minHeight: "clamp(100px, 20vw, 140px)" }}>
        {/* Left: station name + area + staleness, vertically centered */}
        <div className="flex flex-col justify-center">
          <div className="font-semi" style={{ fontSize: "clamp(36px, 7vw, 64px)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "normal", lineHeight: 0.9 }}>
            {station.name}
          </div>
          <div className="text-xs font-semibold uppercase" style={{ color: mutedColor }}>
            {station.area}
            {!showSkeleton && !hasError && lastObserved && (
              <>
                <span className="px-1">·</span>
                <span className="font-mono-nums normal-case tracking-normal font-normal">{formatRelativeTime(lastObserved)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: big speed + unit/gust + compass */}
        <div className="flex items-center gap-4 shrink-0">
          {hasError ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(station.id); }}
              className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: textColor }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          ) : (
            <div
              className={cn(flash && "animate-[flashNum_0.6s_ease-out]", "transition-transform duration-500 ease-out", showSkeleton ? "scale-25" : "scale-100")}
              onClick={(e) => { e.stopPropagation(); if (!showSkeleton) onGaugeClick(); }}
            >
              {gaugeType === 'compass' ? (
                <>
                  <span className="hidden sm:block"><WindCompass dirDeg={dirDeg} accentColor={textColor} size={130} speed={ms} gust={gustMs} spinning={showSkeleton} /></span>
                  <span className="sm:hidden"><WindCompass dirDeg={dirDeg} accentColor={textColor} size={100} speed={ms} gust={gustMs} spinning={showSkeleton} /></span>
                </>
              ) : (
                <>
                  <span className="hidden sm:block"><WindFlow dirDeg={dirDeg} accentColor={textColor} size={130} speed={ms} gust={gustMs} spinning={showSkeleton} /></span>
                  <span className="sm:hidden"><WindFlow dirDeg={dirDeg} accentColor={textColor} size={100} speed={ms} gust={gustMs} spinning={showSkeleton} /></span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
