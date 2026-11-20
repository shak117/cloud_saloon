# CLOUD SALON – Production Deployment Guide
## Cloud Technologies | Production Deployment at `https://salon.cloudtechnologiess.in`

### 1. Architecture Overview
Cloud Salon is architected to run on a production Linux server (Ubuntu 22.04 / 24.04 LTS or Debian 12) using Docker Compose or native Systemd services:

* **Production URL**: `https://salon.cloudtechnologiess.in`
* **Web Frontend**: NGINX serving static React 19 production build (`dist/`)
* **API Backend**: FastAPI running via Uvicorn/Gunicorn workers (Port 8001)
* **Database**: PostgreSQL 18 with schema `salon` (Port 5432)
* **SSL Certificate**: Let's Encrypt automated TLS via Certbot

---

### 2. Environment Configuration

Create `/opt/cloud_salon/backend/.env`:
```ini
# Production Environment Configuration
PROJECT_NAME="Cloud Salon API"
COMPANY_NAME="Cloud Technologies"
VERSION="2.5.0-SaaS"
ENVIRONMENT="production"

# PostgreSQL 18 Connection String
DATABASE_URL="postgresql+psycopg://cloudbilling:<SECURE_PASSWORD>@localhost:5432/cloud_billing"
DB_SCHEMA="salon"

# JWT Security Secrets (Generate using: openssl rand -hex 32)
JWT_SECRET_KEY="<GENERATE_SECURE_RANDOM_SECRET_KEY>"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=720
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS Allowed Origins
CORS_ORIGINS="https://salon.cloudtechnologiess.in"

# Pilot Tenant ID
PILOT_TENANT_ID="sk-relax-satara"
```

---

### 3. NGINX Reverse Proxy & SSL Configuration

Create `/etc/nginx/sites-available/salon.cloudtechnologiess.in`:
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

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Frontend Single Page Application (React / PWA)
    root /opt/cloud_salon/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # PWA Web Manifest & Service Worker (No-cache for updates)
    location ~* (sw\.js|manifest\.webmanifest)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # API Backend Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

---

### 4. Systemd Service for FastAPI Backend

Create `/etc/systemd/system/cloud-salon-backend.service`:
```ini
[Unit]
Description=Cloud Salon Multi-Tenant FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cloud_salon/backend
ExecStart=/opt/cloud_salon/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001 --access-logfile /var/log/cloud_salon_access.log --error-logfile /var/log/cloud_salon_error.log
Restart=always
RestartSec=5
EnvironmentFile=/opt/cloud_salon/backend/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloud-salon-backend
sudo systemctl start cloud-salon-backend
```

---

### 5. Automated Build & Deployment Steps

```bash
# 1. Pull latest code from Cloud Technologies repository
cd /opt/cloud_salon
git pull origin main

# 2. Run Database Migrations
cd /opt/cloud_salon/backend
source venv/bin/activate
python -m app.core.migrate_multitenancy

# 3. Build React PWA Frontend
cd /opt/cloud_salon/frontend
npm ci
npm run build

# 4. Restart Backend Service & Reload NGINX
sudo systemctl restart cloud-salon-backend
sudo systemctl reload nginx

# 5. Verify Health Endpoint
curl https://salon.cloudtechnologiess.in/api/v1/super-admin/metrics
```
