#!/usr/bin/env bash
#
# Daily Postgres backup → DigitalOcean Spaces.
#
# Run from cron on the production Droplet (NOT inside the container):
#   0 3 * * * /opt/expansionlens/scripts/backup-postgres.sh >> /var/log/expansionlens-backup.log 2>&1
#
# Required env vars (set in /etc/expansionlens-backup.env or systemd unit):
#   POSTGRES_PASSWORD       — same value as in .env
#   DO_SPACES_KEY           — DigitalOcean Spaces access key
#   DO_SPACES_SECRET        — DigitalOcean Spaces secret key
#   DO_SPACES_BUCKET        — bucket name (e.g. expansionlens-backups)
#   DO_SPACES_REGION        — e.g. nyc3
#   DO_SPACES_ENDPOINT      — e.g. https://nyc3.digitaloceanspaces.com
#
# Dependencies on the Droplet:
#   - docker compose (for `docker compose exec`)
#   - awscli (`apt install awscli`)
#   - gzip
#
# What it does:
#   1. pg_dump from the running postgres container
#   2. gzip the dump
#   3. upload to s3://$DO_SPACES_BUCKET/postgres/YYYY-MM-DD.sql.gz
#   4. delete local backups older than 7 days
#   5. delete remote backups older than 30 days

set -euo pipefail

# Load env if present (when run from cron, $HOME and $PATH are minimal).
if [ -f /etc/expansionlens-backup.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /etc/expansionlens-backup.env
  set +a
fi

: "${POSTGRES_PASSWORD:?must be set}"
: "${DO_SPACES_KEY:?must be set}"
: "${DO_SPACES_SECRET:?must be set}"
: "${DO_SPACES_BUCKET:?must be set}"
: "${DO_SPACES_REGION:?must be set}"
: "${DO_SPACES_ENDPOINT:?must be set}"

PROJECT_DIR="${PROJECT_DIR:-/opt/expansionlens}"
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-/var/backups/expansionlens}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%S)"
DATE="$(date -u +%Y-%m-%d)"
BACKUP_FILE="${LOCAL_BACKUP_DIR}/expansionlens-${TIMESTAMP}.sql.gz"
REMOTE_KEY="postgres/${DATE}/expansionlens-${TIMESTAMP}.sql.gz"

mkdir -p "$LOCAL_BACKUP_DIR"

echo "[$(date -u +%FT%TZ)] Starting backup → $BACKUP_FILE"

cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" \
  postgres pg_dump -U expansionlens -d expansionlens --no-owner --no-acl \
  | gzip -9 > "$BACKUP_FILE"

# Sanity check — refuse to upload an empty/tiny dump.
SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
if [ "$SIZE" -lt 1024 ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: backup file is suspiciously small ($SIZE bytes). Aborting upload." >&2
  exit 1
fi
echo "[$(date -u +%FT%TZ)] Local dump complete: $SIZE bytes"

# Upload to DigitalOcean Spaces (S3-compatible).
AWS_ACCESS_KEY_ID="$DO_SPACES_KEY" \
AWS_SECRET_ACCESS_KEY="$DO_SPACES_SECRET" \
aws s3 cp "$BACKUP_FILE" "s3://${DO_SPACES_BUCKET}/${REMOTE_KEY}" \
  --endpoint-url "$DO_SPACES_ENDPOINT" \
  --region "$DO_SPACES_REGION" \
  --no-progress

echo "[$(date -u +%FT%TZ)] Uploaded → s3://${DO_SPACES_BUCKET}/${REMOTE_KEY}"

# Local cleanup: keep last 7 days.
find "$LOCAL_BACKUP_DIR" -name 'expansionlens-*.sql.gz' -mtime +7 -delete || true

# Remote cleanup: delete backups older than 30 days.
CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-30d +%Y-%m-%d)
AWS_ACCESS_KEY_ID="$DO_SPACES_KEY" \
AWS_SECRET_ACCESS_KEY="$DO_SPACES_SECRET" \
aws s3api list-objects-v2 \
  --bucket "$DO_SPACES_BUCKET" \
  --prefix "postgres/" \
  --endpoint-url "$DO_SPACES_ENDPOINT" \
  --region "$DO_SPACES_REGION" \
  --query "Contents[?LastModified<'${CUTOFF}'].Key" \
  --output text 2>/dev/null \
  | tr '\t' '\n' \
  | while read -r key; do
    if [ -n "$key" ] && [ "$key" != "None" ]; then
      AWS_ACCESS_KEY_ID="$DO_SPACES_KEY" \
      AWS_SECRET_ACCESS_KEY="$DO_SPACES_SECRET" \
      aws s3 rm "s3://${DO_SPACES_BUCKET}/${key}" \
        --endpoint-url "$DO_SPACES_ENDPOINT" \
        --region "$DO_SPACES_REGION" --no-progress
    fi
  done

echo "[$(date -u +%FT%TZ)] Backup complete"
