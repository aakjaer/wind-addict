import { useEffect, useRef, useState } from "react";

interface WindFlowProps {
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
const N_PARTICLES = 10;

interface Particle {
  lane: number;          // perpendicular offset from center axis (in px)
  progress: number;      // position along flow axis (px, negative = approaching)
  speedVariation: number; // per-particle random factor (0.7–1.3)
}

function initParticles(outerR: number, n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const lane = ((i / (n - 1)) - 0.5) * 2 * outerR * 0.88;
    const maxProg = Math.sqrt(Math.max(0, outerR * outerR - lane * lane));
    return {
      lane,
      progress: -maxProg + Math.random() * 2 * maxProg,
      speedVariation: 0.7 + Math.random() * 0.6,
    };
  });
}

export function WindFlow({ dirDeg, accentColor, size = 44, speed = null, gust = null, spinning = false }: WindFlowProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR  = size * 0.46;
  const innerR  = size * 0.39;
  const cardinalR = size * 0.42;
  const fontSize  = size * 0.10;
  const tickCount = 48;
  const stepSize  = 360 / tickCount;

  // Spinner state (reuse same approach as WindCompass)
  const [spinAngle, setSpinAngle] = useState(0);
  const spinStart = useRef<number | null>(null);
  const spinRaf   = useRef<number | null>(null);

  // Particle state
  const particlesRef = useRef<Particle[]>(initParticles(outerR, N_PARTICLES));
  const lastTs = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const flowRaf = useRef<number | null>(null);

  // Re-init particles when size changes
  useEffect(() => {
    particlesRef.current = initParticles(outerR, N_PARTICLES);
  }, [size, outerR]);

  // Spinner RAF
  useEffect(() => {
    if (!spinning) return;
    const PERIOD = 1200;
    const animate = (ts: number) => {
      if (spinStart.current == null) spinStart.current = ts;
      setSpinAngle(((ts - spinStart.current) % PERIOD) / PERIOD * 360);
      spinRaf.current = requestAnimationFrame(animate);
    };
    spinRaf.current = requestAnimationFrame(animate);
    return () => { if (spinRaf.current != null) cancelAnimationFrame(spinRaf.current); };
  }, [spinning]);

  // Particle flow RAF
  useEffect(() => {
    if (spinning || dirDeg == null) return;

    const animate = (ts: number) => {
      const dt = lastTs.current != null ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0;
      lastTs.current = ts;

      // Flow direction: FROM dirDeg, so particles move toward dirDeg+180
      const flowAngleRad = ((dirDeg + 180 - 90) * Math.PI) / 180;
      const fx = Math.cos(flowAngleRad);
      const fy = Math.sin(flowAngleRad);

      // Map wind speed (m/s) to px/s: calm=slow, storm=fast
      const windMs = speed ?? 0;
      const baseSpeed = outerR * (0.1 + Math.pow(Math.min(windMs / 25, 1), 0.7) * 1.9);

      for (const p of particlesRef.current) {
        p.progress += baseSpeed * p.speedVariation * dt;
        const maxProg = Math.sqrt(Math.max(0, outerR * outerR - p.lane * p.lane));
        if (p.progress > maxProg + size * 0.05) {
          p.progress = -maxProg;
        }
      }

      setTick(t => t + 1);
      flowRaf.current = requestAnimationFrame(animate);
    };

    lastTs.current = null;
    flowRaf.current = requestAnimationFrame(animate);
    return () => { if (flowRaf.current != null) cancelAnimationFrame(flowRaf.current); };
  }, [spinning, dirDeg, outerR, size, speed]);

  // Tick ring (same as WindCompass)
  const activeDeg = spinning ? spinAngle : (dirDeg != null ? Math.round(dirDeg / stepSize) * stepSize : null);

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angleDeg = stepSize * i;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    let opacity = spinning ? 0.12 : 0.15;
    let strokeW = size * 0.018;

    if (activeDeg != null) {
      const diff = Math.abs(((angleDeg - activeDeg) + 360) % 360);
      const distDeg = diff > 180 ? 360 - diff : diff;
      const tickDist = distDeg / stepSize;
      if (tickDist <= HIGHLIGHT_TICKS) {
        const t = tickDist / HIGHLIGHT_TICKS;
        const strength = Math.pow(1 - t, 3);
        opacity = spinning ? 0.15 + strength * 0.35 : 0.15 + strength * 0.55;
        strokeW = size * (0.018 + strength * 0.010);
      }
    }

    const isActive = !spinning && dirDeg != null && (() => {
      const diff = Math.abs(((angleDeg - dirDeg) + 360) % 360);
      const distDeg = diff > 180 ? 360 - diff : diff;
      return distDeg < stepSize / 2;
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

  // Particle trails to render
  const trails: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  if (!spinning && dirDeg != null) {
    const flowAngleRad = ((dirDeg + 180 - 90) * Math.PI) / 180;
    const fx = Math.cos(flowAngleRad);
    const fy = Math.sin(flowAngleRad);
    const perpX = -fy;
    const perpY = fx;
    const trailLen = size * 0.055;

    for (const p of particlesRef.current) {
      const maxProg = Math.sqrt(Math.max(0, outerR * outerR - p.lane * p.lane));
      if (maxProg === 0) continue; // lane outside circle

      const headX = cx + perpX * p.lane + fx * p.progress;
      const headY = cy + perpY * p.lane + fy * p.progress;
      const tailX = headX - fx * trailLen;
      const tailY = headY - fy * trailLen;

      // Fade in as particle enters, fade out as it exits
      const relProg = (p.progress + maxProg) / (2 * maxProg); // 0 → 1 across the circle
      const edgeFade = Math.min(relProg * 5, 1) * Math.min((1 - relProg) * 5, 1);

      trails.push({ x1: tailX, y1: tailY, x2: headX, y2: headY, opacity: edgeFade * 0.75 });
    }
  }

  const clipId = `flow-clip-${size}`;
  const showCenter = !spinning && speed != null && size >= 80;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={spinning ? "Loading" : (dirDeg != null ? `Wind from ${dirDeg}°` : "No direction data")}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={outerR} />
        </clipPath>
      </defs>

      {/* Tick ring */}
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

      {/* Particle trails clipped to circle */}
      <g clipPath={`url(#${clipId})`}>
        {trails.map((tr, i) => (
          <line
            key={i}
            x1={tr.x1} y1={tr.y1}
            x2={tr.x2} y2={tr.y2}
            stroke={accentColor}
            strokeWidth={size * 0.016}
            strokeLinecap="round"
            opacity={tr.opacity * 0.4}
          />
        ))}
      </g>

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
            opacity={0.6}
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
