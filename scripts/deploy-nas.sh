#!/usr/bin/env bash
set -euo pipefail

# --- CONFIGURATION ---
NAS_USER="skode-admin"
NAS_IP="10.10.10.3"
PROJECT_NAME="finely"
# ---------------------

# Check for Port Argument
if [ -z "${1-}" ]; then
  echo "❌ Error: Port argument required."
  echo "Usage: $0 <PORT>"
  echo "Example: $0 5175"
  exit 1
fi

NAS_PORT="$1"
NAS_DIR="/volume1/docker/${PROJECT_NAME}"

# Detect Docker
if command -v docker.exe &> /dev/null; then
    DOCKER_CMD="docker.exe"
elif command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
else
    echo "❌ Error: Docker not found."
    exit 1
fi

echo "🚀 Starting deployment for ${PROJECT_NAME} on Port ${NAS_PORT}..."

# 0. Update docker-compose.nas.yml with the chosen port
if [ -f "docker-compose.nas.yml" ]; then
    echo "⚙️  Updating docker-compose.nas.yml port to ${NAS_PORT}..."
    # Replace the port mapping "xxxx:8080" or 'xxxx:8080'
    sed -i -E "s/['\"][0-9]+:8080['\"]/\"${NAS_PORT}:8080\"/g" docker-compose.nas.yml
else
    echo "❌ Error: docker-compose.nas.yml not found."
    exit 1
fi

# 1. Build the Frontend (Skipped - doing in Docker)
echo "📦 Building Frontend (In Docker)..."
# npm install
# npm run build

# 2. Build the Docker Image Locally
echo "🐳 Building Docker Image (Local)..."
IMAGE_TAG="${PROJECT_NAME}:latest"
# We need to make sure we are building for linux/amd64 since the NAS is likely x86_64
# If your machine is arm64 (Mac), use --platform linux/amd64
$DOCKER_CMD build -t "${IMAGE_TAG}" .

# 3. Save Image and Stream to NAS
echo "Tx Streaming Docker image to NAS..."
$DOCKER_CMD save "${IMAGE_TAG}" | ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker load"

# 4. Prepare Remote Directory
echo "📂 Preparing NAS directory: ${NAS_DIR}"
ssh "${NAS_USER}@${NAS_IP}" "mkdir -p '${NAS_DIR}/storage' '${NAS_DIR}/database'"

# 5. Upload Configuration
echo "Tx Uploading docker-compose.nas.yml..."
cat docker-compose.nas.yml | ssh "${NAS_USER}@${NAS_IP}" "cat > '${NAS_DIR}/docker-compose.yml'"

# 6. Remote Execution (Restart)
echo "🔥 Executing remote deployment..."
ssh "${NAS_USER}@${NAS_IP}" "
  cd '${NAS_DIR}' && \
  /usr/local/bin/docker compose up -d --force-recreate
"

# 7. Post-Deployment: Run Migrations & Permissions
echo "📦 Running Database Migrations & Optimization..."
# Ensure storage permissions are correct (serversideup image uses user 999:999 usually, or www-data)
ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker exec ${PROJECT_NAME} php artisan migrate --force"
ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker exec ${PROJECT_NAME} php artisan optimize"
ssh "${NAS_USER}@${NAS_IP}" "/usr/local/bin/docker exec ${PROJECT_NAME} php artisan budgets:update-spending"


# 8. Verification
echo "mag Verify deployment at http://${NAS_IP}:${NAS_PORT}"
for i in $(seq 1 30); do
  if curl -fsS "http://${NAS_IP}:${NAS_PORT}" >/dev/null 2>&1; then
    echo "✅ Deployment Successful!"
    exit 0
  fi
  sleep 1
done

echo "⚠️ Verification timed out (App might still be starting)"
exit 1
