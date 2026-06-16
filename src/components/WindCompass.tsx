interface WindCompassProps {
  dirDeg: number | null;
  accentColor: string;
  size?: number;
  speed?: number | null;
  gust?: number | null;
}

const HIGHLIGHT_TICKS = 6;

// wind_dir = direction wind blows FROM (meteorological)
export function WindCompass({ dirDeg, accentColor, size = 44, speed = null, gust = null }: WindCompassProps) {
  const hasData = dirDeg != null;
  const cx = size / 2;
  const cy = size / 2;

  const tickCount = 48;
  const outerR    = size * 0.46;
  const innerR    = size * 0.39;

  const stepSize = 360 / tickCount;
  const activeDeg = hasData ? Math.round(dirDeg! / stepSize) * stepSize : null;

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
        opacity = 0.1 + strength * 0.9;
        strokeW = size * (0.018 + strength * 0.014);
      }
    }

    const isActive = hasData && (() => {
      const diff = Math.abs(((angleDeg - dirDeg!) + 360) % 360);
      const distDeg = diff > 180 ? 360 - diff : diff;
      return distDeg < (360 / tickCount) / 2;
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

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={hasData ? `Wind from ${dirDeg}°` : "No direction data"}
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
