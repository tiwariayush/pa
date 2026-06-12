#!/usr/bin/env bash
#
# Provision a Vultr VPS for the Personal Assistant stack.
#
# Requires:
#   VULTR_API_KEY   - your Vultr API key (same one used for your other projects)
#
# Optional overrides:
#   VULTR_REGION    - region code        (default: ewr  - New Jersey)
#   VULTR_PLAN      - plan id            (default: vc2-1c-2gb - 1 vCPU / 2 GB)
#   VULTR_LABEL     - instance label     (default: personal-assistant)
#   VULTR_SSH_KEY   - path to local public key to register/use
#                     (default: ~/.ssh/id_ed25519.pub or ~/.ssh/id_rsa.pub)
#
# The script is idempotent: if an instance with the label already exists it
# just prints its IP. Cloud-init installs Docker so deploy.sh can run
# immediately afterwards.
#
# Usage:
#   export VULTR_API_KEY=...
#   ./deploy/vultr/provision.sh

set -euo pipefail

API="https://api.vultr.com/v2"
REGION="${VULTR_REGION:-ewr}"
PLAN="${VULTR_PLAN:-vc2-1c-2gb}"
LABEL="${VULTR_LABEL:-personal-assistant}"

if [ -z "${VULTR_API_KEY:-}" ]; then
    echo "ERROR: VULTR_API_KEY is not set." >&2
    echo "Get it from https://my.vultr.com/settings/#settingsapi (same key as your other projects)." >&2
    exit 1
fi

vapi() {
    local method="$1" path="$2" data="${3:-}"
    if [ -n "$data" ]; then
        curl -fsS -X "$method" "$API$path" \
            -H "Authorization: Bearer $VULTR_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -fsS -X "$method" "$API$path" \
            -H "Authorization: Bearer $VULTR_API_KEY"
    fi
}

require_python() {
    command -v python3 >/dev/null || { echo "python3 is required for JSON parsing" >&2; exit 1; }
}
require_python

# ---------------------------------------------------------------------------
# 1. Reuse existing instance if present
# ---------------------------------------------------------------------------
EXISTING=$(vapi GET "/instances?label=$LABEL" | python3 -c '
import json,sys
data = json.load(sys.stdin)
for inst in data.get("instances", []):
    print(inst["id"], inst.get("main_ip", ""))
    break
')
if [ -n "$EXISTING" ]; then
    INSTANCE_ID=$(echo "$EXISTING" | awk '{print $1}')
    MAIN_IP=$(echo "$EXISTING" | awk '{print $2}')
    echo "Instance '$LABEL' already exists (id: $INSTANCE_ID, ip: $MAIN_IP). Nothing to do."
    echo ""
    echo "Deploy with:  SERVER_IP=$MAIN_IP ./deploy/vultr/deploy.sh"
    exit 0
fi

# ---------------------------------------------------------------------------
# 2. Ensure an SSH key is registered on the account
# ---------------------------------------------------------------------------
PUBKEY_FILE="${VULTR_SSH_KEY:-}"
if [ -z "$PUBKEY_FILE" ]; then
    for f in ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub; do
        [ -f "$f" ] && PUBKEY_FILE="$f" && break
    done
fi
if [ -z "$PUBKEY_FILE" ] || [ ! -f "$PUBKEY_FILE" ]; then
    echo "ERROR: no SSH public key found (looked for ~/.ssh/id_ed25519.pub, ~/.ssh/id_rsa.pub)." >&2
    echo "Generate one with: ssh-keygen -t ed25519" >&2
    exit 1
fi
PUBKEY_CONTENT=$(cat "$PUBKEY_FILE")

SSH_KEY_ID=$(vapi GET "/ssh-keys" | python3 -c "
import json,sys
keys = json.load(sys.stdin).get('ssh_keys', [])
local = '''$PUBKEY_CONTENT'''.split()
for k in keys:
    remote = k['ssh_key'].split()
    if len(local) >= 2 and len(remote) >= 2 and local[1] == remote[1]:
        print(k['id']); break
")
if [ -z "$SSH_KEY_ID" ]; then
    echo "Registering local SSH key on Vultr account..."
    SSH_KEY_ID=$(vapi POST "/ssh-keys" "{\"name\": \"$LABEL-deploy\", \"ssh_key\": \"$PUBKEY_CONTENT\"}" \
        | python3 -c 'import json,sys; print(json.load(sys.stdin)["ssh_key"]["id"])')
fi
echo "Using SSH key id: $SSH_KEY_ID"

# ---------------------------------------------------------------------------
# 3. Find Ubuntu 24.04 LTS x64 OS id
# ---------------------------------------------------------------------------
OS_ID=$(vapi GET "/os?per_page=500" | python3 -c '
import json,sys
oses = json.load(sys.stdin).get("os", [])
for o in oses:
    if "Ubuntu 24.04" in o["name"] and o["arch"] == "x64":
        print(o["id"]); break
else:
    for o in oses:
        if "Ubuntu 22.04" in o["name"] and o["arch"] == "x64":
            print(o["id"]); break
')
if [ -z "$OS_ID" ]; then
    echo "ERROR: could not find an Ubuntu LTS image via the Vultr API." >&2
    exit 1
fi
echo "Using OS id: $OS_ID (Ubuntu LTS x64)"

# ---------------------------------------------------------------------------
# 4. Create the instance (cloud-init installs Docker)
# ---------------------------------------------------------------------------
USER_DATA=$(base64 -w0 <<'CLOUDINIT'
#cloud-config
package_update: true
runcmd:
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable --now docker
  - mkdir -p /opt/personal-assistant
CLOUDINIT
)

echo "Creating instance '$LABEL' ($PLAN in $REGION)..."
CREATE_RESP=$(vapi POST "/instances" "{
    \"region\": \"$REGION\",
    \"plan\": \"$PLAN\",
    \"os_id\": $OS_ID,
    \"label\": \"$LABEL\",
    \"hostname\": \"$LABEL\",
    \"sshkey_id\": [\"$SSH_KEY_ID\"],
    \"user_data\": \"$USER_DATA\",
    \"backups\": \"disabled\",
    \"activation_email\": false
}")
INSTANCE_ID=$(echo "$CREATE_RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["instance"]["id"])')
echo "Instance created: $INSTANCE_ID. Waiting for it to become active..."

MAIN_IP=""
for _ in $(seq 1 60); do
    sleep 10
    INFO=$(vapi GET "/instances/$INSTANCE_ID")
    STATUS=$(echo "$INFO" | python3 -c 'import json,sys; i=json.load(sys.stdin)["instance"]; print(i["status"], i.get("main_ip","0.0.0.0"))')
    STATE=$(echo "$STATUS" | awk '{print $1}')
    MAIN_IP=$(echo "$STATUS" | awk '{print $2}')
    echo "  status=$STATE ip=$MAIN_IP"
    if [ "$STATE" = "active" ] && [ "$MAIN_IP" != "0.0.0.0" ]; then
        break
    fi
done

if [ "$MAIN_IP" = "0.0.0.0" ] || [ -z "$MAIN_IP" ]; then
    echo "ERROR: instance did not become active in time. Check the Vultr dashboard." >&2
    exit 1
fi

echo ""
echo "Instance ready: $MAIN_IP"
echo "Cloud-init needs a couple of minutes to finish installing Docker."
echo ""
echo "Next step:"
echo "  SERVER_IP=$MAIN_IP ./deploy/vultr/deploy.sh"
