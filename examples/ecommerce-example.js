// Complete E-commerce Integration Example
// Copy and adapt this for your platform

const GSTClient = require('../sdk/gst-sdk.js');

// Initialize client with your API key
const gst = new GSTClient('gst_your_api_key_here', 'http://localhost:3000');

// Example 1: Add product with HSN lookup
async function addProduct(product) {
  console.log('\n=== Adding Product ===');
  
  // Search for HSN by product description
  const results = await gst.search(product.name);
  
  if (results.length > 0) {
    const match = results[0];
    product.hsn_code = match.hsn_code;
    product.gst_rate = match.rate;
    
    console.log(`Product: ${product.name}`);
    console.log(`HSN Code: ${product.hsn_code}`);
    console.log(`GST Rate: ${product.gst_rate}%`);
    
    // Save to your database
    // await db.products.insert(product);
  }
  
  return product;
}

// Example 2: Calculate checkout
async function calculateCheckout(cart, customerState) {
  console.log('\n=== Checkout Calculation ===');
  
  const breakdown = await gst.calculateCart(cart, customerState, 'MH');
  
  console.log(`Subtotal: ₹${breakdown.subtotal.toFixed(2)}`);
  console.log(`CGST: ₹${breakdown.cgst.toFixed(2)}`);
  console.log(`SGST: ₹${breakdown.sgst.toFixed(2)}`);
  console.log(`IGST: ₹${breakdown.igst.toFixed(2)}`);
  console.log(`Total: ₹${breakdown.total.toFixed(2)}`);
  
  return breakdown;
}

// Example 3: Generate invoice
function generateInvoice(breakdown, customer) {
  console.log('\n=== Invoice ===');
  console.log(`Customer: ${customer.name}`);
  console.log(`State: ${customer.state}`);
  console.log('');
  
  console.log('Items:');
  breakdown.items.forEach(item => {
    console.log(`  ${item.name} (HSN: ${item.hsn_code})`);
    console.log(`    Qty: ${item.quantity} x ₹${item.price} = ₹${item.price * item.quantity}`);
    console.log(`    GST ${item.gst_rate}%: ₹${item.gst_amount.toFixed(2)}`);
  });
  
  console.log('');
  console.log(`Subtotal: ₹${breakdown.subtotal.toFixed(2)}`);
  if (breakdown.cgst > 0) {
    console.log(`CGST: ₹${breakdown.cgst.toFixed(2)}`);
    console.log(`SGST: ₹${breakdown.sgst.toFixed(2)}`);
  }
  if (breakdown.igst > 0) {
    console.log(`IGST: ₹${breakdown.igst.toFixed(2)}`);
  }
  console.log(`Grand Total: ₹${breakdown.total.toFixed(2)}`);
}

// Run examples
async function main() {
  try {
    // 1. Add products
    const product1 = await addProduct({
      name: 'Samsung Mobile Phone',
      price: 15000
    });
    
    const product2 = await addProduct({
      name: 'Cotton T-Shirt',
      price: 500
    });

    // 2. Create cart
    const cart = [
      {
        name: 'Samsung Mobile Phone',
        hsn_code: '8517',
        price: 15000,
        quantity: 1
      },
      {
        name: 'Cotton T-Shirt',
        hsn_code: '6109',
        price: 500,
        quantity: 2
      }
    ];

    // 3. Calculate for same state customer
    const customer = {
      name: 'Amit Kumar',
      state: 'MH' // Same state as seller
    };
    
    const breakdown = await calculateCheckout(cart, customer.state);

    // 4. Generate invoice
    generateInvoice(breakdown, customer);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { addProduct, calculateCheckout, generateInvoice };
