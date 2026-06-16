import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { STATIONS } from "@/lib/stations";
import { fetchStationData, type StationData } from "@/lib/dmi";
import { StationCard } from "@/components/StationCard";
import { StationDetailOverlay } from "@/components/StationDetailOverlay";
import { MapView } from "@/components/MapView";
import { ViewSwitcher } from "@/components/ViewSwitcher";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;

type DataMap = Record<string, StationData>;

export default function App() {
  const [data, setData] = useState<DataMap>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [gaugeType, setGaugeType] = useState<'compass' | 'flow'>('compass');
  const cycleGauge = () => setGaugeType(t => t === 'compass' ? 'flow' : 'compass');
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const ids = STATIONS.map((s) => s.id);
    let completed = 0;
    setLoadProgress(0);
    const results = await Promise.all(
      ids.map((id) =>
        fetchStationData(id).then((r) => {
          completed += 1;
          setLoadProgress(completed / ids.length);
          return r;
        })
      )
    );
    const map: DataMap = {};
    results.forEach((r) => { map[r.stationId] = r; });
    setData(map);
    setLastUpdated(new Date());
    setInitialLoading(false);
    if (isManual) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => fetchAll(), REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedId) return;
      if (e.key === "ArrowLeft") setView("list");
      if (e.key === "ArrowRight") setView("map");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const retryStation = useCallback(async (stationId: string) => {
    setRetryingIds((prev) => new Set(prev).add(stationId));
    setData((prev) => ({ ...prev, [stationId]: { ...prev[stationId], error: null } }));
    const result = await fetchStationData(stationId);
    setData((prev) => ({ ...prev, [stationId]: result }));
    setRetryingIds((prev) => { const next = new Set(prev); next.delete(stationId); return next; });
  }, []);

  const coastal = STATIONS;

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-GB", {
        timeZone: "Europe/Copenhagen",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const selectedStation = selectedId ? STATIONS.find((s) => s.id === selectedId) ?? null : null;

  return (
    <div className={`bg-zinc-950 text-zinc-50 ${view === 'map' ? 'h-dvh flex flex-col' : 'min-h-screen'}`}>

      {/* Header */}
      <header ref={headerRef} className="relative flex items-center justify-between px-6 py-3" style={{ zIndex: 960 }}>
        <h1 className="font-sans font-bold text-sm leading-none">
          <span className="text-zinc-50">WIND ADDICT</span>
        </h1>
        <div className="flex items-center gap-3">
          {formattedTime && (
            <span className="text-zinc-600 text-xs font-mono-nums hidden sm:block">
              {refreshing ? "Updating…" : formattedTime}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing || initialLoading}
            className="text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        {initialLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-300 ease-out"
              style={{ width: `${loadProgress * 100}%` }}
            />
          </div>
        )}
      </header>

      {view === 'list' ? (
        <section className="mb-2">
          <div className="border-t border-zinc-800">
            {coastal.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                data={data[station.id] ?? null}
                initialLoading={initialLoading}
                retrying={retryingIds.has(station.id)}
                onRetry={retryStation}
                onClick={(rect) => { setSourceRect(rect); setSelectedId(station.id); }}
                gaugeType={gaugeType}
                onGaugeClick={cycleGauge}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex-1 min-h-0">
          <MapView data={data} onStationClick={(id) => { setSourceRect(null); setSelectedId(id); }} />
        </div>
      )}


      <ViewSwitcher view={view} onChange={setView} />

{/* Drill-down overlay */}
      {selectedStation && (
        <StationDetailOverlay
          station={selectedStation}
          currentSpeed={data[selectedStation.id]?.speed.value ?? null}
          currentGust={data[selectedStation.id]?.gust.value ?? null}
          currentDir={data[selectedStation.id]?.dir.value ?? null}
          lastObserved={
            [data[selectedStation.id]?.speed.observed, data[selectedStation.id]?.dir.observed, data[selectedStation.id]?.gust.observed]
              .filter(Boolean).sort().reverse()[0] ?? null
          }
          sourceRect={sourceRect}
          headerHeight={headerRef.current?.offsetHeight ?? 0}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
