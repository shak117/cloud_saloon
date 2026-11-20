# CLOUD SALON – Database Backup & Recovery Specification
## Cloud Technologies | PostgreSQL Schema `salon` Disaster Recovery Plan

### 1. Backup Strategy Overview
As a commercial SaaS application serving independent business clients, automated and verifiable database backups are mandatory.

* **Target Database**: `cloud_billing`
* **Schema**: `salon` (contains all 25 multi-tenant SaaS tables)
* **Backup Types**:
  - Full Logical Snapshot (`pg_dump -Fc` custom format with internal zlib compression).
  - Nightly Automated Crons.
  - Pre-deployment point-in-time snapshots.
* **Retention Policy**:
  - Daily backups: Retained for 30 days.
  - Weekly backups: Retained for 12 weeks.
  - Monthly archives: Retained for 1 year.

---

### 2. Manual Backup Command (Windows PowerShell & Linux)

#### Windows PowerShell:
```powershell
# Set timestamp and backup target
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = "C:\CloudSalonBackups\cloud_salon_$timestamp.dump"

# Run PostgreSQL pg_dump for schema 'salon'
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
  -h localhost `
  -U cloudbilling `
  -d cloud_billing `
  -n salon `
  -Fc `
  -f $backupFile

Write-Host "Backup completed successfully: $backupFile"
```

#### Linux Bash:
```bash
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_DIR="/var/backups/cloud_salon"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U cloudbilling -d cloud_billing -n salon -Fc -f "$BACKUP_DIR/cloud_salon_$TIMESTAMP.dump"
```

---

### 3. Automated Daily Backup Script with Pruning

Create `/opt/cloud_salon/scripts/backup_postgres.sh`:
```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/cloud_salon"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/cloud_salon_$TIMESTAMP.dump"
LOG_FILE="/var/log/cloud_salon_backup.log"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting automated Cloud Salon database backup..." >> $LOG_FILE

# Execute pg_dump
PGPASSWORD="<DB_PASSWORD>" pg_dump -h localhost -U cloudbilling -d cloud_billing -n salon -Fc -f "$BACKUP_FILE"

# Verify file size
FILESIZE=$(stat -c%s "$BACKUP_FILE")
if [ $FILESIZE -gt 10000 ]; then
    echo "[$(date)] SUCCESS: Backup created: $BACKUP_FILE ($FILESIZE bytes)" >> $LOG_FILE
else
    echo "[$(date)] ERROR: Backup file suspiciously small ($FILESIZE bytes)!" >> $LOG_FILE
    exit 1
fi

# Prune backups older than 30 days
find $BACKUP_DIR -name "cloud_salon_*.dump" -mtime +30 -delete
echo "[$(date)] Backup pruning completed." >> $LOG_FILE
```

Add to crontab (`crontab -e`):
```cron
0 2 * * * /opt/cloud_salon/scripts/backup_postgres.sh >/dev/null 2>&1
```

---

### 4. Database Restore Procedure (Disaster Recovery)

To restore from a backup snapshot:

```bash
# 1. Stop FastAPI Backend to prevent concurrent writes
sudo systemctl stop cloud-salon-backend

# 2. Terminate active database connections
psql -h localhost -U cloudbilling -d cloud_billing -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'cloud_billing' AND pid <> pg_backend_pid();
"

# 3. Restore schema 'salon' using pg_restore with clean drop
pg_restore -h localhost -U cloudbilling -d cloud_billing --clean --if-exists -n salon "/var/backups/cloud_salon/cloud_salon_YYYY-MM-DD_HHMMSS.dump"

# 4. Restart FastAPI Backend
sudo systemctl start cloud-salon-backend

# 5. Verify API Health and Tenant Integrity
curl https://salon.cloudtechnologiess.in/api/v1/super-admin/metrics
```
