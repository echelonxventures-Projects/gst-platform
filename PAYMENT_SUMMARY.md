# Payment & Subscription System - Quick Start

## ✅ What's Implemented Now

### 1. Manual Subscription Management
Customers can be assigned plans through the admin panel without requiring payment gateway integration.

**How to Use:**
1. Go to Admin → Customers
2. Click "Manage" on any customer
3. Click "Subscription" tab
4. Click "Assign/Change Plan"
5. Select plan and payment status:
   - **Free Trial (7 days)** - Customer can test for 7 days
   - **Paid (Manual Invoice)** - Customer pays via bank transfer, you mark as paid manually
   - **Pending Payment** - Plan assigned but waiting for payment

### 2. Three Payment Models

#### Model A: Free Trial → Manual Payment (Current Implementation)
```
1. Admin assigns plan with "Free Trial"
2. Customer uses service for 7 days
3. After trial, admin sends invoice via email/WhatsApp
4. Customer pays via bank transfer/UPI
5. Admin marks subscription as "Paid (Manual Invoice)"
```

**Best for:** Starting immediately without payment gateway setup

---

#### Model B: Razorpay Integration (Recommended for India)
```
1. Admin creates subscription
2. Razorpay sends payment link to customer
3. Customer pays online (UPI/Cards/NetBanking)
4. System automatically activates subscription
5. Auto-renewal every month
```

**Setup Time:** 1-2 hours  
**Cost:** 2% + GST per transaction  
**See:** `PAYMENT_INTEGRATION.md` for full implementation

---

#### Model C: Invoice-Only (Enterprise B2B)
```
1. Admin assigns plan as "Paid"
2. System generates invoice at month-end
3. Send invoice to customer (PDF/email)
4. Customer pays via NEFT/RTGS
5. Admin marks invoice as paid after bank confirmation
```

**Best for:** Large enterprise customers with 30-day payment terms

---

## Current Workflow

### When You Assign a Plan:

**What Happens:**
1. ✅ Subscription record created in database
2. ✅ Customer's API keys inherit plan limits (requests/hour, requests/month)
3. ✅ Rate limiting automatically enforced
4. ✅ Usage tracking begins
5. ✅ Plan period: Current date → 1 month ahead

**Payment Status:**
- **Trialing** - 7-day free trial
- **Active** - Paid and active
- **Past Due** - Payment pending (API still works until you suspend)

---

## How Customers Pay (Manual Method)

### Step 1: You send payment details via email/WhatsApp
```
Dear Customer,

Your GST Platform subscription details:
Plan: Professional Plan
Price: ₹999/month
Period: Jan 1, 2026 - Feb 1, 2026

Payment Details:
Bank: HDFC Bank
Account: 50100123456789
IFSC: HDFC0001234
UPI: gstplatform@upi

Or pay via:
- PhonePe: 9876543210
- Google Pay: 9876543210

After payment, reply with transaction ID.
```

### Step 2: Customer pays and sends screenshot

### Step 3: You verify and mark as paid
1. Admin → Customers → Manage
2. Subscription tab → Shows "Past Due" or "Trialing"
3. After confirming payment, change status to "Paid (Manual Invoice)"

---

## Adding Automatic Payments (Future)

### Quick Setup - Razorpay (Recommended)

1. **Sign up:** https://razorpay.com/
2. **Get API keys** from Dashboard → Settings → API Keys
3. **Add to `.env`:**
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
4. **Install:** `npm install razorpay`
5. **Copy payment code** from `PAYMENT_INTEGRATION.md`
6. **Test** with test mode before going live

**Benefits:**
- ✅ Customer pays instantly via payment link
- ✅ UPI, Cards, NetBanking, Wallets supported
- ✅ Auto-renewal every month
- ✅ No manual work needed
- ✅ Automatic invoice generation

---

## Invoice Generation

### Current: Manual
You create invoice in Excel/Word and email to customer

### With Payment Gateway: Automatic
System generates PDF invoice with:
- Customer details
- Plan name and price
- Usage statistics
- Payment status
- Download link

---

## Monitoring Payments

### Admin Panel Shows:
1. **Customer Tab** → Subscription status
2. **Usage Tab** → API usage vs plan limits
3. **Keys Tab** → Which keys are using which plans

### Database Tables:
```sql
-- View all subscriptions
SELECT c.company_name, p.name as plan, s.status, s.current_period_end
FROM billing.subscriptions s
JOIN billing.customers c ON s.customer_id = c.id
JOIN billing.plans p ON s.plan_id = p.id;

-- View overdue subscriptions
SELECT * FROM billing.subscriptions 
WHERE status = 'past_due' AND current_period_end < CURRENT_DATE;
```

---

## FAQ

**Q: Can customer use API without payment?**  
A: Yes, if you assign "Free Trial" plan. After 7 days, either extend trial or mark as paid.

**Q: What if customer doesn't pay?**  
A: You can:
1. Suspend customer (Admin → Customers → Suspend)
2. API keys stop working immediately
3. They can't make any requests

**Q: How to give discounts?**  
A: Use Promo Codes feature:
- Admin → Promo Codes → Create
- Customer applies code during signup
- Discount applied automatically

**Q: Can we change plan mid-month?**  
A: Yes, assign new plan. Old subscription cancelled, new one starts immediately.

**Q: How to track who paid and who didn't?**  
A: Check subscription status:
- **Active** = Paid
- **Trialing** = Free trial
- **Past Due** = Payment pending
- **Cancelled** = No longer active

---

## Next Steps

### Option 1: Start with Manual (No Setup)
✅ Already working! Just assign plans and track payments manually.

### Option 2: Add Razorpay (1-2 hours)
1. Read `PAYMENT_INTEGRATION.md`
2. Sign up on Razorpay
3. Copy payment code
4. Test with ₹1 transaction
5. Go live

### Option 3: Build Custom Billing
- Create invoice templates
- Add email notifications
- Build payment tracking dashboard
- Set up automatic reminders

---

## Support

For payment gateway setup help:
- Razorpay Docs: https://razorpay.com/docs/
- Stripe Docs: https://stripe.com/docs/
- Integration Guide: See `PAYMENT_INTEGRATION.md`
