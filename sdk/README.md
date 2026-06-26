# GST Platform SDK

Simple SDKs for integrating GST rate lookup in your e-commerce platform.

## Quick Start

### JavaScript/Node.js

```javascript
const GSTClient = require('./gst-sdk.js');

const gst = new GSTClient('gst_your_api_key');

// Get rate by HSN
const rate = await gst.getRate('8517');
console.log(`GST Rate: ${rate.rate}%`);

// Search by description
const results = await gst.search('mobile phone');
console.log(`HSN: ${results[0].hsn_code}, Rate: ${results[0].rate}%`);

// Calculate cart
const breakdown = await gst.calculateCart([
  { hsn_code: '8517', price: 15000, quantity: 1 }
], 'MH', 'MH');
console.log(`Total: ₹${breakdown.total}`);
```

### Python

```python
from gst_sdk import GSTClient

gst = GSTClient('gst_your_api_key')

# Get rate by HSN
rate = gst.get_rate('8517')
print(f"GST Rate: {rate['rate']}%")

# Search by description
results = gst.search('mobile phone')
print(f"HSN: {results[0]['hsn_code']}, Rate: {results[0]['rate']}%")

# Calculate cart
breakdown = gst.calculate_cart([
    {'hsn_code': '8517', 'price': 15000, 'quantity': 1}
], 'MH', 'MH')
print(f"Total: ₹{breakdown['total']}")
```

### PHP

```php
<?php
require_once 'gst-sdk.php';

$gst = new GSTClient('gst_your_api_key');

// Get rate by HSN
$rate = $gst->getRate('8517');
echo "GST Rate: " . $rate['rate'] . "%\n";

// Search by description
$results = $gst->search('mobile phone');
echo "HSN: " . $results[0]['hsn_code'] . ", Rate: " . $results[0]['rate'] . "%\n";

// Calculate cart
$breakdown = $gst->calculateCart([
    ['hsn_code' => '8517', 'price' => 15000, 'quantity' => 1]
], 'MH', 'MH');
echo "Total: ₹" . $breakdown['total'];
?>
```

## API Reference

### Constructor

```javascript
new GSTClient(apiKey, baseURL)
```

- **apiKey**: Your API key (get from admin portal)
- **baseURL**: Platform URL (default: http://localhost:3000)

### Methods

#### getRate(hsnCode)

Get GST rate for an HSN code.

**Returns:**
```javascript
{
  hsn_code: '8517',
  description: 'Mobile phones',
  rate: 18,
  cess: 0,
  chapter: 85
}
```

#### search(query, limit)

Search for HSN codes by product description.

**Returns:**
```javascript
[
  {
    hsn_code: '8517',
    description: 'Mobile phones',
    rate: 18,
    score: 0.95
  }
]
```

#### calculateGST(amount, rate, isSameState)

Calculate GST breakdown for an amount.

**Returns:**
```javascript
{
  subtotal: 15000,
  cgst: 1350,  // If same state
  sgst: 1350,  // If same state
  igst: 0,     // If different state
  total: 17700
}
```

#### calculateCart(items, customerState, sellerState)

Calculate total cart value with GST.

**Parameters:**
```javascript
items = [
  { hsn_code: '8517', price: 15000, quantity: 1 },
  { hsn_code: '6109', price: 500, quantity: 2 }
]
```

**Returns:**
```javascript
{
  subtotal: 16000,
  cgst: 1440,
  sgst: 1440,
  igst: 0,
  cess: 0,
  total: 18880,
  items: [...]
}
```

## Features

- ✅ Automatic caching (24 hour TTL)
- ✅ HSN code lookup
- ✅ Product description search
- ✅ CGST/SGST/IGST calculation
- ✅ Cart total calculation
- ✅ Error handling
- ✅ TypeScript support (coming soon)

## Examples

See `/examples/ecommerce-example.js` for complete integration examples.

## Support

- Documentation: See ECOMMERCE_INTEGRATION.md
- Issues: Contact support@your-gst-platform.com
