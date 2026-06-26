# GST API - Commercial Offering

**Official HSN & GSTN API for E-commerce Platforms**

## 🎯 For E-commerce & Business Applications

Integrate real-time GST rates, HSN codes, and tax compliance data into your platform.

## ✨ Features

- **30,000+ HSN Codes** with current GST rates
- **Real-time Updates** from official sources
- **Historical Data** for tax calculations
- **Full-text Search** with fuzzy matching
- **State-specific Rules** for all Indian states
- **99.9% Uptime SLA** (Enterprise)
- **Fast Response** (<100ms average)
- **RESTful API** with JSON responses

## 💰 Pricing Plans

### Free Tier
**₹0/month**
- 1,000 requests/day
- 100 requests/hour
- Basic support
- Perfect for testing

### Starter
**₹999/month**
- 100,000 requests/day
- 1,000 requests/hour
- Email support
- For small businesses

### Professional
**₹4,999/month**
- 500,000 requests/day
- 5,000 requests/hour
- Priority support
- Webhooks for updates
- For growing e-commerce

### Enterprise
**₹19,999/month**
- Unlimited requests
- 20,000 requests/hour
- 24x7 phone support
- Custom integrations
- 99.9% SLA
- Dedicated account manager

## 🚀 Quick Start

### 1. Get API Key

Sign up and get your API key instantly:
```bash
curl -X POST https://api.gstplatform.in/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@company.com",
    "company_name": "Your Company",
    "plan": "free"
  }'
```

### 2. Make Your First Request

```bash
curl https://api.gstplatform.in/api/v1/hsn/8517 \
  -H "X-API-Key: gst_your_api_key_here"
```

Response:
```json
{
  "hsn_code": "8517",
  "description": "Telephone sets, including smartphones",
  "cgst": 9.0,
  "sgst": 9.0,
  "igst": 18.0,
  "effective_date": "2017-07-01",
  "notification_no": "1/2017"
}
```

## 📚 API Endpoints

### Get HSN Details
```http
GET /api/v1/hsn/{code}
```

### Search HSN by Description
```http
GET /api/v1/search?q=mobile
```

### Get HSN by Rate
```http
GET /api/v1/hsn?rate=18
```

### Get State Rules
```http
GET /api/v1/states/MH/rules
```

### Autocomplete Suggestions
```http
GET /api/v1/suggest?q=85
```

## 🔐 Authentication

Include your API key in the header:
```
X-API-Key: gst_your_api_key_here
```

## 📊 Rate Limits

Every response includes rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
```

## 💡 Use Cases

### E-commerce Platforms
```javascript
// Calculate GST for product
const hsn = await fetch('https://api.gstplatform.in/api/v1/hsn/8517', {
  headers: { 'X-API-Key': 'your_key' }
}).then(r => r.json());

const price = 10000;
const gst = price * (hsn.igst / 100);
const total = price + gst;
```

### Invoice Generation
```javascript
// Get current rates for invoicing
const products = ['8517', '8528', '8471'];
const rates = await Promise.all(
  products.map(hsn => 
    fetch(`https://api.gstplatform.in/api/v1/hsn/${hsn}`, {
      headers: { 'X-API-Key': 'your_key' }
    }).then(r => r.json())
  )
);
```

### Tax Compliance
```javascript
// Check if rates changed
const history = await fetch('https://api.gstplatform.in/api/v1/hsn/8517/history', {
  headers: { 'X-API-Key': 'your_key' }
}).then(r => r.json());
```

## 📈 Analytics Dashboard

Track your API usage:
- Requests per day/month
- Most used endpoints
- Average response time
- Error rates
- Usage by product

Access at: https://admin.gstplatform.in

## 🔄 Webhooks (Professional+)

Get notified when rates change:
```json
{
  "event": "hsn.rate_changed",
  "hsn_code": "8517",
  "old_rate": 18.0,
  "new_rate": 12.0,
  "effective_date": "2026-07-01"
}
```

## 🛠️ SDKs & Libraries

Coming soon:
- Node.js SDK
- Python SDK
- PHP SDK
- Ruby SDK

## 📞 Support

- **Email**: support@gstplatform.in
- **Docs**: https://docs.gstplatform.in
- **Status**: https://status.gstplatform.in
- **Priority Support**: For Pro+ customers

## ⚖️ Legal

- Data sourced from official CBIC
- Updated within 24 hours of changes
- Compliant with Indian tax laws
- No warranty for business decisions

## 🎁 Special Offers

### Startup Discount
50% off for 6 months for:
- YC companies
- Government-backed startups
- Non-profits

### Annual Plans
Save 20% with annual billing

### Volume Discounts
Contact sales for custom enterprise pricing

## 📋 Customer Success Stories

> "Integrated in 1 hour. Saved us weeks of work maintaining GST rates."
> - CTO, Leading E-commerce Platform

> "API response time is incredible. Never had downtime issues."
> - Developer, Fashion Marketplace

## 🔗 Get Started

1. **Sign up**: https://admin.gstplatform.in/signup
2. **Get API key**: Instant activation
3. **Read docs**: https://docs.gstplatform.in
4. **Integrate**: 15 minutes to production

## 📧 Contact Sales

For enterprise plans and custom requirements:
- Email: sales@gstplatform.in
- Schedule demo: https://gstplatform.in/demo
- Phone: +91-XXXX-XXXXXX

---

**Trusted by 100+ e-commerce platforms across India**
