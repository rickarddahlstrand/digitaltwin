# Digital Twin - Hammarby Sjostad

## Stack

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Framer Motion
- **3D Engine**: CesiumJS (loaded via CDN in index.html, NOT npm)
- **Backend**: PocketBase (SQLite, Go-based, JS hooks)
- **Deployment**: Docker multi-stage + Cloudflare Tunnel
- **CI/CD**: GitHub Actions (lint + build + test -> Docker multi-arch -> GHCR)
- **Testing**: Vitest + @testing-library/react + jsdom

## Project Structure

```
digitaltwin/
  frontend/          # React TypeScript app (Vite)
  pb_runtime/        # PocketBase runtime (hooks, migrations, data)
  pb_runtime_beta/   # Beta environment data
  pb/                # Local PocketBase binary (gitignored)
  oldgodot/          # Archived Godot project files
```

## Commands

```bash
# Frontend
cd frontend && npm run dev      # Dev server with Vite proxy
cd frontend && npm run build    # tsc -b && vite build
cd frontend && npm run lint     # ESLint
cd frontend && npm run test     # Vitest

# PocketBase (local)
cd pb && ./pocketbase serve \
  --dir=../pb_runtime/pb_data \
  --hooksDir=../pb_runtime/pb_hooks \
  --migrationsDir=../pb_runtime/pb_migrations

# Docker
docker build -t digitaltwin:test .
```

## CesiumJS Notes

- Loaded via CDN `<script>` in index.html - accessed as `window.Cesium`
- TypeScript types: `cesium` npm package as devDependency (types only) + `src/types/cesium.d.ts` for window global
- Cesium Ion token stored in PocketBase `settings` collection (key: `cesium_token`)
- React.StrictMode disabled: CesiumJS incompatible with double-mount
- Fixed clock time (2024-06-15T10:00:00Z) for consistent lighting
- Home view: Hammarby Sjostad (18.094, 59.2929, alt 991m)

## PocketBase Notes

- API accessed via PocketBase JS SDK (`pocketbase` npm package)
- Vite proxy: `/api` -> `http://127.0.0.1:8090`
- Dynamic URL in production: `window.location.origin`
- Hooks: `*.pb.js` auto-loaded, `*.js` = modules via `require()`

## Godot Notes

- Legacy Godot files archived in `oldgodot/` — not part of the active web stack
