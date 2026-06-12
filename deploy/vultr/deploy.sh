#!/usr/bin/env bash
#
# Deploy the Personal Assistant stack to a Vultr server over SSH.
#
# Requires:
#   SERVER_IP        - the server's IP (printed by provision.sh), OR
#   VULTR_API_KEY    - if SERVER_IP is unset, the IP is looked up by label
#
# Optional:
#   SERVER_USER      - ssh user (default: root)
#   VULTR_LABEL      - instance label for the IP lookup (default: personal-assistant)
#   APP_DIR          - remote app directory (default: /opt/personal-assistant)
#
# Usage:
#   SERVER_IP=1.2.3.4 ./deploy/vultr/deploy.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_USER="${SERVER_USER:-root}"
APP_DIR="${APP_DIR:-/opt/personal-assistant}"
LABEL="${VULTR_LABEL:-personal-assistant}"

# ---------------------------------------------------------------------------
# Resolve server IP
# ---------------------------------------------------------------------------
if [ -z "${SERVER_IP:-}" ]; then
    if [ -z "${VULTR_API_KEY:-}" ]; then
        echo "ERROR: set SERVER_IP, or set VULTR_API_KEY so the IP can be looked up by label." >&2
        exit 1
    fi
    SERVER_IP=$(curl -fsS "https://api.vultr.com/v2/instances?label=$LABEL" \
        -H "Authorization: Bearer $VULTR_API_KEY" \
        | python3 -c 'import json,sys; i=json.load(sys.stdin).get("instances",[]); print(i[0]["main_ip"] if i else "")')
    if [ -z "$SERVER_IP" ]; then
        echo "ERROR: no Vultr instance found with label '$LABEL'. Run provision.sh first." >&2
        exit 1
    fi
fi
SSH_TARGET="$SERVER_USER@$SERVER_IP"
echo "Deploying to $SSH_TARGET:$APP_DIR"

# ---------------------------------------------------------------------------
# Sync the repository (excluding dev artifacts and local secrets)
# ---------------------------------------------------------------------------
ssh -o StrictHostKeyChecking=accept-new "$SSH_TARGET" "mkdir -p $APP_DIR $APP_DIR/secrets"

rsync -az --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'mobile/node_modules' \
    --exclude 'backend/venv' \
    --exclude 'venv' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'secrets' \
    --exclude '__pycache__' \
    --exclude '.expo' \
    "$REPO_ROOT/" "$SSH_TARGET:$APP_DIR/"

# ---------------------------------------------------------------------------
# Remote: prepare env, web root, then build and start
# ---------------------------------------------------------------------------
ssh "$SSH_TARGET" bash -s <<REMOTE
set -euo pipefail
cd $APP_DIR

# First-time .env setup from the production template
if [ ! -f .env ]; then
    cp env.production.template .env
    JWT=\$(openssl rand -base64 48 | tr -d '\n')
    PGPASS=\$(openssl rand -hex 24)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=\$JWT|" .env
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\$PGPASS|" .env
    echo ""
    echo "Created $APP_DIR/.env with generated JWT_SECRET and POSTGRES_PASSWORD."
fi

if grep -q "OPENAI_API_KEY=your-openai-api-key-here" .env; then
    echo ""
    echo "ERROR: OPENAI_API_KEY is not set on the server." >&2
    echo "Edit $APP_DIR/.env on the server and re-run this script:" >&2
    echo "  ssh $SSH_TARGET 'nano $APP_DIR/.env'" >&2
    exit 1
fi

# Nginx serves mobile/dist; if there is no web build, serve the test UI
if [ ! -f mobile/dist/index.html ]; then
    mkdir -p mobile/dist
    cp test-ui.html mobile/dist/index.html
    echo "No mobile web build found - serving test-ui.html at / instead."
fi

docker compose -f docker-compose.prod.yml up -d --build

echo "Waiting for backend health check..."
for i in \$(seq 1 30); do
    if curl -fsS http://localhost/health >/dev/null 2>&1; then
        echo "Backend is healthy."
        exit 0
    fi
    sleep 3
done
echo "ERROR: backend did not become healthy. Logs:" >&2
docker compose -f docker-compose.prod.yml logs --tail=50 backend >&2
exit 1
REMOTE

echo ""
echo "Deployed successfully."
echo "  App:      http://$SERVER_IP/"
echo "  API:      http://$SERVER_IP/health"
echo "  API docs: ssh tunnel to port 8000 (docs are not exposed publicly)"
