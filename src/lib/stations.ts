export interface Station {
  id: string;
  name: string;
  area: string;
}

export const STATIONS: Station[] = [
  { id: "06183", name: "Drogden Fyr",       area: "Øresund"                },
  { id: "06147", name: "Vindebæk Kyst",     area: "Sydsjælland"            },
  { id: "06149", name: "Gedser",            area: "Falster"                },
  { id: "06169", name: "Gniben",            area: "Sjællands Odde"         },
  { id: "06168", name: "Nakkehoved Fyr",    area: "Gilleleje · Nordkysten" },
  { id: "06180", name: "Kastrup",           area: "Øresund · CPH"          },
  { id: "06170", name: "Roskilde Lufthavn", area: "Roskilde Fjord"         },
];
