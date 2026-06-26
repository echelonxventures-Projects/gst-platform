#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 GST Platform Database Restore"
echo "================================"
echo "⚠️  This will replace the current database!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Load environment
source .env 2>/dev/null || true

DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-gst_platform}

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Decompressing backup..."
    TEMP_FILE="/tmp/gst_restore_$$.sql"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
else
    TEMP_FILE=$BACKUP_FILE
fi

# Restore
echo "🔄 Restoring database..."
cat $TEMP_FILE | docker exec -i gst-postgres psql -U $DB_USER $DB_NAME

# Cleanup
if [[ $BACKUP_FILE == *.gz ]]; then
    rm $TEMP_FILE
fi

echo "✅ Restore complete!"
