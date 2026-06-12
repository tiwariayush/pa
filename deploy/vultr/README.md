# Deploying to Vultr

This app runs on a single Vultr VPS with Docker Compose (PostgreSQL, Redis,
FastAPI backend, Nginx), the same pattern as the rest of your personal
projects. Everything is driven by your existing `VULTR_API_KEY`.

## One-time setup

```bash
export VULTR_API_KEY=...        # same key as your other projects

# 1. Create the server (idempotent - reuses an existing one by label)
./deploy/vultr/provision.sh

# 2. Deploy the stack (prints the IP at the end of step 1)
SERVER_IP=<ip> ./deploy/vultr/deploy.sh
```

The first deploy stops and asks you to set `OPENAI_API_KEY` in
`/opt/personal-assistant/.env` on the server (JWT secret and database
password are generated automatically). Edit it, then re-run `deploy.sh`.

```bash
ssh root@<ip> 'nano /opt/personal-assistant/.env'
SERVER_IP=<ip> ./deploy/vultr/deploy.sh
```

After that:

- App / test UI: `http://<ip>/`
- Health check: `http://<ip>/health`

## Defaults

| Setting  | Value             | Override with  |
|----------|-------------------|----------------|
| Region   | `ewr` (New Jersey)| `VULTR_REGION` |
| Plan     | `vc2-1c-2gb`      | `VULTR_PLAN`   |
| Label    | `personal-assistant` | `VULTR_LABEL` |
| OS       | Ubuntu 24.04 LTS  | (auto-detected)|

If your other projects live in a different region, set `VULTR_REGION` to
match so everything is in one place.

## Continuous deployment

`.github/workflows/deploy-vultr.yml` redeploys on every push to `main`.
Add two repository secrets on GitHub (Settings > Secrets and variables >
Actions):

- `VULTR_HOST` - the server IP
- `VULTR_SSH_PRIVATE_KEY` - private key matching the public key registered
  during provisioning

## Optional: Google Calendar service account

Copy the JSON to the server and point the env var at it:

```bash
scp your-service-account.json root@<ip>:/opt/personal-assistant/secrets/google-service-account.json
ssh root@<ip> "sed -i 's|GOOGLE_SERVICE_ACCOUNT_FILE=.*|GOOGLE_SERVICE_ACCOUNT_FILE=/app/secrets/google-service-account.json|' /opt/personal-assistant/.env"
SERVER_IP=<ip> ./deploy/vultr/deploy.sh
```

## Operations

```bash
ssh root@<ip>
cd /opt/personal-assistant
docker compose -f docker-compose.prod.yml logs -f       # logs
docker compose -f docker-compose.prod.yml restart       # restart
docker compose -f docker-compose.prod.yml down          # stop
docker exec pa-database pg_dump -U postgres personal_assistant > backup.sql   # db backup
```
