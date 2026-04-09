#!/usr/bin/env bash
#
# Restore Postgres from a DigitalOcean Spaces backup.
#
# DESTRUCTIVE: drops and recreates the expansionlens database. Requires
# explicit confirmation.
#
# Usage:
#   ./restore-postgres.sh <backup_key>
#
#   backup_key is the S3 key of the backup to restore, e.g.:
#     postgres/2026-04-07/expansionlens-2026-04-07T03-00-00.sql.gz
#
#   To list available backups:
#     ./restore-postgres.sh --list
#
# Env vars: same as backup-postgres.sh

set -euo pipefail

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

aws_cmd() {
  AWS_ACCESS_KEY_ID="$DO_SPACES_KEY" \
  AWS_SECRET_ACCESS_KEY="$DO_SPACES_SECRET" \
  aws "$@" --endpoint-url "$DO_SPACES_ENDPOINT" --region "$DO_SPACES_REGION"
}

# List mode.
if [ "${1:-}" = "--list" ]; then
  echo "Available backups in s3://${DO_SPACES_BUCKET}/postgres/:"
  aws_cmd s3 ls "s3://${DO_SPACES_BUCKET}/postgres/" --recursive \
    | awk '{print $1" "$2"  "$4}'
  exit 0
fi

BACKUP_KEY="${1:-}"
if [ -z "$BACKUP_KEY" ]; then
  echo "Usage: $0 <backup_key>" >&2
  echo "       $0 --list" >&2
  exit 1
fi

echo ""
echo "⚠  DESTRUCTIVE RESTORE"
echo "  Source:      s3://${DO_SPACES_BUCKET}/${BACKUP_KEY}"
echo "  Destination: docker compose postgres (database: expansionlens)"
echo ""
echo "  This will DROP the existing expansionlens database and recreate it from the backup."
echo "  All current data will be lost."
echo ""
read -r -p "Type RESTORE to continue: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

cd "$PROJECT_DIR"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
LOCAL_FILE="$TMP/restore.sql.gz"

echo "[$(date -u +%FT%TZ)] Downloading backup..."
aws_cmd s3 cp "s3://${DO_SPACES_BUCKET}/${BACKUP_KEY}" "$LOCAL_FILE" --no-progress

echo "[$(date -u +%FT%TZ)] Dropping existing database..."
docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" \
  postgres psql -U expansionlens -d postgres -c 'DROP DATABASE IF EXISTS expansionlens;'

echo "[$(date -u +%FT%TZ)] Recreating database..."
docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" \
  postgres psql -U expansionlens -d postgres -c 'CREATE DATABASE expansionlens;'

echo "[$(date -u +%FT%TZ)] Restoring data..."
gunzip -c "$LOCAL_FILE" | docker compose -f docker-compose.prod.yml exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" postgres psql -U expansionlens -d expansionlens

echo "[$(date -u +%FT%TZ)] Restore complete. Restart the web service to pick up the new state:"
echo "  docker compose -f docker-compose.prod.yml restart web"
