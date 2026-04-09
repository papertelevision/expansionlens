# Dental Practice Location Analyzer — Design Spec

## Context

ExpansionIQ is a new product providing "expansion data" to businesses evaluating new branch/franchise locations. This MVP focuses on dentistry as the first vertical. The goal is a working proof-of-concept that can be demoed to dental professionals, franchise operators, and investors — showing the core value proposition of location-based competitive analysis with a professional report output.

## Product Overview

A single-page Next.js application where a user enters a U.S. address and receives a location analysis report including a color-coded opportunity grid map, competitor data, demographic data, an opportunity score, and a written summary.

## Architecture

### File Structure

```
ExpansionIQ/
├── bin/dock                        # Docker wrapper script (bin/dock pattern)
├── docker-compose.dev.yml          # Single "web" service, port 3003:3000
├── Dockerfile.dev                  # Node 20 slim
├── package.json
├── next.config.mjs
├── .gitignore
├── app/
│   ├── layout.js                   # Root layout
│   ├── page.js                     # Main client component (input + report)
│   ├── globals.css                 # Enterprise SaaS palette via CSS custom properties
│   ├── api/analyze/route.js        # API route orchestrating external calls
│   └── components/Map.js           # Leaflet + Turf.js grid (dynamic import, no SSR)
└── lib/
    ├── scoring.js                  # Opportunity score formula
    ├── summary.js                  # Dynamic text summary generator
    └── census.js                   # Census FIPS lookup + ACS data fetch
```

### Data Flow

```
User enters address
  → page.js calls GET /api/analyze?address=...
    → route.js: Nominatim geocoding (address → lat/lon)
    → route.js: Overpass API (lat/lon → dentists within 3mi)
    → route.js: Census Geocoder (lat/lon → FIPS codes)
    → route.js: Census ACS (FIPS → population + median income)
    → route.js: scoring.js (inputs → score 0-100)
    → route.js: summary.js (inputs → paragraph)
  ← JSON response
  → page.js renders report + Map component
```

### Tech Stack

- Next.js 14 (App Router), JavaScript only (no TypeScript)
- Leaflet + react-leaflet for base maps
- Turf.js submodules for grid analysis
- Plain CSS with custom properties (no Tailwind, no UI libraries)
- Docker with bin/dock wrapper
- No database, no auth, no payments

## External APIs

### 1. Nominatim (Geocoding)

- Endpoint: `https://nominatim.openstreetmap.org/search`
- Params: `q=<address>&format=json&limit=1&countrycodes=us`
- Returns: `lat`, `lon`, `display_name`
- Requirement: custom `User-Agent` header per usage policy
- Rate limit: 1 request/second (fine for single queries)

### 2. Overpass API (Competitors)

- Endpoint: `https://overpass-api.de/api/interpreter`
- Query: `[out:json];node["amenity"="dentist"](around:4828,<lat>,<lon>);out;`
- Radius: 4828 meters (~3 miles)
- Returns: array of nodes with `name`, `lat`, `lon`

### 3. Census APIs (Demographics)

**Step 1 — FIPS Lookup (Primary: Census Geocoder)**
- Endpoint: `https://geocoding.geo.census.gov/geocoder/geographies/coordinates`
- Params: `x=<lon>&y=<lat>&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
- Returns: `STATE` (2-digit), `COUNTY` (3-digit), `TRACT` (6-digit) FIPS codes

**Step 1 — FIPS Lookup (Fallback: FCC Area API)**
- Endpoint: `https://geo.fcc.gov/api/census/block/find`
- Params: `latitude=<lat>&longitude=<lon>&format=json`
- Returns: `Block.FIPS` containing state + county + tract + block

**Step 2 — ACS Data**
- Endpoint: `https://api.census.gov/data/2022/acs/acs5`
- Params: `get=B01003_001E,B19013_001E&for=tract:<tract>&in=state:<state>+county:<county>`
- Returns: total population (`B01003_001E`), median household income (`B19013_001E`)
- No API key required (free tier, rate-limited)

## Scoring Formula

Deterministic, 0-100, three weighted components:

| Component | Max Points | Logic |
|-----------|-----------|-------|
| Population | 40 | `min(40, (population / 5000) * 40)` — linear, 5000/tract = full marks |
| Income | 35 | `min(35, (medianIncome / 75000) * 35)` — linear, $75k = full marks |
| Competition | 25 | `max(0, 25 - (competitorCount / 15) * 25)` — inverse, 0 = 25pts, 15+ = 0pts |

Score interpretation:
- 75-100: Strong opportunity
- 50-74: Moderate opportunity
- 25-49: Challenging
- 0-24: Poor fit

Works as both a standalone go/no-go verdict and for cross-location comparison (absolute, not relative).

## Grid Visualization (Key Feature)

### Approach: Uniform Demographics + Variable Competition

Census data is at the tract level (single value for the area). The only genuinely spatial variable is **competitor proximity**. Each grid cell's score reflects how far it is from dental competitors, multiplied by the demographic baseline.

### Grid Specification

- `turf.squareGrid()` generates **0.5 mile cells** within a `turf.circle()` of 3-mile radius
- Each cell's centroid distance to all competitors is calculated
- Cell mini-score formula: `competitorDistanceFactor × demographicBaselineMultiplier`
  - `competitorDistanceFactor` (0-1): `min(1, minDistToCompetitor / 1.5)` where `minDistToCompetitor` is the distance in miles from the cell centroid to the nearest competitor. Cells ≥1.5 miles from any competitor score 1.0 (best). Cells right on top of a competitor score ~0.
  - `demographicBaselineMultiplier` (0-1): `(popScore/40 + incomeScore/35) / 2` using the same population and income scoring logic from the main formula, normalized to 0-1. Same value for all cells since demographics are tract-level.
- Color gradient at ~0.4 opacity:
  - Green (`#10b981`) = high opportunity (far from competitors, good demographics)
  - Amber (`#f59e0b`) = moderate
  - Red (`#ef4444`) = low opportunity (near competitor clusters)

### Map Elements

- Blue marker: user's selected location
- Red/orange markers: each dental competitor
- Grid overlay: colored cells per above

## Summary Generator

Hardcoded logic (no AI API). Takes score, competitor count, population, and income as inputs. Generates a 3-4 sentence paragraph using template parts that vary based on:

- Score tier (strong/moderate/challenging/poor)
- Competition level (minimal ≤3, moderate ≤8, significant >8)
- Income level (above-average ≥$65k, average $45k-$65k, below-average <$45k)
- Population density (high ≥4000, moderate 2000-4000, low <2000)

## UI Design

### Layout States

1. **Initial**: Centered input — title, subtitle, address field, "Analyze Location" button
2. **Loading**: Spinner with status text
3. **Results**: Full report below the input area

### Report Layout

1. **Score header** — large score number with color-coded badge and tier label
2. **Map** — full-width Leaflet map with Turf.js grid overlay
3. **Metrics cards** — three cards in a row: Competitor Count, Population, Median Income
4. **Written summary** — paragraph in a highlighted card

### Styling

Enterprise SaaS palette via CSS custom properties:

```css
--primary: #1a2b4a       /* Dark navy */
--primary-light: #2d4a7a /* Lighter navy */
--accent: #3b82f6        /* Blue accent */
--success: #10b981       /* Green (good scores) */
--warning: #f59e0b       /* Amber (medium) */
--danger: #ef4444        /* Red (poor) */
--bg: #f8fafc            /* Light gray background */
--card: #ffffff           /* Card background */
--text: #1e293b          /* Dark text */
--text-muted: #64748b    /* Muted text */
```

Card-based layout with subtle shadows, generous whitespace, clear typographic hierarchy.

## Docker Setup

### Dockerfile.dev

Node 20 slim with git, curl, and GitHub CLI. Working directory `/app`. CMD runs `npm install && npm run dev`.

### docker-compose.dev.yml

Single `web` service:
- Build from `Dockerfile.dev`
- Port mapping: `3003:3000`
- Volume mounts: project dir at `/app`, named volume for `node_modules`, git config and gh config as read-only
- stdin/tty enabled

### bin/dock

Adapted from the baxtel6 pattern. Commands: `setup`, `up`, `down`, `build`, `run`, `exec`, `logs`, `ps`, `restart`, `reset`, `gh`, `help`. Same Docker auto-detection logic for macOS. Uses `docker-compose.dev.yml` as compose file.

## Dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@turf/square-grid": "^7.0.0",
  "@turf/circle": "^7.0.0",
  "@turf/centroid": "^7.0.0",
  "@turf/distance": "^7.0.0",
  "@turf/bbox": "^7.0.0",
  "@turf/boolean-point-in-polygon": "^7.0.0"
}
```

Individual Turf.js submodules instead of full `@turf/turf` to keep bundle small.

## Error Handling

- Bad address / no geocoding result: show "Could not find that address" message
- Overpass timeout (15s): show competitor section as "Unable to load competitor data"
- Census API failure: show demographics as "Data unavailable", still calculate partial score
- ACS returns `-666666666` for missing data: treat as unavailable

## API Response Shape

```json
{
  "address": "123 Main St, Austin, TX",
  "lat": 30.267,
  "lon": -97.743,
  "competitors": [
    { "name": "Smile Dental", "lat": 30.27, "lon": -97.74 }
  ],
  "competitorCount": 12,
  "population": 4500,
  "medianIncome": 72000,
  "score": 74,
  "summary": "This location shows strong potential..."
}
```

## Implementation Phases

**Phase 1: Scaffolding**
- Create bin/dock, Dockerfile.dev, docker-compose.dev.yml
- Create package.json, next.config.mjs, .gitignore
- Create minimal app/layout.js, app/page.js, app/globals.css
- Verify Next.js boots on localhost:3003

**Phase 2: API Route**
- Create lib/census.js (FIPS lookup + ACS fetch)
- Create lib/scoring.js (scoring formula)
- Create lib/summary.js (summary generator)
- Create app/api/analyze/route.js (orchestrate all calls)
- Test with curl

**Phase 3: Frontend**
- Build address input UI in page.js
- Build report layout (score header, metrics cards, summary)
- Create app/components/Map.js (Leaflet + Turf grid)
- Wire API call and render results

**Phase 4: Polish**
- Error handling and loading states
- Mobile responsiveness
- Score color coding and visual details

## Verification

1. `bin/dock setup && bin/dock up` — app loads at localhost:3003
2. Enter "123 Main St, Austin, TX" — geocoding succeeds
3. Results show: map with grid overlay, competitor markers, score, metrics, summary
4. Enter a rural address — score should be lower, fewer competitors
5. Enter an invalid address — error message displays cleanly
