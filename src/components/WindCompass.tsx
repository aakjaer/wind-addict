interface WindCompassProps {
  dirDeg: number | null;
  accentColor: string;
  size?: number;
}

// wind_dir = direction wind blows FROM (meteorological)
// Arrow points TOWARD = (dirDeg + 180) % 360
export function WindCompass({ dirDeg, accentColor, size = 44 }: WindCompassProps) {
  const towardDeg = dirDeg != null ? (dirDeg + 180) % 360 : 0;
  const hasData = dirDeg != null;

  const cx = size / 2;
  const cy = size / 2;
  const s = size / 44;

  // Paper-plane / nav-pointer shape, solid fill, pointing up
  const tip   = `${cx},${cy - 17 * s}`;
  const rWing = `${cx + 12 * s},${cy + 12 * s}`;
  const notch = `${cx},${cy + 5 * s}`;
  const lWing = `${cx - 12 * s},${cy + 12 * s}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={hasData ? `Vindretning mod ${towardDeg}°` : "Ingen retningsdata"}
    >
      <g
        transform={`rotate(${towardDeg}, ${cx}, ${cy})`}
        opacity={hasData ? 1 : 0.15}
      >
        <polygon
          points={`${tip} ${rWing} ${notch} ${lWing}`}
          fill={accentColor}
        />
      </g>
    </svg>
  );
}
