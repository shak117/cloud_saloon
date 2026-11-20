param (
    [string]$BackupDir = "C:\CloudSalonBackups",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BackupFile = Join-Path $BackupDir "cloud_salon_$Timestamp.dump"

$PgDumpCandidates = @(
    "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
)

$PgDumpPath = "pg_dump"
foreach ($candidate in $PgDumpCandidates) {
    if (Test-Path $candidate) {
        $PgDumpPath = $candidate
        break
    }
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (-not $env:PGPASSWORD) {
    if ($env:POSTGRES_PASSWORD) {
        $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    } else {
        Write-Warning "PGPASSWORD environment variable not set. pg_dump may prompt for password."
    }
}

Write-Host "[$Timestamp] Starting Cloud Salon PostgreSQL Backup (Schema: salon)..." -ForegroundColor Cyan
Write-Host "Target file: $BackupFile"

try {
    & $PgDumpPath -h localhost -p 5432 -U cloudbilling -d cloud_billing -n salon -F c -b -v -f $BackupFile

    if ($LASTEXITCODE -eq 0 -or (Test-Path $BackupFile)) {
        $Size = (Get-Item $BackupFile).Length / 1KB
        Write-Host "[SUCCESS] Backup created successfully: $BackupFile ($([math]::Round($Size, 2)) KB)" -ForegroundColor Green

        # Prune older than retention policy
        Get-ChildItem -Path $BackupDir -Filter "cloud_salon_*.dump" |
            Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) } |
            ForEach-Object {
                Remove-Item $_.FullName -Force
                Write-Host "[PRUNED] Removed old backup: $($_.Name)" -ForegroundColor Yellow
            }
    } else {
        Write-Error "[FAILED] pg_dump encountered an error. Exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error "[ERROR] Backup failed: $_"
}
