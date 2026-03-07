#!/usr/bin/env bash
set -euo pipefail

if [ "${ALLOW_REMOTE_BUILD:-}" != "1" ]; then
  echo "ERROR: Remote builds on NAS are disabled by default." >&2
  echo "If you really want this fallback, re-run with: ALLOW_REMOTE_BUILD=1" >&2
  exit 1
fi

# --- CONFIGURATION ---
NAS_USER="skode-admin"
NAS_IP="10.10.10.3"
PROJECT_NAME="finely"
REMOTE_BUILD_DIR="/volume1/docker/${PROJECT_NAME}_build"
NAS_DIR="/volume1/docker/${PROJECT_NAME}"
# ---------------------

DEFAULT_PORT=${DEFAULT_PORT:-3015}

detect_existing_port() {
  local ports
  ports=$(ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker ps --filter name=${PROJECT_NAME} --format '{{.Ports}}'" || true)
  if [[ "$ports" =~ :([0-9]+)-\>8080/tcp ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

NAS_PORT="${1:-}"
if [ -z "$NAS_PORT" ]; then
  if NAS_PORT="$(detect_existing_port)"; then
    :
  else
    NAS_PORT="$DEFAULT_PORT"
  fi
fi

echo "🚀 Starting REMOTE deployment (Fallback) for ${PROJECT_NAME} on Port ${NAS_PORT}..."

# 0. Update docker-compose.nas.yml with the chosen port (restore afterwards)
if [ -f "docker-compose.nas.yml" ]; then
    echo "⚙️  Updating docker-compose.nas.yml port to ${NAS_PORT}..."

    COMPOSE_BACKUP_PATH="$(mktemp)"
    cp docker-compose.nas.yml "${COMPOSE_BACKUP_PATH}"
    cleanup() {
        if [ -f "${COMPOSE_BACKUP_PATH}" ]; then
            mv "${COMPOSE_BACKUP_PATH}" docker-compose.nas.yml
        fi
    }
    trap cleanup EXIT

    sed -i -E "s/\"[0-9]+:8080\"/\"${NAS_PORT}:8080\"/g" docker-compose.nas.yml
else
    echo "❌ Error: docker-compose.nas.yml not found."
    exit 1
fi

# 1. Create Archive (Local)
echo "📦 Creating source archive..."
# Exclude node_modules, vendor, storage/logs, etc.
tar --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='.git' \
    --exclude='storage/*.key' \
    --exclude='storage/logs/*' \
    --exclude='public/build' \
    --exclude='public/hot' \
    --exclude='deploy_package.tar.gz' \
    -czf /tmp/deploy_package.tar.gz .

# 2. Upload to NAS
echo "Tx Uploading source code to NAS (streaming)..."
# Using cat | ssh because scp seems flaky
ssh "${NAS_USER}@${NAS_IP}" "mkdir -p '${REMOTE_BUILD_DIR}'"
cat /tmp/deploy_package.tar.gz | ssh "${NAS_USER}@${NAS_IP}" "cat > '${REMOTE_BUILD_DIR}/deploy_package.tar.gz'"

# 3. Remote Build & Deploy
echo "🐳 Building on NAS (This might take a while)..."
ssh "${NAS_USER}@${NAS_IP}" "
  set -e
  cd '${REMOTE_BUILD_DIR}'
  tar -xzf deploy_package.tar.gz
  
  # Build Docker Image
  /usr/local/bin/docker build -t ${PROJECT_NAME}:latest .
  
  # Prepare Deploy Dir
  mkdir -p '${NAS_DIR}/storage' '${NAS_DIR}/database'
  
  # Move Compose File
  cp docker-compose.nas.yml '${NAS_DIR}/docker-compose.yml'
  
  # Deploy
  cd '${NAS_DIR}'
  /usr/local/bin/docker compose up -d --force-recreate
  
  # Cleanup
  rm -rf '${REMOTE_BUILD_DIR}'
"

# 4. Post-Deployment
echo "📦 Running Database Migrations..."
ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker exec ${PROJECT_NAME} php artisan migrate --force"
ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker exec ${PROJECT_NAME} php artisan optimize"

# 5. Cleanup Local
rm /tmp/deploy_package.tar.gz

echo "✅ Deployment Triggered. Verify at http://${NAS_IP}:${NAS_PORT}"
