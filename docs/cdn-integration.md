# CDN Integration

Finely integrates with the separate CDN service (Django/DRF) to store media files.

## Why

- Keep Finely's DB small (store metadata + links)
- Serve media from a dedicated service
- Support future features (inventory item images, receipts, etc.)

## Configuration

Set these environment variables for the Finely container:

- `CDN_BASE_URL` (example: `http://10.10.10.3:5173`)
- `CDN_API_TOKEN` (optional, if CDN enforces `API_TOKEN`)
- `CDN_PROJECT_ID` (optional; otherwise bootstrap stores it in DB)

## Endpoints

All endpoints are under `auth:sanctum`.

- Health check: `GET /api/integrations/cdn/health`
    - Calls CDN `GET /api/stats/dashboard/`

- Bootstrap: `POST /api/integrations/cdn/bootstrap`
    - Ensures a CDN project named `Finely` exists
    - Stores `integration_settings.key = cdn.project` with `{ project_id, name }`

## Storage

Finely stores a generic mapping table for CDN files:

- `cdn_assets` (`app/Models/CdnAsset.php`)
    - `attachable_type`/`attachable_id` allows linking to any Finely model later

## Notes

- Pangolin auth only protects the proxied domain; Finely uses the NAS LAN IP:port.
- Enable token auth on the CDN if you don't want the API open on that port.
- CDN upload pipeline performs duplicate detection (same file hash in same project/folder) and reuses the existing file id.
