import { useEffect, useRef, useState } from "react";

interface WindCompassProps {
  dirDeg: number | null;
  accentColor: string;
  size?: number;
  speed?: number | null;
  gust?: number | null;
  spinning?: boolean;
}

const CARDINAL = [
  { label: "N", deg: 0 },
  { label: "E", deg: 90 },
  { label: "S", deg: 180 },
  { label: "W", deg: 270 },
];

const HIGHLIGHT_TICKS = 6;

// wind_dir = direction wind blows FROM (meteorological)
export function WindCompass({ dirDeg, accentColor, size = 44, speed = null, gust = null, spinning = false }: WindCompassProps) {
  const hasData = dirDeg != null;

  const [spinAngle, setSpinAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spinning) return;
    const PERIOD_MS = 1200; // one full rotation
    const animate = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setSpinAngle((elapsed % PERIOD_MS) / PERIOD_MS * 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [spinning]);

  const cx = size / 2;
  const cy = size / 2;

  const tickCount = 48;
  const outerR   = size * 0.46;
  const innerR   = size * 0.39;
  const cardinalR = size * 0.42;
  const fontSize  = size * 0.10;

  const stepSize = 360 / tickCount;
  const rawActiveDeg = spinning ? spinAngle : (hasData ? dirDeg! : null);
  // Snap to nearest tick so falloff is symmetric on both sides
  const activeDeg = rawActiveDeg != null
    ? Math.round(rawActiveDeg / stepSize) * stepSize
    : null;

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

        opacity = spinning ? 0.15 + strength * 0.35 : 0.1 + strength * 0.9;
        strokeW = size * (0.018 + (spinning ? strength * 0.006 : strength * 0.014));
      }
    }

    const isActive = !spinning && hasData && (() => {
      const diff = Math.abs(((angleDeg - dirDeg!) + 360) % 360);
      const distDeg = diff > 180 ? 360 - diff : diff;
      return distDeg < (360 / tickCount) / 2;
    })();

    const outerRi = outerR;
    const innerRi = isActive ? innerR - 9 : innerR;

    return {
      x1: cx + outerRi * Math.cos(angleRad),
      y1: cy + outerRi * Math.sin(angleRad),
      x2: cx + innerRi * Math.cos(angleRad),
      y2: cy + innerRi * Math.sin(angleRad),
      opacity,
      strokeW,
    };
  });

  const showCenter = !spinning && speed != null && size >= 80;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={spinning ? "Loading" : (hasData ? `Wind from ${dirDeg}°` : "No direction data")}
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



{/* Cardinal labels */}
      {!spinning && CARDINAL.map(({ label, deg }) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <text
            key={label}
            x={cx + cardinalR * Math.cos(rad)}
            y={cy + cardinalR * Math.sin(rad)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            fill={accentColor}
            opacity={1}
            letterSpacing="0"
          >
            {label}
          </text>
        );
      })}

      {/* Center: speed + gust */}
      {showCenter && (
        <>
          <text
            x={cx}
            y={gust != null ? cy - size * 0.04 : cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.32}
            fontWeight="600"
            fontFamily="'Bebas Neue', sans-serif"
            fill={accentColor}
          >
            {speed!.toFixed(1)}
          </text>
          {gust != null && (
            <text
              x={cx}
              y={cy + size * 0.18}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.09}
              fontFamily="system-ui, sans-serif"
              fill={accentColor}
              opacity={0.55}
            >
              ↑ {gust.toFixed(1)}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
