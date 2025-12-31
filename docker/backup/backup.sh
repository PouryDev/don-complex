#!/bin/sh

# Database backup script
# This script creates a backup of the MariaDB database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/donclub_backup_${TIMESTAMP}.sql"

echo "Starting database backup at $(date)"

# Create backup
mysqldump \
    -h "${DB_HOST}" \
    -u "${DB_USERNAME}" \
    -p"${DB_PASSWORD}" \
    "${DB_DATABASE}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    # Compress backup
    gzip "${BACKUP_FILE}"
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 days of backups
    find /backups -name "donclub_backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up"
else
    echo "Backup failed!"
    exit 1
fi

