// GST Platform JavaScript SDK
// Simple client for e-commerce integration

class GSTClient {
  constructor(apiKey, baseURL = 'http://localhost:3000') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  async request(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get GST rate by HSN code
  async getRate(hsnCode) {
    const cached = this.cache.get(hsnCode);
    if (cached && Date.now() - cached.ts < this.cacheTTL) {
      return cached.data;
    }

    const data = await this.request(`/api/v1/hsn/${hsnCode}`);
    this.cache.set(hsnCode, { data, ts: Date.now() });
    return data;
  }

  // Search by product description
  async search(query, limit = 5) {
    const data = await this.request(`/api/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return data.results || [];
  }

  // Calculate GST for amount
  calculateGST(amount, rate, isSameState = true) {
    const gstAmount = (amount * rate) / 100;
    
    return isSameState ? {
      subtotal: amount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: amount + gstAmount
    } : {
      subtotal: amount,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: amount + gstAmount
    };
  }

  // Calculate cart total with GST
  async calculateCart(items, customerState, sellerState = 'MH') {
    const isSameState = customerState === sellerState;
    let breakdown = { subtotal: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, items: [] };

    for (const item of items) {
      const gstInfo = await this.getRate(item.hsn_code);
      const itemTotal = item.price * item.quantity;
      const gstCalc = this.calculateGST(itemTotal, gstInfo.rate, isSameState);

      breakdown.subtotal += gstCalc.subtotal;
      breakdown.cgst += gstCalc.cgst;
      breakdown.sgst += gstCalc.sgst;
      breakdown.igst += gstCalc.igst;

      breakdown.items.push({
        ...item,
        gst_rate: gstInfo.rate,
        gst_amount: gstCalc.cgst + gstCalc.sgst + gstCalc.igst
      });
    }

    breakdown.total = breakdown.subtotal + breakdown.cgst + breakdown.sgst + breakdown.igst + breakdown.cess;
    return breakdown;
  }
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = GSTClient;
}

// Usage Example:
// const client = new GSTClient('gst_your_api_key');
// const rate = await client.getRate('8517');
// console.log(`GST Rate: ${rate.rate}%`);
