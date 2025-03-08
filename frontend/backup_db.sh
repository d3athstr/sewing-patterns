#!/bin/bash

# Define variables
BACKUP_DIR="/opt/sewing-patterns/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/sewing_patterns_$TIMESTAMP.sql"

# Run PostgreSQL dump
docker exec sewing_patterns_db pg_dump -U user -d sewing_patterns > "$BACKUP_FILE"

# Keep only the last 7 backups
ls -1tr $BACKUP_DIR/sewing_patterns_*.sql | head -n -7 | xargs rm -f

echo "Backup completed: $BACKUP_FILE"
