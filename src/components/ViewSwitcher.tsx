import { List, Map } from "lucide-react";

type View = "list" | "map";

interface ViewSwitcherProps {
  view: View;
  onChange: (v: View) => void;
}

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div
      className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-zinc-900/95 backdrop-blur p-1.5 shadow-2xl ring-1 ring-white/10"
      style={{ zIndex: 900 }}
    >
      {/* Sliding indicator */}
      <div
        className="absolute w-12 h-12 rounded-full bg-zinc-700"
        style={{
          top: 6,
          left: 6,
          transform: view === "map" ? "translateX(52px)" : "translateX(0)",
          transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />

      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
          view === "list" ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onChange("map")}
        aria-label="Map view"
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
          view === "map" ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <Map size={18} />
      </button>
    </div>
  );
}
