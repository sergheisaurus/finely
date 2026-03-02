#!/usr/bin/env bash
set -euo pipefail

# --- CONFIGURATION ---
NAS_USER="skode-admin"
NAS_IP="10.10.10.3"
PROJECT_NAME="finely"
REMOTE_BUILD_DIR="/volume1/docker/${PROJECT_NAME}_build"
NAS_DIR="/volume1/docker/${PROJECT_NAME}"
# ---------------------

# Check for Port Argument
if [ -z "${1-}" ]; then
  echo "❌ Error: Port argument required."
  echo "Usage: $0 <PORT>"
  exit 1
fi

NAS_PORT="$1"

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

    sed -i -E "s/\"[0-9]+:80\"/\"${NAS_PORT}:80\"/g" docker-compose.nas.yml
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
