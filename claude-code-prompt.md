Build a small web app called "Sjælland Wind" — a live wind dashboard for kitesurfing
spots around Zealand (Sjælland), Denmark, using DMI's (Danish Meteorological
Institute) free Open Data API.

## Data source

DMI Open Data — Meteorological Observation API (OGC API - Features, no API key
required):

- Base URL: `https://opendataapi.dmi.dk/v2/metObs/collections/...`
- Note: there's an older endpoint `dmigw.govcloud.dk` that retires 2026-06-30 —
  use the new `opendataapi.dmi.dk` one.
- Two collections: `station` and `observation`
- To get the latest reading for a station/parameter:
  `https://opendataapi.dmi.dk/v2/metObs/collections/observation/items?stationId=<ID>&parameterId=<PARAM>&period=latest`
- Docs: https://www.dmi.dk/friedata/dokumentation/meteorological-observation-api

**Important — CORS:** Direct browser fetches to `opendataapi.dmi.dk` are blocked by
CORS. The app needs a small backend/proxy layer (even a minimal one) that the
frontend calls instead of hitting DMI directly from the browser. Pick whatever
stack makes sense (e.g. a tiny Node/Express server, or Python).

## Stations to track

All of these are in/around Zealand and have `wind_speed`, `wind_dir`, `wind_max`,
`wind_min`, `wind_gust_always_past1h`, `wind_speed_past1h`, `wind_dir_past1h`
available.

Coastal (primary, kitesurf-relevant):
| ID | Name | Area |
|---|---|---|
| 06183 | Drogden Fyr | Øresund |
| 06147 | Vindebæk Kyst | Sydsjælland |
| 06149 | Gedser | Falster |
| 06169 | Gniben | Sjællands Odde |
| 06168 | Nakkehoved Fyr | Gilleleje / Nordkysten |
| 06151 | Omø Fyr | Vest for Sjælland |
| 06174 | Tessebølle | Køge Bugt |
| 06180 | Kastrup (CPH) | Øresund |
| 06170 | Roskilde Lufthavn | Roskilde Fjord |

Inland (secondary, lower priority but still available):
| ID | Name | Area |
|---|---|---|
| 06135 | Flakkebjerg | Vestsjælland |
| 06136 | Tystofte | Vestsjælland |
| 06141 | Abed | Lolland |
| 06154 | Brandelev | Sydsjælland |
| 06156 | Holbæk Flyveplads | Isefjord |
| 06181 | Jægersborg | Nordsjælland |
| 06188 | Sjælsmark | Nordsjælland |

## What to show per station

For each station, display a card with:

- Station name and area/location label
- Current (most recent) wind speed in **m/s**, large/prominent
- A wind direction indicator — a visual compass/arrow, not just the raw degree
  number (though the degree can be shown as supporting detail). Note: DMI's
  `wind_dir` is the direction the wind is blowing **from** (meteorological
  convention, 0/360 = North); decide how to visualize this clearly (e.g. arrow
  pointing in the direction the wind is blowing toward = `wind_dir + 180°`).
- Latest gust value (`wind_max`) as supporting info
- Timestamp of the last reading (`observed` field), in local Danish time
  (Europe/Copenhagen)
- Color-code the card (or speed value) based on the **Beaufort scale**, mapped
  from the m/s wind speed — full range 0–12, with a legend somewhere on the page
  explaining the color mapping

## Other requirements

- Auto-refresh periodically (e.g. every 5 minutes) plus a manual refresh button
- Danish UI labels are fine (this is a personal tool for a Danish kitesurfer), but
  English is also fine — your call
- Keep it simple — this is a small personal tool, not a production product. No
  need for accounts, databases, or persistence beyond what's needed for caching API
  responses if useful.
- Make sure the dev setup is easy to run locally (clear instructions, minimal
  dependencies)

## Open questions to verify while building

- Confirm DMI's CORS policy and pick the simplest proxy approach that works
- Double-check Beaufort scale m/s thresholds against an authoritative source
- Confirm exact semantics of `wind_max` vs `wind_max_per10min_past1h` and pick
  whichever best represents "recent gust"
