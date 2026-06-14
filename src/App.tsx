import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { STATIONS } from "@/lib/stations";
import { fetchAllStations, fetchStationData, type StationData } from "@/lib/dmi";
import { StationCard } from "@/components/StationCard";
import { StationDetailOverlay } from "@/components/StationDetailOverlay";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;

type DataMap = Record<string, StationData>;

export default function App() {
  const [data, setData] = useState<DataMap>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const results = await fetchAllStations(STATIONS.map((s) => s.id));
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

  const retryStation = useCallback(async (stationId: string) => {
    setData((prev) => ({ ...prev, [stationId]: { ...prev[stationId], error: null } }));
    const result = await fetchStationData(stationId);
    setData((prev) => ({ ...prev, [stationId]: result }));
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3">
        <h1 className="font-sans font-bold text-sm tracking-widest leading-none">
          <span className="text-zinc-50">WIND</span><span className="text-zinc-500">ADDICT</span>
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
      </header>

      {/* Coastal section */}
      <section className="mb-2">
        <div className="border-t border-zinc-800">
          {coastal.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              data={data[station.id] ?? null}
              initialLoading={initialLoading}
              onRetry={retryStation}
              onClick={(rect) => { setSourceRect(rect); setSelectedId(station.id); }}
            />
          ))}
        </div>
      </section>


{/* Drill-down overlay */}
      {selectedStation && (
        <StationDetailOverlay
          station={selectedStation}
          currentSpeed={data[selectedStation.id]?.speed.value ?? null}
          currentGust={data[selectedStation.id]?.gust.value ?? null}
          currentDir={data[selectedStation.id]?.dir.value ?? null}
          sourceRect={sourceRect}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
