# E-commerce Integration Guide

Quick guide to integrate GST rate lookup for your e-commerce platform.

## Step 1: Get API Access (2 minutes)

**Create account and get API key:**
```bash
# Create customer account
curl -X POST http://your-gst-platform.com/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@ecommerce.com",
    "company_name": "Your Store",
    "contact_person": "Your Name"
  }'

# Generate API key (use customer ID from above)
curl -X POST http://your-gst-platform.com/api/customers/{CUSTOMER_ID}/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Key"}'
```

**Save your API key:**
```
gst_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 2: Integration Methods

### Option A: Direct HSN Lookup (Best if you have HSN codes)

```javascript
// Node.js / JavaScript
async function getGSTRate(hsnCode) {
  const response = await fetch(
    `https://your-gst-platform.com/api/v1/hsn/${hsnCode}`,
    {
      headers: {
        'X-API-Key': 'gst_your_key_here'
      }
    }
  );
  
  const data = await response.json();
  return {
    rate: data.rate,
    cess: data.cess,
    description: data.description
  };
}

// Usage
const gstInfo = await getGSTRate('8517');
console.log(`GST Rate: ${gstInfo.rate}%`);
```

```python
# Python
import requests

def get_gst_rate(hsn_code):
    response = requests.get(
        f'https://your-gst-platform.com/api/v1/hsn/{hsn_code}',
        headers={'X-API-Key': 'gst_your_key_here'}
    )
    data = response.json()
    return {
        'rate': data['rate'],
        'cess': data['cess'],
        'description': data['description']
    }

# Usage
gst_info = get_gst_rate('8517')
print(f"GST Rate: {gst_info['rate']}%")
```

```php
// PHP
function getGSTRate($hsnCode) {
    $ch = curl_init("https://your-gst-platform.com/api/v1/hsn/$hsnCode");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: gst_your_key_here'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);
    
    return [
        'rate' => $response['rate'],
        'cess' => $response['cess'],
        'description' => $response['description']
    ];
}

// Usage
$gstInfo = getGSTRate('8517');
echo "GST Rate: " . $gstInfo['rate'] . "%";
```

---

### Option B: Search by Product Description (If no HSN code)

```javascript
// Search by product name/description
async function findGSTRate(productDescription) {
  const response = await fetch(
    `https://your-gst-platform.com/api/v1/search?q=${encodeURIComponent(productDescription)}`,
    {
      headers: {
        'X-API-Key': 'gst_your_key_here'
      }
    }
  );
  
  const data = await response.json();
  
  if (data.results.length > 0) {
    const bestMatch = data.results[0];
    return {
      hsn_code: bestMatch.hsn_code,
      rate: bestMatch.rate,
      cess: bestMatch.cess,
      description: bestMatch.description
    };
  }
  
  return null;
}

// Usage
const gstInfo = await findGSTRate('mobile phone');
console.log(`HSN: ${gstInfo.hsn_code}, Rate: ${gstInfo.rate}%`);
```

---

## Step 3: Common Integration Patterns

### Pattern 1: At Product Creation (One-time)

Add HSN and GST rate when creating/importing products:

```javascript
// When adding product to your catalog
async function addProduct(product) {
  // Find GST rate
  const gstInfo = await findGSTRate(product.name);
  
  // Save to your database
  await db.products.insert({
    name: product.name,
    price: product.price,
    hsn_code: gstInfo.hsn_code,
    gst_rate: gstInfo.rate,
    cess_rate: gstInfo.cess
  });
}
```

### Pattern 2: At Checkout (Real-time)

Calculate GST during checkout:

```javascript
// Calculate cart total with GST
async function calculateCartTotal(cartItems) {
  let subtotal = 0;
  let totalGST = 0;
  
  for (const item of cartItems) {
    const gstInfo = await getGSTRate(item.hsn_code);
    const itemTotal = item.price * item.quantity;
    const gst = (itemTotal * gstInfo.rate) / 100;
    
    subtotal += itemTotal;
    totalGST += gst;
  }
  
  return {
    subtotal,
    gst: totalGST,
    total: subtotal + totalGST
  };
}
```

### Pattern 3: Bulk Import/Update

Update GST rates for all products:

```javascript
// Update all products with latest GST rates
async function updateAllGSTRates() {
  const products = await db.products.findAll();
  
  for (const product of products) {
    if (product.hsn_code) {
      const gstInfo = await getGSTRate(product.hsn_code);
      await db.products.update(product.id, {
        gst_rate: gstInfo.rate,
        cess_rate: gstInfo.cess,
        updated_at: new Date()
      });
    }
  }
}

// Run once daily
setInterval(updateAllGSTRates, 24 * 60 * 60 * 1000);
```

---

## Step 4: Invoice Generation

Calculate and display GST breakdown:

```javascript
function generateInvoice(cartItems) {
  let itemDetails = [];
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let cess = 0;
  
  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity;
    const gstAmount = (itemTotal * item.gst_rate) / 100;
    const cessAmount = (itemTotal * (item.cess_rate || 0)) / 100;
    
    // If same state: CGST + SGST, else: IGST
    if (item.same_state) {
      cgst += gstAmount / 2;
      sgst += gstAmount / 2;
    } else {
      igst += gstAmount;
    }
    
    cess += cessAmount;
    subtotal += itemTotal;
    
    itemDetails.push({
      name: item.name,
      hsn: item.hsn_code,
      qty: item.quantity,
      price: item.price,
      total: itemTotal,
      gst_rate: item.gst_rate
    });
  }
  
  return {
    items: itemDetails,
    subtotal,
    cgst,
    sgst,
    igst,
    cess,
    total: subtotal + cgst + sgst + igst + cess
  };
}
```

---

## Complete Example: Shopify Integration

```javascript
// Shopify webhook handler for new products
app.post('/webhooks/products/create', async (req, res) => {
  const product = req.body;
  
  // Find GST rate
  const gstInfo = await findGSTRate(product.title);
  
  // Update product metafields in Shopify
  await shopify.product.updateMetafield(product.id, {
    namespace: 'gst',
    key: 'hsn_code',
    value: gstInfo.hsn_code,
    type: 'single_line_text_field'
  });
  
  await shopify.product.updateMetafield(product.id, {
    namespace: 'gst',
    key: 'rate',
    value: gstInfo.rate.toString(),
    type: 'number_decimal'
  });
  
  res.json({ success: true });
});

// Checkout calculation
app.post('/checkout/calculate', async (req, res) => {
  const { items, customer_state } = req.body;
  const seller_state = 'MH'; // Your state
  
  let breakdown = {
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0
  };
  
  for (const item of items) {
    const gstInfo = await getGSTRate(item.hsn_code);
    const itemTotal = item.price * item.quantity;
    const gstAmount = (itemTotal * gstInfo.rate) / 100;
    
    breakdown.subtotal += itemTotal;
    
    if (customer_state === seller_state) {
      breakdown.cgst += gstAmount / 2;
      breakdown.sgst += gstAmount / 2;
    } else {
      breakdown.igst += gstAmount;
    }
  }
  
  breakdown.total = breakdown.subtotal + breakdown.cgst + breakdown.sgst + breakdown.igst;
  
  res.json(breakdown);
});
```

---

## Complete Example: WooCommerce Plugin

```php
<?php
// WooCommerce GST Integration Plugin

class GST_Integration {
    private $api_key = 'gst_your_key_here';
    private $api_url = 'https://your-gst-platform.com/api/v1';
    
    public function __construct() {
        // Hook into product save
        add_action('woocommerce_process_product_meta', [$this, 'update_product_gst']);
        
        // Hook into cart calculation
        add_action('woocommerce_cart_calculate_fees', [$this, 'add_gst_to_cart']);
    }
    
    public function get_gst_rate($hsn_code) {
        $ch = curl_init("{$this->api_url}/hsn/{$hsn_code}");
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-API-Key: {$this->api_key}"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        return $response;
    }
    
    public function search_gst($description) {
        $ch = curl_init("{$this->api_url}/search?q=" . urlencode($description));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-API-Key: {$this->api_key}"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        return $response['results'][0] ?? null;
    }
    
    public function update_product_gst($product_id) {
        $product = wc_get_product($product_id);
        $hsn = get_post_meta($product_id, '_hsn_code', true);
        
        if (empty($hsn)) {
            // Search by product name
            $gst_info = $this->search_gst($product->get_name());
            if ($gst_info) {
                update_post_meta($product_id, '_hsn_code', $gst_info['hsn_code']);
                update_post_meta($product_id, '_gst_rate', $gst_info['rate']);
            }
        } else {
            // Get rate by HSN
            $gst_info = $this->get_gst_rate($hsn);
            update_post_meta($product_id, '_gst_rate', $gst_info['rate']);
        }
    }
    
    public function add_gst_to_cart($cart) {
        $gst_total = 0;
        
        foreach ($cart->get_cart() as $item) {
            $product_id = $item['product_id'];
            $gst_rate = get_post_meta($product_id, '_gst_rate', true);
            
            if ($gst_rate) {
                $item_total = $item['line_total'];
                $gst_total += ($item_total * $gst_rate) / 100;
            }
        }
        
        if ($gst_total > 0) {
            $cart->add_fee('GST', $gst_total, true);
        }
    }
}

new GST_Integration();
?>
```

---

## Step 5: Cache & Optimize

Cache GST rates to reduce API calls:

```javascript
// Simple cache implementation
const gstCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedGSTRate(hsnCode) {
  const cached = gstCache.get(hsnCode);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await getGSTRate(hsnCode);
  gstCache.set(hsnCode, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

---

## Pricing & Support

### Free Tier
- 1,000 requests/month
- Perfect for testing and small stores

### Paid Plans
- **Starter** (₹999/month): 100K requests
- **Professional** (₹4,999/month): 1M requests
- **Enterprise** (₹19,999/month): Unlimited

**Use promo code `LAUNCH50` for 50% off first 3 months!**

---

## Support

**Documentation:**
- API Reference: See API_BUSINESS.md
- Webhooks: Contact support
- Custom Integration: hello@your-gst-platform.com

**Quick Test:**
```bash
curl https://your-gst-platform.com/api/v1/hsn/8517 \
  -H "X-API-Key: your_key"
```

---

## Common Product Categories & HSN Codes

| Product | HSN Code | GST Rate |
|---------|----------|----------|
| Clothing | 6203-6211 | 5-12% |
| Mobile Phones | 8517 | 18% |
| Laptops | 8471 | 18% |
| Footwear | 6401-6405 | 5-18% |
| Books | 4901-4911 | 0-12% |
| Food Items | 1001-2309 | 0-18% |
| Cosmetics | 3304 | 18% |
| Furniture | 9403 | 18% |
| Toys | 9503 | 12-18% |
| Jewellery | 7113 | 3% |

Use the search API to find exact rates for your products!
