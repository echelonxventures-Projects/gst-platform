# GST Platform

The definitive GST intelligence platform for India with registry-driven architecture.

## 🏠 Self-Hosted Deployment

Complete self-hosted solution with Docker, Nginx reverse proxy, SSL support, and automated backups.

## Features

### Core Platform
- **HSN Master** - Complete HSN code database with rates and descriptions
- **Full-Text Search** - PostgreSQL-powered search with fuzzy matching
- **Change Detection** - Automatic source monitoring and update detection
- **Event-Driven** - Complete audit trail of all changes
- **Registry-Driven** - Zero hardcoded sources, fully configurable
- **Multi-Module** - Independently deployable modules
- **Self-Hosted** - Run on your own infrastructure

### Commercial API
- **API Key Authentication** - Secure SHA256-hashed keys
- **Rate Limiting** - Hourly, daily, monthly limits with burst support
- **Usage Tracking** - Real-time monitoring and analytics
- **4 Pricing Tiers** - Free, Starter (₹999), Professional (₹4,999), Enterprise (₹19,999)
- **Custom Configuration** - Per-key limits, pricing, and features
- **Billing System** - Automated invoicing and subscription management

### Promotional System
- **Promo Codes** - 6 types: percentage, fixed, credits, trials, features, upgrades
- **Offers** - 8 types: signup, upgrade, seasonal, flash, loyalty, winback, bundle, referral
- **Customer Credits** - Balance tracking with expiration
- **Referral Program** - Dual rewards for referrer and referred
- **Auto-Apply** - Smart offer application based on conditions

## 🚀 Quick Deploy

```bash
# Clone repository
git clone <repository-url>
cd gst-platform

# Configure
cp .env.example .env
nano .env  # Set DB_PASSWORD and other settings

# Deploy
./deploy.sh
```

**Access Points:**
- API: http://your-server/api/v1
- Admin: http://your-server/admin
- Health: http://your-server/health

## 📋 Requirements

- Linux server (Ubuntu 20.04+)
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM (4GB recommended)
- 20GB disk space

## Architecture

```
                    ┌──────────────┐
                    │    Nginx     │  Port 80/443
                    │ Reverse Proxy│
                    └──────┬───────┘
                           │
        ┏━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┓
        ┃                                      ┃
   ┌────▼─────┐                         ┌─────▼────┐
   │   API    │                         │  Admin   │
   │ Port 3000│                         │ Port 3001│
   └────┬─────┘                         └─────┬────┘
        │                                     │
        │         ┌──────────┐                │
        └─────────┤  Worker  ├────────────────┘
                  └────┬─────┘
                       │
                ┌──────▼───────┐
                │  PostgreSQL  │
                │  Port 5432   │
                └──────────────┘
```

## 📖 Documentation

- **[Quick Start](#-quick-deploy)** - Deploy in 5 minutes
- **[E-commerce Integration](ECOMMERCE_INTEGRATION.md)** - Integrate with your store in 3 steps
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with SSL, backups, monitoring
- **[API_BUSINESS.md](API_BUSINESS.md)** - Commercial API pricing and features
- **[BILLING_CONFIG.md](BILLING_CONFIG.md)** - Custom billing configuration
- **[PROMO_OFFERS.md](PROMO_OFFERS.md)** - Promotional campaigns guide
- **[TEST_RESULTS.md](TEST_RESULTS.md)** - Validation test results

## 🔒 Security Features

- Isolated Docker network
- Environment-based secrets
- Nginx reverse proxy
- SSL/HTTPS support
- Database backup/restore
- Configurable access controls

## 💾 Backup & Restore

### Automated Backups
```bash
# Manual backup
./backup.sh

# Automated (cron)
crontab -e
# Add: 0 2 * * * cd /path/to/gst-platform && ./backup.sh
```

### Restore
```bash
./restore.sh backups/gst_platform_20260625_120000.sql.gz
```

## 🛠️ Management

### Deploy/Update
```bash
./deploy.sh
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f api
```

### Service Control
```bash
# Stop
docker-compose -f docker-compose.prod.yml down

# Restart
docker-compose -f docker-compose.prod.yml restart

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=3
```

## 🌐 SSL/HTTPS Setup

```bash
# Get Let's Encrypt certificate
sudo certbot certonly --standalone -d gst.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/gst.yourdomain.com/fullchain.pem infrastructure/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/gst.yourdomain.com/privkey.pem infrastructure/nginx/ssl/key.pem

# Update nginx.conf (uncomment HTTPS block)
nano infrastructure/nginx/nginx.conf

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## API Endpoints

### Public Endpoints (No Auth Required)
```bash
# Health check
GET /health
```

### Protected Endpoints (Require X-API-Key)

#### Search
```bash
GET /api/v1/search?q=mobile
GET /api/v1/suggest?q=85
```

#### HSN
```bash
GET /api/v1/hsn/8517
GET /api/v1/hsn/8517/history
GET /api/v1/hsn?limit=100&offset=0
GET /api/v1/hsn?rate=18
```

#### Notifications
```bash
GET /api/v1/notifications
GET /api/v1/notifications/1/2017
```

#### States
```bash
GET /api/v1/states
GET /api/v1/states/MH/rules
```

### Admin Endpoints (Port 3001)

#### Customer Management
```bash
POST   /api/customers
GET    /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
```

#### API Keys
```bash
POST   /api/customers/:id/api-keys
GET    /api/customers/:id/api-keys
DELETE /api/api-keys/:id
```

#### Promo Codes
```bash
POST   /api/promo-codes
GET    /api/promo-codes
POST   /api/promo-codes/:code/validate
POST   /api/promo-codes/:code/redeem
```

#### Credits
```bash
GET    /api/customers/:id/credits
POST   /api/customers/:id/credits
```

## Project Structure

```
gst-platform/
├── apps/
│   ├── api/              # REST API server
│   ├── worker/           # Background job processor
│   └── admin/            # Admin portal
├── packages/
│   ├── core/             # Database, events, validators
│   ├── registry-engine/  # Module/source registry
│   ├── source-engine/    # Source fetching
│   ├── parser-engine/    # PDF/CSV parsing
│   ├── change-engine/    # Change detection
│   ├── event-engine/     # Event store
│   ├── workflow-engine/  # Orchestration
│   ├── gst-module/       # HSN/notification services
│   └── search-engine/    # Full-text search
├── database/             # Schema and migrations
├── infrastructure/
│   ├── docker/           # Dockerfiles
│   └── nginx/            # Nginx configuration
├── deploy.sh             # Deployment script
├── backup.sh             # Backup script
├── restore.sh            # Restore script
└── docker-compose.prod.yml  # Production compose

```

## Configuration

Environment variables in `.env`:

```bash
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=gst_platform

# Worker
POLL_INTERVAL=300000  # 5 minutes

# Domain (for SSL)
DOMAIN=gst.yourdomain.com
```

## Monitoring

```bash
# Health check
curl http://localhost/health

# Service status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Database size
docker exec gst-postgres psql -U postgres -d gst_platform -c "
SELECT pg_size_pretty(pg_database_size('gst_platform'));"
```

## Troubleshooting

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Service startup issues
- Database connection errors
- SSL configuration
- Performance tuning
- Log analysis

## Development

Local development without Docker:

```bash
# Start PostgreSQL
docker run -d --name gst-postgres \
  -e POSTGRES_DB=gst_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:17

# Initialize database
npm run db:init

# Install dependencies
npm install

# Run services
npm run dev:api     # Terminal 1
npm run dev:worker  # Terminal 2
npm run dev:admin   # Terminal 3
```

## License

MIT
