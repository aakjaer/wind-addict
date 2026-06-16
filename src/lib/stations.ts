export interface Station {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
}

export const STATIONS: Station[] = [
  { id: "06183", name: "Drogden Fyr",       area: "Øresund",                lat: 55.534, lng: 12.729 },
  { id: "06180", name: "Kastrup",           area: "Øresund · CPH",          lat: 55.630, lng: 12.656 },
  { id: "06169", name: "Gniben",            area: "Sjællands Odde",         lat: 55.972, lng: 11.303 },
  { id: "06147", name: "Vindebæk Kyst",     area: "Sydsjælland",            lat: 55.070, lng: 12.040 },
  { id: "06149", name: "Gedser",            area: "Falster",                lat: 54.575, lng: 11.926 },
  { id: "06168", name: "Nakkehoved Fyr",    area: "Gilleleje · Nordkysten", lat: 56.103, lng: 12.351 },
  { id: "06170", name: "Roskilde Lufthavn", area: "Roskilde Fjord",         lat: 55.585, lng: 12.131 },
];
