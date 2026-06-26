# Self-Hosted Deployment Guide

Complete guide for deploying GST Platform on your own infrastructure.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 20GB disk space minimum

## Quick Deploy

```bash
# 1. Clone repository
git clone <repository-url>
cd gst-platform

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Deploy
./deploy.sh
```

## Configuration

### Environment Variables (.env)

```bash
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=gst_platform

# Worker
POLL_INTERVAL=300000  # 5 minutes

# Domain (optional, for SSL)
DOMAIN=gst.yourdomain.com
```

### SSL/HTTPS Setup

1. Get SSL certificate (Let's Encrypt recommended):
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d gst.yourdomain.com
```

2. Copy certificates:
```bash
sudo cp /etc/letsencrypt/live/gst.yourdomain.com/fullchain.pem infrastructure/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/gst.yourdomain.com/privkey.pem infrastructure/nginx/ssl/key.pem
```

3. Edit `infrastructure/nginx/nginx.conf`:
   - Uncomment HTTPS server block
   - Update `server_name` with your domain
   - Uncomment HTTP to HTTPS redirect

4. Restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## Deployment Options

### Standard Deployment
```bash
./deploy.sh
```

### Manual Deployment
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f worker
```

## Backup & Restore

### Create Backup
```bash
./backup.sh
```

Backups are stored in `./backups/` directory. Automatically keeps last 7 backups.

### Restore from Backup
```bash
./restore.sh backups/gst_platform_20260625_120000.sql.gz
```

### Automated Backups with Cron

Add to crontab:
```bash
crontab -e
```

Add line:
```
0 2 * * * cd /path/to/gst-platform && ./backup.sh >> logs/backup.log 2>&1
```

## Monitoring

### Health Checks
```bash
# API health
curl http://localhost/health

# Service status
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage
```bash
docker stats
```

### Database Stats
```bash
docker exec -it gst-postgres psql -U postgres -d gst_platform -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname IN ('gst', 'source', 'registry')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Maintenance

### Update Platform
```bash
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Database Maintenance
```bash
# Vacuum
docker exec gst-postgres psql -U postgres -d gst_platform -c "VACUUM ANALYZE;"

# Reindex
docker exec gst-postgres psql -U postgres -d gst_platform -c "REINDEX DATABASE gst_platform;"
```

### Clear Old Logs
```bash
docker-compose -f docker-compose.prod.yml logs --tail=1000 > logs/archived_$(date +%Y%m%d).log
```

## Security Recommendations

1. **Change default passwords** in `.env`
2. **Enable firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **Setup SSL/HTTPS** (see above)
4. **Regular backups** (automated via cron)
5. **Keep Docker updated**:
   ```bash
   sudo apt update && sudo apt upgrade docker-ce docker-compose-plugin
   ```
6. **Monitor logs** for suspicious activity
7. **Limit database access** to internal network only

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache

# Check disk space
df -h
```

### Database connection errors
```bash
# Check database is running
docker exec gst-postgres pg_isready -U postgres

# Check credentials in .env match docker-compose.prod.yml
```

### API not responding
```bash
# Check API logs
docker logs gst-api

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

### Out of disk space
```bash
# Clean Docker
docker system prune -a --volumes

# Clean old logs
rm -rf logs/*.log

# Clean old backups
rm backups/gst_platform_*.sql.gz
```

## Scaling

### Horizontal Scaling (Multiple Workers)
```bash
docker-compose -f docker-compose.prod.yml up -d --scale worker=3
```

### Database Connection Pooling
Edit `packages/core/src/db.js`:
```javascript
max: 20  // Increase pool size
```

## Access Points

- **API**: http://your-server/api/v1
- **Admin Portal**: http://your-server/admin
- **Health Check**: http://your-server/health

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify configuration in `.env`
3. Check service health: `docker-compose -f docker-compose.prod.yml ps`
