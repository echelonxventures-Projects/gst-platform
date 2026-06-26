# Manual Testing Guide

## Quick Test (Validates Code Structure)

```bash
node test-simple.js
```

**Expected:** ✅ All 17 tests pass

---

## Docker Test (Full Integration)

### Step 1: Build & Start
```bash
# Clean slate
docker-compose down -v

# Build images
docker-compose build

# Start services
docker-compose up -d
```

### Step 2: Check Status
```bash
# Wait 30 seconds for startup
sleep 30

# Check containers
docker-compose ps

# Check logs if needed
docker-compose logs api
docker-compose logs admin
docker-compose logs db
```

### Step 3: Test Endpoints

**API Health:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

**Admin Health:**
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

### Step 4: Test Billing Features

**Create Customer:**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","company":"Test Corp"}'
```

**Create API Key:**
```bash
# Use customer ID from above
curl -X POST http://localhost:3001/api/customers/{CUSTOMER_ID}/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key","plan_code":"professional"}'
```

**Test API with Key:**
```bash
# Use API key from above
curl http://localhost:3000/api/v1/hsn/search?q=coffee \
  -H "X-API-Key: gst_xxxx..."
```

### Step 5: Test Promo Codes

**Create Promo:**
```bash
curl -X POST http://localhost:3001/api/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code":"TEST50",
    "name":"Test Promo",
    "type":"percentage",
    "value":50,
    "max_uses":100,
    "config":{"duration_months":3}
  }'
```

**Validate Promo:**
```bash
curl -X POST http://localhost:3001/api/promo-codes/TEST50/validate \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"{CUSTOMER_ID}","plan_code":"professional"}'
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose logs api --tail 50
docker-compose logs admin --tail 50
```

**Common fixes:**
```bash
# Rebuild from scratch
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

**Check database:**
```bash
docker-compose exec db psql -U postgres -d gst_platform -c "\dt billing.*"
```

**Reinitialize:**
```bash
docker-compose down -v
docker-compose up -d db
sleep 10
docker-compose up -d api admin
```

### Module Not Found Errors

**Ensure workspaces are set up:**
```bash
# Check package.json has workspaces
grep -A 3 "workspaces" package.json

# Rebuild
docker-compose build --no-cache
```

---

## Expected Results

### Static Validation
```
✅ 17/17 tests passed
- Core package exists
- Billing engine exists
- All packages present
- Database migrations exist
- Promo codes complete
- API endpoints configured
```

### Docker Services
```
✅ Database running (port 5432)
✅ API running (port 3000)
✅ Admin running (port 3001)
✅ Worker running (background)
```

### API Tests
```
✅ Health check responds
✅ Customer creation works
✅ API key generation works
✅ Authentication works
✅ Promo validation works
```

---

## Access Points

- **API**: http://localhost:3000
- **Admin**: http://localhost:3001
- **Database**: localhost:5432

---

## Clean Up

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```
