#!/usr/bin/env bash
set -euo pipefail

NAS_HOST=${NAS_HOST:-10.10.10.3}
NAS_USER=${NAS_USER:-skode-admin}
NAS_DOCKER_BIN=${NAS_DOCKER_BIN:-/usr/local/bin/docker}

PROJECT_NAME=${PROJECT_NAME:-finely}
CONTAINER_NAME=${CONTAINER_NAME:-finely}
NAS_DIR=${NAS_DIR:-/volume1/docker/${PROJECT_NAME}}

# The currently published port on the NAS (used when we can't auto-detect).
DEFAULT_PORT=${DEFAULT_PORT:-3015}

# Detect Docker
if command -v docker.exe &> /dev/null; then
    DOCKER_CMD="docker.exe"
elif command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
else
    echo "❌ Error: Docker not found."
    exit 1
fi

detect_existing_port() {
  local ports
  ports=$(ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "${NAS_DOCKER_BIN} ps --filter name=${CONTAINER_NAME} --format '{{.Ports}}'" || true)
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

echo "Deploying ${PROJECT_NAME} to ${NAS_USER}@${NAS_HOST}"
echo "Using port: ${NAS_PORT}"
echo "NAS dir: ${NAS_DIR}"

compose_template="docker-compose.nas.yml"
if [ ! -f "$compose_template" ]; then
  echo "ERROR: docker-compose.nas.yml not found." >&2
  exit 1
fi

compose_tmp="$(mktemp)"
trap 'rm -f "$compose_tmp"' EXIT
sed -E "s/\"[0-9]+:8080\"/\"${NAS_PORT}:8080\"/g" "$compose_template" >"$compose_tmp"

# 1. Build the Frontend (Skipped - doing in Docker)
echo "📦 Building Frontend (In Docker)..."
# npm install
# npm run build

# 2. Build the Docker Image Locally
echo "🐳 Building Docker Image (Local)..."
IMAGE_TAG="${PROJECT_NAME}:latest"
# If you are on arm64 (Mac), you may need: --platform linux/amd64
"$DOCKER_CMD" build -t "${IMAGE_TAG}" .

# 3. Save Image and Stream to NAS
echo "Tx Streaming Docker image to NAS..."
"$DOCKER_CMD" save "${IMAGE_TAG}" | ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "${NAS_DOCKER_BIN} load"

# 4. Prepare Remote Directory
echo "📂 Preparing NAS directory: ${NAS_DIR}"
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "mkdir -p '${NAS_DIR}/storage' '${NAS_DIR}/database'"

# 5. Upload Configuration
echo "Tx Uploading docker-compose.nas.yml..."
cat "$compose_tmp" | ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "cat > '${NAS_DIR}/docker-compose.yml'"

# 6. Remote Execution (Restart)
echo "🔥 Executing remote deployment..."
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "
  cd '${NAS_DIR}' && \
  '${NAS_DOCKER_BIN}' compose up -d --force-recreate --remove-orphans
"

# 7. Post-Deployment: Run Migrations & Permissions
echo "📦 Running Database Migrations & Optimization..."
# Ensure storage permissions are correct (serversideup image uses user 999:999 usually, or www-data)
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "${NAS_DOCKER_BIN} exec ${CONTAINER_NAME} php artisan migrate --force"
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "${NAS_DOCKER_BIN} exec ${CONTAINER_NAME} php artisan optimize"
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_HOST}" "${NAS_DOCKER_BIN} exec ${CONTAINER_NAME} php artisan budgets:update-spending"


# 8. Verification
echo "Verify: http://${NAS_HOST}:${NAS_PORT}"
for i in $(seq 1 30); do
  if curl -fsS "http://${NAS_HOST}:${NAS_PORT}" >/dev/null 2>&1; then
    echo "✅ Deployment Successful!"
    exit 0
  fi
  sleep 1
done

echo "⚠️ Verification timed out (App might still be starting)"
exit 1
