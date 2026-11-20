# Cloud Salon – Production Deployment & Operations Guide
**Platform Owner:** Cloud Technologies  
**Target Domain:** `https://salon.cloudtechnologiess.in`  
**Application Architecture:** Single Central Web App + Single FastAPI Backend + Single PostgreSQL 18 Database  
**Date:** November 16, 2026  
**Status:** Production Ready  

---

## 1. Architecture Overview

Cloud Salon operates as a centralized multi-tenant SaaS application:
- **One Unified Web Application:** All salons and platform administrators access `https://salon.cloudtechnologiess.in`.
- **One Central API Backend:** FastAPI serving `/api/v1` with multi-tenant row-level isolation.
- **One Central PostgreSQL Database:** Dedicated `salon` schema with foreign keys and tenant isolation.
- **Progressive Web App (PWA):** Installable on tablets (iPad, Galaxy Tab) and desktops for salon receptionists and stylists.

---

## 2. Server Prerequisites

- **OS:** Ubuntu 22.04 LTS / 24.04 LTS or Debian 12 (or Windows Server 2022)
- **CPU / RAM:** 4 vCPU, 8 GB RAM minimum
- **Database:** PostgreSQL 16+ (PostgreSQL 18 tested and verified)
- **Node.js:** v20+ LTS
- **Python:** v3.11+
- **Reverse Proxy:** Nginx with HTTP/2 and Let's Encrypt SSL

---

## 3. Environment Configuration

### Backend Environment (`backend/.env`)
```bash
# Application
APP_NAME="Cloud Salon"
APP_ENV=production
DEBUG=false
SECRET_KEY="<generate_secure_random_64_char_key>"
ACCESS_TOKEN_EXPIRE_MINUTES=720
REFRESH_TOKEN_EXPIRE_DAYS=30

# Company & Platform Governance
PLATFORM_COMPANY="Cloud Technologies"
PLATFORM_URL="https://salon.cloudtechnologiess.in"
SUPER_ADMIN_EMAIL="admin@cloudtechnologies.in"
SUPER_ADMIN_PASSWORD="<secure_admin_password>"

# PostgreSQL Database (Single Central Database)
DATABASE_URL="postgresql://cloudbilling:<secure_password>@localhost:5432/cloud_billing"
DB_SCHEMA=salon
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# CORS Allowed Origins
CORS_ORIGINS=["https://salon.cloudtechnologiess.in"]
```

### Frontend Environment (`frontend/.env.production`)
```bash
VITE_API_BASE_URL="https://salon.cloudtechnologiess.in/api/v1"
```

---

## 4. Production Build Steps

### Step 1: Database Initialization
```bash
# Connect to PostgreSQL and create database and schema
sudo -u postgres psql -c "CREATE USER cloudbilling WITH ENCRYPTED PASSWORD '<secure_password>';"
sudo -u postgres psql -c "CREATE DATABASE cloud_billing OWNER cloudbilling;"
sudo -u postgres psql -d cloud_billing -c "CREATE SCHEMA IF NOT EXISTS salon AUTHORIZATION cloudbilling;"

# Run migrations and seed baseline platform tiers
cd backend
python -m alembic upgrade head
python -c "from app.core.database import SessionLocal; from app.services.demo_seeder import seed_demo_tenant; db = SessionLocal(); seed_demo_tenant(db, 'sk-relax-satara'); db.close()"
```

### Step 2: Build Frontend Bundle
```bash
cd frontend
npm install --frozen-lockfile
npm run build
# Output generated in frontend/dist
```

---

## 5. Systemd Service Configurations

### Backend Service (`/etc/systemd/system/cloud-salon-backend.service`)
```ini
[Unit]
Description=Cloud Salon FastAPI Application Service
After=network.target postgresql.service

[Service]
Type=simple
User=cloudsalon
WorkingDirectory=/var/www/cloud-salon/backend
ExecStart=/var/www/cloud-salon/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 4
Restart=always
RestartSec=5
EnvironmentFile=/var/www/cloud-salon/backend/.env

[Install]
WantedBy=multi-user.target
```

---

## 6. Nginx Reverse Proxy Configuration

File: `/etc/nginx/sites-available/salon.cloudtechnologiess.in`

```nginx
server {
    listen 80;
    server_name salon.cloudtechnologiess.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name salon.cloudtechnologiess.in;

    ssl_certificate /etc/letsencrypt/live/salon.cloudtechnologiess.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/salon.cloudtechnologiess.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static Frontend SPA
    root /var/www/cloud-salon/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Reverse Proxy
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Health Check Proxy
    location /health {
        proxy_pass http://127.0.0.1:8001/health;
    }
}
```

---

## 7. Automated Database Backup Strategy

Automated scheduled backups are critical for client data retention:

### PowerShell Backup Script (`scripts/backup_postgres.ps1`)
Runs daily at 02:00 AM:
```powershell
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$backupDir = 'C:\CloudSalonBackups'
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force }
$backupFile = Join-Path $backupDir ("cloud_salon_" + $timestamp + ".dump")
& 'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe' -h localhost -U cloudbilling -d cloud_billing -n salon -Fc -f $backupFile
Write-Host "Backup completed: $backupFile"
```

### Linux Cron Script (`/etc/cron.daily/cloud-salon-backup`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cloud-salon"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
pg_dump -h localhost -U cloudbilling -d cloud_billing -n salon -Fc -f "$BACKUP_DIR/cloud_salon_$TIMESTAMP.dump"
# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete
```

---

## 8. Verification & Operational Health Check

After deployment, verify the production endpoints:
1. **Health Check:** `curl https://salon.cloudtechnologiess.in/health`
2. **Platform Admin Portal:** Open `https://salon.cloudtechnologiess.in/login` and log in with Super Admin credentials. Verify redirection to `/platform-admin/overview` and verify that no SK Relax branding is present.
3. **Salon Workspace:** Log in with `salma@skrelax.com` and verify redirection to `/app`. Confirm that the salon workspace header displays "SK Relax Studio" and that no Super Admin navigation is accessible.
