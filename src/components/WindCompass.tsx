import { useEffect, useRef, useState } from "react";

interface WindCompassProps {
  dirDeg: number | null;
  accentColor: string;
  size?: number;
  speed?: number | null;
  gust?: number | null;
}

const HIGHLIGHT_TICKS = 6;

interface SpinDigitProps {
  digit: string;
  fontSize: number;
  color: string;
}

function SpinDigit({ digit, fontSize, color }: SpinDigitProps) {
  const lineH = fontSize * 1.05;
  const d = parseInt(digit);
  return (
    <span
      style={{
        display: "inline-block",
        height: lineH,
        overflow: "hidden",
        verticalAlign: "top",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(${-d * lineH}px)`,
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          willChange: "transform",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            style={{
              height: lineH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize,
              fontWeight: 600,
              fontFamily: "'Bebas Neue', sans-serif",
              color,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

interface SpinningSpeedProps {
  speed: number;
  fontSize: number;
  color: string;
}

function SpinningSpeed({ speed, fontSize, color }: SpinningSpeedProps) {
  const chars = speed.toFixed(1).split("");
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {chars.map((c, i) =>
        c === "." ? (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: "'Bebas Neue', sans-serif",
              color,
              lineHeight: 1,
              paddingBottom: fontSize * 0.02,
            }}
          >
            .
          </span>
        ) : (
          <SpinDigit key={i} digit={c} fontSize={fontSize} color={color} />
        )
      )}
    </span>
  );
}

export function WindCompass({ dirDeg, accentColor, size = 44, speed = null, gust = null }: WindCompassProps) {
  const hasData = dirDeg != null;
  const cx = size / 2;
  const cy = size / 2;

  const tickCount = 48;
  const outerR = size * 0.46;
  const innerR = size * 0.39;
  const stepSize = 360 / tickCount;

  // --- Animated direction ---
  const prevDirRef = useRef<number | null>(null);
  const animDirRef = useRef<number>(0);
  const [renderDir, setRenderDir] = useState<number | null>(dirDeg);
  const dirRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (dirRafRef.current) cancelAnimationFrame(dirRafRef.current);

    if (dirDeg == null) {
      prevDirRef.current = null;
      setRenderDir(null);
      return;
    }

    if (prevDirRef.current == null) {
      animDirRef.current = dirDeg;
      prevDirRef.current = dirDeg;
      setRenderDir(dirDeg);
      return;
    }

    const from = animDirRef.current;
    let diff = dirDeg - from;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    prevDirRef.current = dirDeg;

    if (Math.abs(diff) < 1) {
      animDirRef.current = dirDeg;
      setRenderDir(dirDeg);
      return;
    }

    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = from + diff * eased;
      animDirRef.current = current;
      setRenderDir(current);
      if (t < 1) dirRafRef.current = requestAnimationFrame(animate);
    };
    dirRafRef.current = requestAnimationFrame(animate);
    return () => { if (dirRafRef.current) cancelAnimationFrame(dirRafRef.current); };
  }, [dirDeg]);

  // --- Ticks ---
  const activeDeg = renderDir != null ? Math.round(renderDir / stepSize) * stepSize : null;

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angleDeg = stepSize * i;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    let opacity = 0.25;
    let strokeW = size * 0.018;

    if (activeDeg != null) {
      const diff = Math.abs(((angleDeg - activeDeg) + 360) % 360);
      const distDeg = diff > 180 ? 360 - diff : diff;
      const tickDist = distDeg / stepSize;
      if (tickDist <= HIGHLIGHT_TICKS) {
        const t = tickDist / HIGHLIGHT_TICKS;
        const strength = Math.pow(1 - t, 3);
        opacity = 0.25 + strength * 0.75;
        strokeW = size * (0.018 + strength * 0.014);
      }
    }

    const isActive = renderDir != null && (() => {
      const d = Math.abs(((angleDeg - renderDir) + 360) % 360);
      const dist = d > 180 ? 360 - d : d;
      return dist < (360 / tickCount) / 2;
    })();

    return {
      x1: cx + outerR * Math.cos(angleRad),
      y1: cy + outerR * Math.sin(angleRad),
      x2: cx + (isActive ? innerR - 9 : innerR) * Math.cos(angleRad),
      y2: cy + (isActive ? innerR - 9 : innerR) * Math.sin(angleRad),
      opacity,
      strokeW,
    };
  });

  const showCenter = speed != null && size >= 80;
  const fontSize = size * 0.32;

  // Vertical offsets matching original SVG layout
  const speedTopPct = gust != null ? (cy - size * 0.04) / size : 0.5;
  const gustTopPct = (cy + size * 0.18) / size;

  return (
    <div
      style={{ position: "relative", width: size, height: size, display: "inline-block" }}
      aria-label={hasData ? `Wind from ${dirDeg}°` : "No direction data"}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block" }}
      >
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={accentColor}
            strokeWidth={t.strokeW}
            strokeLinecap="round"
            opacity={t.opacity}
          />
        ))}
      </svg>

      {showCenter && speed != null && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {/* Speed digits */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${speedTopPct * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <SpinningSpeed speed={speed} fontSize={fontSize} color={accentColor} />
          </div>

          {/* Gust */}
          {gust != null && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${gustTopPct * 100}%`,
                transform: "translate(-50%, -50%)",
                fontSize: size * 0.09,
                fontFamily: "system-ui, sans-serif",
                color: accentColor,
                opacity: 0.55,
                whiteSpace: "nowrap",
              }}
            >
              ↑ {gust.toFixed(1)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
