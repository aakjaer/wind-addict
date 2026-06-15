interface WindCompassProps {
  dirDeg: number | null;
  accentColor: string;
  size?: number;
  speed?: number | null;
  gust?: number | null;
}

const CARDINAL = [
  { label: "N", deg: 0 },
  { label: "E", deg: 90 },
  { label: "S", deg: 180 },
  { label: "W", deg: 270 },
];

// wind_dir = direction wind blows FROM (meteorological)
// Active ticks point TOWARD = (dirDeg + 180) % 360
export function WindCompass({ dirDeg, accentColor, size = 44, speed = null, gust = null }: WindCompassProps) {
  const hasData = dirDeg != null;
  const towardDeg = hasData ? dirDeg! : 0;

  const cx = size / 2;
  const cy = size / 2;

  const tickCount = 48;
  const outerR = size * 0.46;
  const innerR = size * 0.39;
  const activeInnerR = size * 0.33;
  const cardinalR = size * 0.42;
  const fontSize = size * 0.10;

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angleDeg = (360 / tickCount) * i;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;

    // Is this tick one of the two active ones (nearest to towardDeg)?
    const diff = Math.abs(((angleDeg - towardDeg) + 360) % 360);
    const normalised = diff > 180 ? 360 - diff : diff;
    const stepSize = 360 / tickCount;
    const isActive = hasData && normalised <= stepSize * 0.6;

    const r1 = outerR;
    const r2 = isActive ? activeInnerR : innerR;

    return {
      x1: cx + r1 * Math.cos(angleRad),
      y1: cy + r1 * Math.sin(angleRad),
      x2: cx + r2 * Math.cos(angleRad),
      y2: cy + r2 * Math.sin(angleRad),
      isActive,
    };
  });

  const showCenter = speed != null && size >= 80;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={hasData ? `Wind direction ${towardDeg}°` : "No direction data"}
    >
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1}
          x2={t.x2} y2={t.y2}
          stroke={accentColor}
          strokeWidth={t.isActive ? size * 0.028 : size * 0.018}
          strokeLinecap="round"
          opacity={t.isActive ? 1 : 0.25}
        />
      ))}

      {/* Cardinal labels */}
      {CARDINAL.map(({ label, deg }) => {
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
            opacity={0.5}
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
