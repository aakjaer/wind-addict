const DMI_ORIGIN = import.meta.env.DEV
  ? "/api/dmi"
  : "https://opendataapi.dmi.dk";
const API_BASE = `${DMI_ORIGIN}/v2/metObs/collections/observation/items`;

export interface ObsResult {
  value: number | null;
  observed: string | null;
}

export interface StationData {
  stationId: string;
  speed: ObsResult;
  dir: ObsResult;
  gust: ObsResult;
  error: string | null;
}

// Global request queue — caps total concurrent DMI requests to avoid 429s.
// DMI's rate limit is per-IP; 3 in-flight at once is safe.
let activeRequests = 0;
const CONCURRENCY = 3;
const queue: Array<() => void> = [];

async function rateLimitedFetch(url: string): Promise<Response> {
  await new Promise<void>((resolve) => {
    if (activeRequests < CONCURRENCY) {
      activeRequests++;
      resolve();
    } else {
      queue.push(() => { activeRequests++; resolve(); });
    }
  });
  try {
    return await fetch(url);
  } finally {
    activeRequests--;
    if (queue.length > 0) queue.shift()!();
  }
}

async function fetchParam(stationId: string, parameterId: string): Promise<ObsResult> {
  const url = `${API_BASE}?stationId=${stationId}&parameterId=${parameterId}&period=latest`;
  const res = await rateLimitedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.features?.length) return { value: null, observed: null };
  const f = data.features[0];
  return { value: f.properties.value ?? null, observed: f.properties.observed ?? null };
}

export async function fetchStationData(stationId: string): Promise<StationData> {
  try {
    const [speed, dir, gust] = await Promise.all([
      fetchParam(stationId, "wind_speed"),
      fetchParam(stationId, "wind_dir"),
      fetchParam(stationId, "wind_max"),
    ]);
    return { stationId, speed, dir, gust, error: null };
  } catch (e) {
    const empty: ObsResult = { value: null, observed: null };
    return { stationId, speed: empty, dir: empty, gust: empty,
             error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchAllStations(stationIds: string[]): Promise<StationData[]> {
  return Promise.all(stationIds.map(fetchStationData));
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "–";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

export interface HistoryPoint {
  time: number; // unix ms
  speed: number | null;
  gust: number | null;
  dir: number | null;
}

export async function fetchStationHistory(stationId: string): Promise<HistoryPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/\.\d+Z$/, "Z");
  const datetime = `${fmt(start)}/${fmt(end)}`;

  async function fetchAll(parameterId: string): Promise<Array<{ time: number; value: number }>> {
    const url = `${API_BASE}?stationId=${stationId}&parameterId=${parameterId}&datetime=${datetime}&limit=1000`;
    const res = await rateLimitedFetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map((f: { properties: { observed: string; value: number } }) => ({
      time: new Date(f.properties.observed).getTime(),
      value: f.properties.value ?? null,
    }));
  }

  const [speeds, gusts, dirs] = await Promise.all([
    fetchAll("wind_speed"),
    fetchAll("wind_max"),
    fetchAll("wind_dir"),
  ]);

  // Merge by timestamp (10-minute slots)
  const map = new Map<number, HistoryPoint>();
  for (const s of speeds) {
    map.set(s.time, { time: s.time, speed: s.value, gust: null, dir: null });
  }
  for (const g of gusts) {
    const p = map.get(g.time);
    if (p) p.gust = g.value;
    else map.set(g.time, { time: g.time, speed: null, gust: g.value, dir: null });
  }
  for (const d of dirs) {
    const p = map.get(d.time);
    if (p) p.dir = d.value;
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}
