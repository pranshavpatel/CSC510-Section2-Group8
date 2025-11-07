# VibeDish Demo Script 🎵🍽️

## Table of Contents
1. [Setup & Launch](#setup--launch)
2. [User Journey: Customer](#user-journey-customer)
3. [User Journey: Restaurant Owner](#user-journey-restaurant-owner)
4. [API Testing](#api-testing)
5. [Troubleshooting](#troubleshooting)

---

## Setup & Launch

### Prerequisites
- Python 3.11+
- Node.js 18+
- Spotify Account
- Supabase Account (or use test credentials)

### Backend Setup
```bash
cd Project

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SPOTIFY_CLIENT_ID
# - SPOTIFY_CLIENT_SECRET
# - GROQ_API_KEY

# Start backend server
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**

### Frontend Setup
```bash
cd Project/client

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with:
# - NEXT_PUBLIC_API_URL=http://localhost:8000
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## User Journey: Customer

### 1. Sign Up / Login
**Navigate to:** http://localhost:3000

**Steps:**
1. Click "Sign Up" button
2. Enter email and password
3. Verify email (check inbox)
4. Login with credentials

**Expected Result:** Redirected to home page with personalized greeting

---

### 2. Connect Spotify Account
**Navigate to:** Profile → Settings → Spotify Integration

**Steps:**
1. Click "Connect Spotify"
2. Authorize VibeDish to access your Spotify data
3. Grant permissions for:
   - Recently played tracks
   - Currently playing track
4. Confirm connection

**Expected Result:** 
- Green checkmark showing "Spotify Connected"
- Your recent tracks displayed

**API Endpoint:**
```bash
GET /api/spotify/login
GET /api/spotify/callback?code=...&state=...
GET /api/spotify/status
```

---

### 3. Get Mood-Based Recommendations
**Navigate to:** Home → "Get Recommendations"

**Steps:**
1. Click "Analyze My Mood" button
2. System analyzes your recent Spotify tracks
3. AI determines your current mood (happy, energetic, calm, sad, etc.)
4. View personalized meal recommendations

**Expected Result:**
- Mood analysis displayed (e.g., "You're feeling Energetic! 🎉")
- 5-10 meal recommendations matching your mood
- Each meal shows:
  - Name, description, price
  - Restaurant name
  - Surplus discount (if applicable)
  - Mood match score

**API Endpoint:**
```bash
POST /api/recommendations
{
  "user_id": "123",
  "use_spotify": true
}
```

**Sample Response:**
```json
{
  "mood": "energetic",
  "mood_distribution": {
    "energetic": 0.6,
    "happy": 0.3,
    "calm": 0.1
  },
  "recommendations": [
    {
      "meal_id": "456",
      "name": "Spicy Thai Curry",
      "restaurant": "Bangkok Street",
      "price": 12.99,
      "surplus_price": 8.99,
      "match_score": 0.92
    }
  ]
}
```

---

### 4. Browse Surplus Meals
**Navigate to:** Catalog → "Surplus Deals"

**Steps:**
1. View all available surplus meals
2. Filter by:
   - Cuisine type
   - Price range
   - Distance
   - Discount percentage
3. Sort by discount or distance

**Expected Result:**
- Grid of surplus meal cards
- Each showing original price vs. discounted price
- Savings percentage highlighted
- "Limited quantity" badges

**API Endpoint:**
```bash
GET /api/catalog/surplus?cuisine=italian&max_price=15
```

---

### 5. Add Items to Cart
**Steps:**
1. Click on a meal card
2. View detailed meal information
3. Select quantity
4. Click "Add to Cart"
5. Cart icon updates with item count

**Expected Result:**
- Success notification
- Cart badge shows total items
- Meal added to cart with selected quantity

**API Endpoint:**
```bash
POST /api/cart/add
{
  "meal_id": "456",
  "quantity": 2
}
```

---

### 6. Review Cart & Checkout
**Navigate to:** Cart icon → View Cart

**Steps:**
1. Review all items in cart
2. Update quantities or remove items
3. View order summary:
   - Subtotal
   - Savings from surplus
   - Tax
   - Total
4. Click "Proceed to Checkout"

**Expected Result:**
- Itemized cart display
- Real-time price calculations
- Sustainability metrics (e.g., "You're saving 2.5 lbs of food waste!")

**API Endpoint:**
```bash
GET /api/cart
PUT /api/cart/update
DELETE /api/cart/remove/{meal_id}
```

---

### 7. Place Order
**Steps:**
1. Enter/confirm delivery address
2. Select delivery time
3. Add special instructions (optional)
4. Review order details
5. Click "Place Order"

**Expected Result:**
- Order confirmation page
- Order ID and estimated delivery time
- Email confirmation sent
- Redirect to order tracking

**API Endpoint:**
```bash
POST /api/orders/create
{
  "address_id": "789",
  "delivery_time": "2025-02-01T18:30:00",
  "special_instructions": "Ring doorbell"
}
```

---

### 8. Track Order
**Navigate to:** Orders → Active Orders

**Steps:**
1. View order status in real-time
2. Track stages:
   - Order Placed
   - Restaurant Preparing
   - Out for Delivery
   - Delivered
3. View estimated delivery time
4. Contact restaurant if needed

**Expected Result:**
- Live order status updates
- Progress bar showing current stage
- Map showing delivery location (if available)

**API Endpoint:**
```bash
GET /api/orders/{order_id}
GET /api/orders/user/{user_id}
```

---

### 9. View Order History
**Navigate to:** Profile → Order History

**Steps:**
1. Browse past orders
2. Filter by date range
3. View order details
4. Reorder previous meals
5. View sustainability impact:
   - Total meals ordered
   - Food waste prevented
   - Carbon footprint saved

**Expected Result:**
- List of all past orders
- Sustainability dashboard
- Quick reorder buttons

---

## User Journey: Restaurant Owner

### 1. Owner Login
**Navigate to:** http://localhost:3000/owner/login

**Steps:**
1. Login with owner credentials
2. Access owner dashboard

**Expected Result:** Owner dashboard with restaurant management tools

---

### 2. View Restaurant Dashboard
**Navigate to:** Owner Dashboard

**Features:**
- Today's orders
- Revenue statistics
- Surplus meal performance
- Customer ratings
- Inventory alerts

**API Endpoint:**
```bash
GET /api/owner/dashboard
```

---

### 3. Manage Meals
**Navigate to:** Dashboard → Meals

**Add New Meal:**
```bash
POST /api/owner/meals
{
  "name": "Margherita Pizza",
  "description": "Classic Italian pizza",
  "price": 14.99,
  "cuisine": "italian",
  "tags": ["vegetarian", "comfort"],
  "image_url": "https://..."
}
```

**Update Meal:**
```bash
PUT /api/owner/meals/{meal_id}
{
  "price": 12.99,
  "is_available": true
}
```

**Delete Meal:**
```bash
DELETE /api/owner/meals/{meal_id}
```

---

### 4. Create Surplus Listings
**Navigate to:** Dashboard → Surplus Management

**Steps:**
1. Select meal to mark as surplus
2. Set discounted price
3. Set quantity available
4. Set expiration time
5. Publish surplus listing

**Expected Result:**
- Meal appears in customer surplus catalog
- Discount badge displayed
- Countdown timer shown

**API Endpoint:**
```bash
POST /api/owner/meals/{meal_id}/surplus
{
  "surplus_quantity": 10,
  "surplus_price": 8.99,
  "expires_at": "2025-02-01T22:00:00"
}
```

---

### 5. Manage Orders
**Navigate to:** Dashboard → Orders

**Steps:**
1. View incoming orders
2. Accept/reject orders
3. Update order status
4. Mark as ready for pickup/delivery

**API Endpoint:**
```bash
PUT /api/owner/orders/{order_id}/status
{
  "status": "preparing"
}
```

---

### 6. View Analytics
**Navigate to:** Dashboard → Analytics

**Metrics:**
- Daily/weekly/monthly revenue
- Most popular meals
- Surplus meal performance
- Customer retention rate
- Food waste reduction impact

---

## API Testing

### Using Swagger UI
**Navigate to:** http://localhost:8000/docs

**Test Endpoints:**
1. Expand any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. View response

### Using cURL

**Get Recommendations:**
```bash
curl -X POST http://localhost:8000/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "123",
    "use_spotify": true
  }'
```

**Browse Catalog:**
```bash
curl http://localhost:8000/api/catalog/meals?cuisine=italian&surplus_only=true
```

**Add to Cart:**
```bash
curl -X POST http://localhost:8000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "meal_id": "456",
    "quantity": 2
  }'
```

---

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check DATABASE_URL in .env
# Verify Supabase project is active
# Test connection:
python -c "from database.database import database; print('Connected!')"
```

**Spotify API Error:**
```bash
# Verify credentials in .env
# Check redirect URI matches Spotify app settings
# Test Spotify connection:
curl http://localhost:8000/api/spotify/status
```

**Groq API Error:**
```bash
# Verify GROQ_API_KEY in .env
# Check API quota/limits
# Test with sample request
```

### Frontend Issues

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

**API Connection Error:**
```bash
# Verify NEXT_PUBLIC_API_URL in .env
# Check backend is running
# Test API endpoint:
curl http://localhost:8000/health
```

### Common Issues

**"No recommendations found":**
- Ensure Spotify is connected
- Play some music on Spotify
- Wait a few minutes for data to sync
- Try manual mood selection

**"Cart is empty":**
- Check if meals are in stock
- Verify user is logged in
- Clear browser cache

**"Order failed":**
- Verify delivery address is complete
- Check payment method (if applicable)
- Ensure restaurant is accepting orders

---

## Demo Tips

### For Presentations

1. **Prepare Test Data:**
   - Create test user accounts
   - Add sample restaurants and meals
   - Create surplus listings
   - Have Spotify playing beforehand

2. **Demo Flow:**
   - Start with mood analysis (most impressive)
   - Show surplus deals (sustainability angle)
   - Complete full order flow
   - Switch to owner dashboard
   - Show analytics and impact metrics

3. **Highlight Features:**
   - AI-powered recommendations
   - Real-time updates
   - Sustainability metrics
   - Responsive design
   - API documentation

4. **Have Backup:**
   - Screenshots of key features
   - Pre-recorded video demo
   - Sample API responses

---

## Quick Demo Script (5 minutes)

1. **[0:00-1:00]** Login → Connect Spotify → Show recent tracks
2. **[1:00-2:00]** Click "Get Recommendations" → Show mood analysis → Display matched meals
3. **[2:00-3:00]** Browse surplus deals → Add items to cart → Show savings
4. **[3:00-4:00]** Checkout → Place order → Show confirmation
5. **[4:00-5:00]** Switch to owner dashboard → Show analytics → Highlight sustainability impact

---

## Support

**Issues?** Open a ticket: https://github.com/pranshavpatel/CSC510-Section2-Group8/issues

**Questions?** Join Discord: https://discord.gg/u73Dqj5dsV

**Documentation:** http://localhost:8000/docs

---

*Happy demoing! 🎵🍽️🌱*
