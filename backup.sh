#!/bin/bash

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gst_platform_$TIMESTAMP.sql"

echo "🗄️  GST Platform Database Backup"
echo "================================"

# Load environment
source .env 2>/dev/null || true

DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-gst_platform}

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "📦 Creating backup: $BACKUP_FILE"
docker exec gst-postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress backup
echo "🗜️  Compressing backup..."
gzip $BACKUP_FILE

echo "✅ Backup complete: ${BACKUP_FILE}.gz"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
ls -t $BACKUP_DIR/gst_platform_*.sql.gz | tail -n +8 | xargs -r rm

echo "✅ Done!"
