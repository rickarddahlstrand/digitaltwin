# Digital Twin - Hammarby Sjöstad

A 3D digital twin of the Hammarby Sjöstad district in Stockholm, built with CesiumJS and React. Users can explore buildings in a photorealistic 3D environment, click on structures to view OpenStreetMap metadata, and save custom names, notes, and categories via a PocketBase backend.

## Architecture Overview

```
Browser                        Server (PocketBase)
┌──────────────────────┐      ┌────────────────────────┐
│  React 19 + TS       │      │  PocketBase v0.36      │
│  CesiumJS (CDN)      │ ───► │  ├─ REST API (/api)    │
│  Tailwind CSS 4      │      │  ├─ pb_public (SPA)    │
│  Framer Motion       │      │  ├─ pb_hooks (JS)      │
│  PocketBase SDK      │      │  └─ SQLite (pb_data)   │
└──────────────────────┘      └────────────────────────┘
```

In production, PocketBase serves the built frontend as static files (`pb_public`) and handles the API — there is no separate web server. A Cloudflare Tunnel provides HTTPS and public access.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion |
| 3D Engine | CesiumJS 1.124 (loaded via CDN, not npm) |
| Backend | PocketBase 0.36 (Go binary + SQLite + JS hooks) |
| Testing | Vitest, @testing-library/react, happy-dom |
| Linting | ESLint 9 (flat config) + typescript-eslint |
| Deployment | Docker multi-stage, Cloudflare Tunnel |
| CI/CD | GitHub Actions (CI: lint+build+test, Docker: multi-arch push to GHCR) |

## Project Structure

```
digitaltwin/
├── frontend/                # React TypeScript app (Vite)
│   ├── src/
│   │   ├── components/      # React components (CesiumViewer, BuildingInfoPanel, etc.)
│   │   ├── hooks/           # Custom hooks (useCesiumViewer, useBuildingClick, usePOIs, etc.)
│   │   ├── lib/             # PocketBase SDK client and API functions
│   │   ├── context/         # React context (CesiumProvider)
│   │   ├── data/            # Static data (OSM label mappings)
│   │   ├── utils/           # Utility functions (animations, marker canvas)
│   │   ├── types/           # TypeScript type declarations (Cesium globals, Vite env)
│   │   └── test/            # Test setup
│   ├── public/              # Static assets (config.js with Cesium token)
│   ├── index.html           # Entry point (loads CesiumJS via CDN)
│   ├── vite.config.ts       # Vite + Vitest config
│   ├── eslint.config.js     # ESLint 9 flat config
│   └── tsconfig.json        # TypeScript config
├── pb_runtime/              # PocketBase runtime files
│   ├── pb_hooks/            # Server-side JavaScript hooks
│   ├── pb_migrations/       # Database migration files
│   └── pb_data/             # SQLite database (gitignored)
├── pb_runtime_beta/         # Beta environment data directory
├── pb/                      # Local PocketBase binary (gitignored)
├── oldgodot/                # Legacy Godot 3D project files (archived)
├── Dockerfile               # Multi-stage build (Node 22 -> Alpine + PocketBase)
├── docker-compose.yml       # Production deployment
├── docker-compose.beta.yml  # Beta deployment
├── CLAUDE.md                # AI assistant project context
└── .github/workflows/       # CI/CD pipelines
    ├── ci.yml               # Lint, build, test on push/PR
    └── docker.yml           # Multi-arch Docker build + push to GHCR
```

## Getting Started

### Prerequisites

- **Node.js** 22+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- **CesiumJS Ion token** — sign up at [cesium.com/ion](https://cesium.com/ion/)

### Setup

```bash
# Clone the repository
git clone https://github.com/rickarddahlstrand/digitaltwin.git
cd digitaltwin

# Install frontend dependencies
cd frontend && npm ci
```

### Configure Cesium Ion Token

The Cesium Ion access token is stored in the PocketBase `settings` collection — no config files needed.

1. Start PocketBase (see below)
2. Open the admin dashboard at `http://localhost:8090/_/`
3. Go to the **settings** collection
4. Create a record with `key`: `cesium_token` and `value`: your Cesium Ion token

### Development (Vite dev server)

For frontend-only development with hot reload. Uses Vite proxy to forward `/api` requests to a local PocketBase instance.

```bash
# Terminal 1: Start PocketBase
cd pb && ./pocketbase serve \
  --dir=../pb_runtime/pb_data \
  --hooksDir=../pb_runtime/pb_hooks \
  --migrationsDir=../pb_runtime/pb_migrations

# Terminal 2: Start Vite dev server
cd frontend && npm run dev
# Opens at http://localhost:5173
```

### Development (PocketBase-hosted, production-like)

Serves the built frontend directly from PocketBase, exactly as it runs in production.

```bash
# Build frontend
cd frontend && npm run build

# Start PocketBase with built frontend
cd .. && ./pb/pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=./pb_runtime/pb_data \
  --hooksDir=./pb_runtime/pb_hooks \
  --migrationsDir=./pb_runtime/pb_migrations \
  --publicDir=./frontend/dist

# Opens at http://localhost:8090
# Admin dashboard at http://localhost:8090/_/
```

### Download PocketBase (if not present)

```bash
# macOS (Apple Silicon)
PB_VERSION=0.36.2
curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_darwin_arm64.zip" \
  -o /tmp/pb.zip && unzip -o /tmp/pb.zip -d pb/ && rm /tmp/pb.zip
```

## Available Scripts

All commands run from the `frontend/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR and API proxy |
| `npm run build` | Type-check with `tsc -b` then build with Vite |
| `npm run lint` | Run ESLint on all source files |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run preview` | Preview production build locally |

## How It Works

### 3D Visualization

The app loads two CesiumJS 3D tile layers:

1. **Google Photorealistic 3D Tiles** — high-fidelity textured buildings and terrain
2. **OSM Buildings (Cesium Ion asset 96188)** — transparent overlay with per-building metadata (name, type, OSM ID, coordinates)

When a user clicks on a building, `drillPick` finds the OSM feature beneath the Google tiles, extracts its properties (name, building type, element ID, coordinates), and displays them in the info panel.

### Data Persistence

Building data is stored in PocketBase's `buildings` collection:

| Field | Type | Description |
|-------|------|-------------|
| `osm_id` | string | OpenStreetMap element ID (unique identifier) |
| `osm_type` | string | OSM element type (way, relation, etc.) |
| `custom_name` | string | User-defined building name |
| `notes` | string | Free-text notes about the building |
| `categories` | JSON array | Tags for filtering (e.g., "Energigemenskapen") |
| `latitude` | number | Building centroid latitude |
| `longitude` | number | Building centroid longitude |

Saved buildings appear as labeled POI markers on the map and can be filtered by category in the layer panel.

### CesiumJS Integration Notes

- CesiumJS is loaded via CDN `<script>` tag in `index.html`, not as an npm package (avoids ~150 MB bundle + asset copy complexity)
- TypeScript types come from the `cesium` npm package as a devDependency (types only)
- `window.Cesium` global is declared in `src/types/cesium.d.ts`
- The Cesium Ion access token is stored in PocketBase's `settings` collection and fetched at startup
- `React.StrictMode` is disabled because CesiumJS viewers cannot be double-mounted
- The scene clock is fixed to 2024-06-15T10:00:00Z for consistent midday lighting

## Docker

### Build locally

```bash
docker build -t digitaltwin:test .
```

The Dockerfile uses a multi-stage build:
1. **Stage 1** (`node:22-alpine`): Installs dependencies, builds the frontend with Vite
2. **Stage 2** (`alpine:3.21`): Downloads PocketBase, copies the built frontend to `pb_public`, copies hooks and migrations

### Production deployment

```bash
# Set tunnel token in .env
echo "TUNNEL_TOKEN=your-cloudflare-tunnel-token" > .env

# Start production stack
docker compose up -d
```

The production stack (`docker-compose.yml`) runs:
- **app**: PocketBase serving the SPA + API on port 8090
- **tunnel**: Cloudflare Tunnel for HTTPS ingress

### Beta deployment

```bash
echo "TUNNEL_TOKEN_BETA=your-beta-tunnel-token" > .env
docker compose -f docker-compose.beta.yml up -d
```

Beta uses a bind mount (`./pb_runtime_beta/pb_data`) instead of a named volume, and a separate network subnet.

## CI/CD

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:
1. Checkout code
2. Setup Node.js 22 with npm cache
3. `npm ci` — install dependencies
4. `npm run lint` — ESLint check
5. `npm run build` — TypeScript type-check + Vite build
6. `npm run test` — Vitest test suite

### Docker Pipeline (`.github/workflows/docker.yml`)

Runs on push to `main`:
1. Setup QEMU + Docker Buildx for multi-architecture builds
2. Login to GitHub Container Registry (GHCR)
3. Build and push `linux/amd64` + `linux/arm64` images
4. Tags: `latest` and `v{run_number}-{sha}`
5. Build args inject `GIT_HASH` and `BUILD_TIME` for version tracking
6. Uses GitHub Actions cache for faster builds

## License

This project is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
