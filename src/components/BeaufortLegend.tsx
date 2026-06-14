import { BEAUFORT_SCALE } from "@/lib/beaufort";

export function BeaufortLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {BEAUFORT_SCALE.map((entry) => (
        <div
          key={entry.bf}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-zinc-700"
          style={{ background: "#27272a" }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="font-mono-nums font-bold text-zinc-100">{entry.bf}</span>
          <span className="text-zinc-200">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
