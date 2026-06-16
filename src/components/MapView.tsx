import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATIONS } from "@/lib/stations";
import { beaufortFor } from "@/lib/beaufort";
import type { StationData } from "@/lib/dmi";

type DataMap = Record<string, StationData>;

interface MapViewProps {
  data: DataMap;
  onStationClick: (stationId: string) => void;
}

function markerHtml(speed: number | null, dir: number | null): string {
  const bf = beaufortFor(speed);
  const color = bf.color;
  const label = speed != null ? speed.toFixed(1) : "—";
  const shadow = "drop-shadow(0 1px 3px rgba(0,0,0,0.9))";

  const arrowSvg = dir != null
    ? `<svg width="16" height="16" viewBox="0 0 22 22" style="display:block;transform:rotate(${dir + 180}deg);filter:${shadow};">
        <line x1="11" y1="19" x2="11" y2="4" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        <polyline points="5.5,10 11,3.5 16.5,10" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`
    : `<svg width="22" height="22" viewBox="0 0 22 22" style="display:block;filter:${shadow};">
        <circle cx="11" cy="11" r="3" fill="${color}"/>
      </svg>`;

  return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;">
    ${arrowSvg}
    <span style="
      font-family:'Space Mono',monospace;
      font-size:14px;
      font-weight:700;
      letter-spacing:-0.15em;
      color:#ffffff;
      line-height:1;
      white-space:nowrap;
      text-shadow:0 1px 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.6);
    ">${label}</span>
  </div>`;
}

export function MapView({ data, onStationClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onClickRef = useRef(onStationClick);
  onClickRef.current = onStationClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [55.6, 12.0],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 14 }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    STATIONS.forEach((station) => {
      const sd = data[station.id];
      const speed = sd?.speed.value ?? null;
      const dir = sd?.dir.value ?? null;

      const icon = L.divIcon({
        className: "",
        html: markerHtml(speed, dir),
        iconSize: [44, 44],
        iconAnchor: [22, 14],
      });

      const marker = L.marker([station.lat, station.lng], { icon })
        .on("click", () => onClickRef.current(station.id))
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
