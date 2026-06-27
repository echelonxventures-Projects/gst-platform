# Service Specifications

Complete API and service documentation with formats, payloads, inputs, and outputs.

---

## Public API (`/api/v1`)

### Authentication
**Header**: `X-API-Key: <api_key>`
**Rate Limits**: Configured per customer plan (hourly/daily/monthly/burst limits)

---

### 1. Search

**Endpoint**: `GET /api/v1/search`

**Input**:
```
Query Parameters:
  q: string (required) - Search query term
  type: string (optional) - 'hsn' or 'notification'
  limit: integer (optional) - Max results (default: 50)
```

**Output**:
```json
{
  "results": [
    {
      "hsn": "string",
      "description": "string",
      "gst_rate": number,
      "rank": number
    }
  ],
  "count": integer
}
```

**Status Codes**:
- 200: Success
- 400: Missing query parameter
- 401: Invalid API key
- 429: Rate limit exceeded

---

### 2. HSN Lookup

**Endpoint**: `GET /api/v1/hsn/:code`

**Input**:
```
Path Parameters:
  code: string (required) - HSN/SAC code (6-8 digits)
```

**Output**:
```json
{
  "hsn": "string",
  "description": "string",
  "gst_rate": number,
  "cgst": number,
  "sgst": number,
  "igst": number,
  "cess": number,
  "effective_from": "ISO8601 date",
  "last_updated": "ISO8601 datetime"
}
```

**Status Codes**:
- 200: HSN found
- 404: HSN not found
- 401: Invalid API key

---

### 3. HSN Rate History

**Endpoint**: `GET /api/v1/hsn/:code/history`

**Input**:
```
Path Parameters:
  code: string (required)
Query Parameters:
  from: ISO8601 date (optional)
  to: ISO8601 date (optional)
```

**Output**:
```json
{
  "hsn": "string",
  "history": [
    {
      "gst_rate": number,
      "effective_from": "ISO8601 date",
      "effective_to": "ISO8601 date",
      "change_reason": "string"
    }
  ]
}
```

---

### 4. HSN Suggestions

**Endpoint**: `GET /api/v1/hsn/suggest`

**Input**:
```
Query Parameters:
  q: string (required) - Partial HSN or description
  limit: integer (optional) - Default: 10
```

**Output**:
```json
{
  "suggestions": [
    {
      "hsn": "string",
      "description": "string",
      "gst_rate": number
    }
  ]
}
```

---

### 5. Notifications Search

**Endpoint**: `GET /api/v1/notifications`

**Input**:
```
Query Parameters:
  q: string (optional) - Search term
  from: ISO8601 date (optional)
  to: ISO8601 date (optional)
  type: string (optional) - Notification type
  limit: integer (optional) - Default: 50
  offset: integer (optional) - Default: 0
```

**Output**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "type": "string",
      "published_date": "ISO8601 date",
      "source_url": "string"
    }
  ],
  "total": integer,
  "limit": integer,
  "offset": integer
}
```

---

### 6. State GST Rules

**Endpoint**: `GET /api/v1/states/:stateCode/rules`

**Input**:
```
Path Parameters:
  stateCode: string (required) - 2-letter state code (e.g., 'MH', 'DL')
```

**Output**:
```json
{
  "state_code": "string",
  "state_name": "string",
  "rules": [
    {
      "rule_id": "uuid",
      "category": "string",
      "description": "string",
      "effective_from": "ISO8601 date",
      "status": "active|deprecated"
    }
  ]
}
```

---

### 7. Intelligence Query

**Endpoint**: `POST /api/v1/intelligence`

**Input**:
```json
{
  "query": "string (required) - Natural language question",
  "context": {
    "hsn": "string (optional)",
    "state": "string (optional)"
  }
}
```

**Output**:
```json
{
  "answer": "string",
  "confidence": number,
  "references": [
    {
      "type": "hsn|notification|rule",
      "id": "string",
      "title": "string",
      "url": "string"
    }
  ],
  "generated_at": "ISO8601 datetime"
}
```

---

### 8. Events Webhook

**Endpoint**: `POST /api/v1/events`

**Input**:
```json
{
  "event_type": "string (required) - hsn_update|notification|source_change",
  "webhook_url": "string (required) - Customer webhook endpoint",
  "filters": {
    "hsn_codes": ["string"],
    "notification_types": ["string"]
  }
}
```

**Output**:
```json
{
  "subscription_id": "uuid",
  "status": "active",
  "created_at": "ISO8601 datetime"
}
```

---

## Admin API (`/admin/api`)

### Authentication
**Session-Based**: Cookie authentication required
**Login Required**: All endpoints require authenticated session

---

### Customer Management

#### 1. List Customers

**Endpoint**: `GET /admin/api/customers`

**Input**:
```
Query Parameters:
  status: string (optional) - 'active'|'suspended'|'inactive'
  plan: string (optional) - Filter by plan_id
  limit: integer (optional) - Default: 50
  offset: integer (optional) - Default: 0
```

**Output**:
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "status": "active|suspended|inactive",
      "plan_id": "uuid",
      "plan_name": "string",
      "created_at": "ISO8601 datetime",
      "current_usage": {
        "requests_today": integer,
        "requests_this_month": integer
      }
    }
  ],
  "total": integer
}
```

---

#### 2. Create Customer

**Endpoint**: `POST /admin/api/customers`

**Input**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "plan_id": "uuid (required)",
  "metadata": {
    "company": "string",
    "industry": "string"
  }
}
```

**Output**:
```json
{
  "customer_id": "uuid",
  "api_key": "string",
  "status": "active",
  "created_at": "ISO8601 datetime"
}
```

**Status Codes**:
- 201: Customer created
- 400: Validation error
- 409: Email already exists

---

#### 3. Update Customer

**Endpoint**: `PUT /admin/api/customers/:id`

**Input**:
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "status": "active|suspended|inactive (optional)",
  "plan_id": "uuid (optional)",
  "metadata": {}
}
```

**Output**:
```json
{
  "customer_id": "uuid",
  "updated": true,
  "changes": ["field1", "field2"]
}
```

---

#### 4. Suspend Customer

**Endpoint**: `POST /admin/api/customers/:id/suspend`

**Input**:
```json
{
  "reason": "string (required)",
  "notify": boolean (optional) - Default: true
}
```

**Output**:
```json
{
  "customer_id": "uuid",
  "status": "suspended",
  "suspended_at": "ISO8601 datetime"
}
```

---

### API Key Management

#### 5. Generate API Key

**Endpoint**: `POST /admin/api/keys`

**Input**:
```json
{
  "customer_id": "uuid (required)",
  "name": "string (optional) - Key identifier",
  "expires_at": "ISO8601 datetime (optional)"
}
```

**Output**:
```json
{
  "api_key": "string",
  "customer_id": "uuid",
  "created_at": "ISO8601 datetime",
  "expires_at": "ISO8601 datetime|null"
}
```

---

#### 6. List API Keys

**Endpoint**: `GET /admin/api/customers/:id/keys`

**Output**:
```json
{
  "keys": [
    {
      "key_prefix": "string - First 8 chars",
      "name": "string",
      "created_at": "ISO8601 datetime",
      "last_used": "ISO8601 datetime",
      "expires_at": "ISO8601 datetime|null",
      "status": "active|expired|revoked"
    }
  ]
}
```

---

#### 7. Revoke API Key

**Endpoint**: `DELETE /admin/api/keys/:keyPrefix`

**Output**:
```json
{
  "revoked": true,
  "key_prefix": "string"
}
```

---

### Billing Plans

#### 8. List Plans

**Endpoint**: `GET /admin/api/plans`

**Output**:
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "string",
      "tier": "free|starter|professional|enterprise",
      "price_monthly": number,
      "limits": {
        "requests_per_hour": integer,
        "requests_per_day": integer,
        "requests_per_month": integer,
        "burst_limit": integer
      },
      "features": ["string"],
      "is_active": boolean
    }
  ]
}
```

---

#### 9. Create Plan

**Endpoint**: `POST /admin/api/plans`

**Input**:
```json
{
  "name": "string (required)",
  "tier": "string (required)",
  "price_monthly": number (required),
  "limits": {
    "requests_per_hour": integer,
    "requests_per_day": integer,
    "requests_per_month": integer,
    "burst_limit": integer
  },
  "features": ["string"]
}
```

**Output**:
```json
{
  "plan_id": "uuid",
  "created": true
}
```

---

### Promo Codes & Offers

#### 10. Create Promo Code

**Endpoint**: `POST /admin/api/promo-codes`

**Input**:
```json
{
  "code": "string (required, uppercase)",
  "type": "percentage|fixed_amount|credit|trial_extension|feature_unlock|plan_upgrade (required)",
  "value": number (required),
  "max_redemptions": integer (optional),
  "valid_from": "ISO8601 datetime (required)",
  "valid_until": "ISO8601 datetime (required)",
  "applicable_plans": ["uuid"] (optional),
  "conditions": {
    "min_purchase": number,
    "new_customers_only": boolean
  }
}
```

**Output**:
```json
{
  "promo_id": "uuid",
  "code": "string",
  "status": "active",
  "created_at": "ISO8601 datetime"
}
```

---

#### 11. Validate Promo Code

**Endpoint**: `POST /admin/api/promo-codes/validate`

**Input**:
```json
{
  "code": "string (required)",
  "customer_id": "uuid (required)",
  "plan_id": "uuid (optional)"
}
```

**Output**:
```json
{
  "valid": boolean,
  "promo": {
    "code": "string",
    "type": "string",
    "value": number,
    "description": "string"
  },
  "error": "string|null"
}
```

---

#### 12. Redeem Promo Code

**Endpoint**: `POST /admin/api/promo-codes/redeem`

**Input**:
```json
{
  "code": "string (required)",
  "customer_id": "uuid (required)"
}
```

**Output**:
```json
{
  "redeemed": true,
  "redemption_id": "uuid",
  "applied_benefit": {
    "type": "string",
    "value": number,
    "description": "string"
  },
  "redeemed_at": "ISO8601 datetime"
}
```

**Status Codes**:
- 200: Redeemed successfully
- 400: Invalid/expired code
- 409: Already redeemed or limit reached

---

#### 13. Create Offer

**Endpoint**: `POST /admin/api/offers`

**Input**:
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "discount_type": "percentage|fixed (required)",
  "discount_value": number (required),
  "valid_from": "ISO8601 datetime (required)",
  "valid_until": "ISO8601 datetime (required)",
  "target_audience": {
    "customer_ids": ["uuid"],
    "plan_tiers": ["string"],
    "new_customers": boolean
  },
  "auto_apply": boolean
}
```

**Output**:
```json
{
  "offer_id": "uuid",
  "status": "active",
  "eligible_customers": integer
}
```

---

### Credits Management

#### 14. Add Credits

**Endpoint**: `POST /admin/api/customers/:id/credits`

**Input**:
```json
{
  "amount": number (required, positive),
  "reason": "string (required)",
  "expires_at": "ISO8601 datetime (optional)"
}
```

**Output**:
```json
{
  "customer_id": "uuid",
  "credit_balance": number,
  "added": number,
  "transaction_id": "uuid"
}
```

---

#### 15. Get Credit Balance

**Endpoint**: `GET /admin/api/customers/:id/credits`

**Output**:
```json
{
  "customer_id": "uuid",
  "balance": number,
  "transactions": [
    {
      "id": "uuid",
      "amount": number,
      "type": "added|deducted|expired",
      "reason": "string",
      "timestamp": "ISO8601 datetime"
    }
  ]
}
```

---

### Usage Analytics

#### 16. Get Customer Usage

**Endpoint**: `GET /admin/api/customers/:id/usage`

**Input**:
```
Query Parameters:
  from: ISO8601 date (optional)
  to: ISO8601 date (optional)
  granularity: 'hour'|'day'|'month' (optional)
```

**Output**:
```json
{
  "customer_id": "uuid",
  "period": {
    "from": "ISO8601 date",
    "to": "ISO8601 date"
  },
  "usage": [
    {
      "timestamp": "ISO8601 datetime",
      "requests": integer,
      "avg_response_time": number,
      "errors": integer,
      "top_endpoints": [
        {
          "endpoint": "string",
          "count": integer
        }
      ]
    }
  ],
  "summary": {
    "total_requests": integer,
    "total_errors": integer,
    "avg_response_time": number
  }
}
```

---

### Source Management

#### 17. List Sources

**Endpoint**: `GET /admin/api/sources`

**Output**:
```json
{
  "sources": [
    {
      "id": "uuid",
      "name": "string",
      "type": "pdf|json|html",
      "url": "string",
      "priority": integer,
      "enabled": boolean,
      "last_fetched": "ISO8601 datetime",
      "status": "active|error|pending",
      "error_message": "string|null"
    }
  ]
}
```

---

#### 18. Add Source

**Endpoint**: `POST /admin/api/sources`

**Input**:
```json
{
  "name": "string (required)",
  "type": "pdf|json|html (required)",
  "url": "string (required, valid URL)",
  "priority": integer (optional, default: 0),
  "schedule": "string (optional, cron expression)",
  "config": {
    "parser": "string",
    "selectors": {},
    "transform": {}
  }
}
```

**Output**:
```json
{
  "source_id": "uuid",
  "status": "pending",
  "created_at": "ISO8601 datetime"
}
```

---

#### 19. Trigger Source Fetch

**Endpoint**: `POST /admin/api/sources/:id/fetch`

**Output**:
```json
{
  "job_id": "uuid",
  "source_id": "uuid",
  "status": "queued",
  "queued_at": "ISO8601 datetime"
}
```

---

#### 20. Disable Source

**Endpoint**: `POST /admin/api/sources/:id/disable`

**Output**:
```json
{
  "source_id": "uuid",
  "enabled": false,
  "disabled_at": "ISO8601 datetime"
}
```

---

### Module Registry

#### 21. List Modules

**Endpoint**: `GET /admin/api/modules`

**Output**:
```json
{
  "modules": [
    {
      "id": "uuid",
      "name": "string",
      "type": "hsn|notification|state_rules|intelligence",
      "enabled": boolean,
      "version": "string",
      "config": {}
    }
  ]
}
```

---

#### 22. Enable Module

**Endpoint**: `POST /admin/api/modules/:id/enable`

**Input**:
```json
{
  "config": {
    "key": "value"
  }
}
```

**Output**:
```json
{
  "module_id": "uuid",
  "enabled": true,
  "applied_config": {}
}
```

---

### Workflow Management

#### 23. List Workflows

**Endpoint**: `GET /admin/api/workflows`

**Output**:
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "string",
      "type": "source_to_parse|change_detection|notification_sync",
      "status": "active|paused|error",
      "schedule": "string",
      "last_run": "ISO8601 datetime",
      "next_run": "ISO8601 datetime"
    }
  ]
}
```

---

#### 24. Trigger Workflow

**Endpoint**: `POST /admin/api/workflows/:id/trigger`

**Input**:
```json
{
  "params": {
    "source_id": "uuid (optional)",
    "force": boolean (optional)
  }
}
```

**Output**:
```json
{
  "job_id": "uuid",
  "workflow_id": "uuid",
  "status": "running",
  "started_at": "ISO8601 datetime"
}
```

---

#### 25. Get Workflow Status

**Endpoint**: `GET /admin/api/workflows/:id/status`

**Output**:
```json
{
  "workflow_id": "uuid",
  "current_job": {
    "job_id": "uuid",
    "status": "running|completed|failed",
    "progress": number,
    "started_at": "ISO8601 datetime",
    "completed_at": "ISO8601 datetime|null",
    "error": "string|null"
  },
  "recent_jobs": [
    {
      "job_id": "uuid",
      "status": "string",
      "duration_ms": integer,
      "completed_at": "ISO8601 datetime"
    }
  ]
}
```

---

### Referral System

#### 26. Create Referral

**Endpoint**: `POST /admin/api/referrals`

**Input**:
```json
{
  "referrer_id": "uuid (required)",
  "referee_email": "string (required)",
  "reward_type": "credit|discount|plan_upgrade",
  "reward_value": number
}
```

**Output**:
```json
{
  "referral_id": "uuid",
  "referral_code": "string",
  "referrer_id": "uuid",
  "status": "pending",
  "created_at": "ISO8601 datetime"
}
```

---

#### 27. Get Referral Stats

**Endpoint**: `GET /admin/api/customers/:id/referrals`

**Output**:
```json
{
  "customer_id": "uuid",
  "total_referrals": integer,
  "successful_referrals": integer,
  "pending_referrals": integer,
  "total_rewards_earned": number,
  "referrals": [
    {
      "referral_id": "uuid",
      "referee_email": "string",
      "status": "pending|completed|expired",
      "reward_earned": number,
      "created_at": "ISO8601 datetime"
    }
  ]
}
```

---

## Internal Service APIs

### Billing Engine

#### Authentication Service

```javascript
// Validate API Key
validateApiKey(apiKey: string) => Promise<{
  valid: boolean,
  customer: {
    id: uuid,
    plan_id: uuid,
    status: string
  },
  limits: {
    hourly: integer,
    daily: integer,
    monthly: integer,
    burst: integer
  }
}>

// Generate API Key
generateApiKey(customerId: uuid) => Promise<{
  api_key: string,
  checksum: string,
  created_at: datetime
}>

// Check Rate Limit
checkRateLimit(customerId: uuid, apiKey: string) => Promise<{
  allowed: boolean,
  current: {
    hourly: integer,
    daily: integer,
    monthly: integer
  },
  limits: {
    hourly: integer,
    daily: integer,
    monthly: integer
  },
  reset_times: {
    hourly: datetime,
    daily: datetime,
    monthly: datetime
  }
}>
```

---

#### Promo Engine

```javascript
// Validate Promo Code
validatePromo(code: string, customerId: uuid, planId?: uuid) => Promise<{
  valid: boolean,
  promo: {
    id: uuid,
    code: string,
    type: string,
    value: number,
    conditions: object
  },
  error?: string
}>

// Redeem Promo Code
redeemPromo(code: string, customerId: uuid) => Promise<{
  redeemed: boolean,
  redemption_id: uuid,
  applied_value: number,
  benefit_type: string
}>

// Apply Offer
applyOffer(offerId: uuid, customerId: uuid) => Promise<{
  applied: boolean,
  discount: number,
  valid_until: datetime
}>
```

---

#### Usage Tracking

```javascript
// Record Usage
recordUsage(customerId: uuid, apiKey: string, {
  endpoint: string,
  method: string,
  response_time_ms: integer,
  status_code: integer,
  error?: string
}) => Promise<void>

// Get Usage Stats
getUsageStats(customerId: uuid, from: date, to: date) => Promise<{
  total_requests: integer,
  by_endpoint: object,
  by_day: array,
  errors: integer,
  avg_response_time: number
}>
```

---

### Search Engine

```javascript
// Search HSN
searchHSN(query: string, options?: {
  limit?: integer,
  offset?: integer,
  rate_filter?: number
}) => Promise<{
  results: [{
    hsn: string,
    description: string,
    gst_rate: number,
    rank: number
  }],
  total: integer
}>

// Search Notifications
searchNotifications(query: string, options?: {
  from?: date,
  to?: date,
  type?: string,
  limit?: integer
}) => Promise<{
  results: array,
  total: integer
}>

// Get Suggestions
getSuggestions(query: string, limit?: integer) => Promise<{
  suggestions: array
}>
```

---

### Event Engine

```javascript
// Publish Event
publishEvent(eventType: string, payload: object) => Promise<{
  event_id: uuid,
  published_at: datetime
}>

// Subscribe to Events
subscribeToEvents(eventTypes: string[], webhook: string) => Promise<{
  subscription_id: uuid,
  status: string
}>

// Event Types
EVENT_TYPES = {
  HSN_UPDATED: 'hsn.updated',
  HSN_RATE_CHANGED: 'hsn.rate_changed',
  NOTIFICATION_PUBLISHED: 'notification.published',
  SOURCE_FETCHED: 'source.fetched',
  DOCUMENT_PROCESSED: 'document.processed',
  CUSTOMER_CREATED: 'customer.created',
  USAGE_LIMIT_REACHED: 'usage.limit_reached'
}
```

---

### Change Detection Engine

```javascript
// Detect Changes
detectChanges(documentId: uuid, newContent: string) => Promise<{
  changed: boolean,
  old_checksum: string,
  new_checksum: string,
  change_type: 'content'|'rate'|'metadata',
  diff_summary: object
}>

// Get Change History
getChangeHistory(documentId: uuid, from?: date, to?: date) => Promise<{
  changes: [{
    change_id: uuid,
    changed_at: datetime,
    change_type: string,
    old_value: any,
    new_value: any
  }]
}>
```

---

### Workflow Engine

```javascript
// Create Job
createJob(workflowType: string, params: object) => Promise<{
  job_id: uuid,
  status: 'queued'|'running',
  created_at: datetime
}>

// Get Job Status
getJobStatus(jobId: uuid) => Promise<{
  job_id: uuid,
  status: 'queued'|'running'|'completed'|'failed',
  progress: number,
  result?: object,
  error?: string,
  started_at?: datetime,
  completed_at?: datetime
}>

// Workflow Types
WORKFLOW_TYPES = {
  SOURCE_FETCH: 'source.fetch',
  PARSE_DOCUMENT: 'parse.document',
  SYNC_HSN: 'sync.hsn',
  PROCESS_NOTIFICATIONS: 'process.notifications'
}
```

---

## Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "string - Error code (e.g., INVALID_API_KEY)",
    "message": "string - Human-readable error message",
    "details": {
      "field": "string - Field that caused error (for validation)",
      "constraint": "string - Constraint violated"
    },
    "request_id": "uuid - For support tracking"
  }
}
```

### Common Error Codes

- `INVALID_API_KEY`: API key is invalid or expired
- `RATE_LIMIT_EXCEEDED`: Request rate limit exceeded
- `INSUFFICIENT_CREDITS`: Customer has insufficient credits
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `ALREADY_EXISTS`: Resource already exists (e.g., duplicate email)
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting Headers

All API responses include rate limiting headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1640000000
X-RateLimit-Window: hourly
```

---

## Pagination

Paginated endpoints follow this pattern:

**Request**:
```
GET /endpoint?limit=50&offset=100
```

**Response**:
```json
{
  "data": [],
  "pagination": {
    "total": 1500,
    "limit": 50,
    "offset": 100,
    "has_more": true
  }
}
```

---

## Webhooks

Webhook payloads are sent as POST requests with this format:

```json
{
  "webhook_id": "uuid",
  "event_type": "string",
  "event_id": "uuid",
  "timestamp": "ISO8601 datetime",
  "data": {
    // Event-specific payload
  },
  "signature": "string - HMAC-SHA256 signature for verification"
}
```

**Signature Verification**:
```
HMAC-SHA256(webhook_secret, body)
```
