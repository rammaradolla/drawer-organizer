# Backend API Documentation

## Authentication & Authorization

### JWT Authentication
All protected routes require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control (RBAC)
- **`operations`** role: Access to fulfillment dashboard and order management
- **`customer`** role: Access to own orders only
- **`admin`** role: Full access to all features

## Fulfillment API Routes

### Base URL
```
/api/fulfillment
```

### Authentication Required
All fulfillment routes require:
1. Valid JWT token
2. `operations` role

---

## Endpoints

### 1. Get All Orders
**GET** `/api/fulfillment/orders`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `in_progress`, `fulfilled`, `blocked`, `cancelled`, `all`)
- `search` (optional): Search in user email, order ID, or tracking number
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (default: `created_at`)
- `sortOrder` (optional): Sort direction (`asc` or `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_id",
      "user_id": "user_id",
      "cart_json": [...],
      "total_price": 99.99,
      "status": "pending",
      "tracking_number": "1Z999AA1234567890",
      "tracking_carrier": "ups",
      "notes": "Customer requested rush delivery",
      "blocker_reason": null,
      "stripe_checkout_id": "cs_xxx",
      "created_at": "2024-01-15T10:30:00Z",
      "last_updated_at": "2024-01-15T11:00:00Z",
      "last_updated_by": "user_id",
      "user": {
        "id": "user_id",
        "email": "customer@example.com",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 2. Get Single Order
**GET** `/api/fulfillment/orders/:orderId`

**Response:**
```json
{
  "success": true,
  "order": {
    // Same structure as above
  }
}
```

### 3. Update Order
**PATCH** `/api/fulfillment/orders/:orderId`

**Request Body:**
```json
{
  "status": "in_progress",
  "tracking_number": "1Z999AA1234567890",
  "tracking_carrier": "ups",
  "notes": "Order is being processed",
  "blocker_reason": "Waiting for wood material"
}
```

**Valid Status Values:**
- `pending`: Order received, not yet processed
- `in_progress`: Order is being manufactured/processed
- `fulfilled`: Order completed and shipped
- `blocked`: Order blocked due to issues
- `cancelled`: Order cancelled

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "order": {
    // Updated order data
  }
}
```

### 4. Get Order Audit Log
**GET** `/api/fulfillment/orders/:orderId/audit`

**Response:**
```json
{
  "success": true,
  "auditLog": [
    {
      "id": "audit_id",
      "order_id": "order_id",
      "action": "status_update",
      "old_values": "{}",
      "new_values": "{\"status\":\"in_progress\"}",
      "updated_by": "user_id",
      "notes": "Order status changed to in_progress by operations@company.com",
      "created_at": "2024-01-15T11:00:00Z",
      "users": {
        "id": "user_id",
        "email": "operations@company.com",
        "name": "Operations User"
      }
    }
  ]
}
```

### 5. Bulk Update Orders
**PATCH** `/api/fulfillment/orders/bulk`

**Request Body:**
```json
{
  "orderIds": ["order_id_1", "order_id_2", "order_id_3"],
  "updates": {
    "status": "in_progress",
    "notes": "Bulk update - all orders moved to production"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Updated 3 orders successfully",
  "updatedCount": 3
}
```

### 6. Get Fulfillment Statistics
**GET** `/api/fulfillment/stats`

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "pending": 25,
    "in_progress": 45,
    "fulfilled": 70,
    "blocked": 5,
    "cancelled": 5,
    "fulfillment_rate": "46.7"
  },
  "period": "30 days"
}
```

---

## Error Responses

### Authentication Errors
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. operations role required."
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: pending, in_progress, fulfilled, blocked, cancelled"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Failed to fetch orders",
  "error": "Database connection error"
}
```

---

## Database Schema Requirements

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  cart_json JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'fulfilled', 'blocked', 'cancelled')),
  tracking_number TEXT,
  tracking_carrier TEXT,
  notes TEXT,
  blocker_reason TEXT,
  stripe_checkout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_by UUID REFERENCES users(id)
);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'operations', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Order Audit Log Table
```sql
CREATE TABLE order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Environment Variables Required

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

---

## Usage Examples

### Frontend Integration

```javascript
// Get orders with filters
const response = await fetch('/api/fulfillment/orders?status=pending&search=john&page=1', {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});

// Update order status
const updateResponse = await fetch(`/api/fulfillment/orders/${orderId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'in_progress',
    tracking_number: '1Z999AA1234567890',
    tracking_carrier: 'ups',
    notes: 'Order is being processed'
  })
});
```

### cURL Examples

```bash
# Get all pending orders
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/fulfillment/orders?status=pending"

# Update order status
curl -X PATCH \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "fulfilled", "tracking_number": "1Z999AA1234567890"}' \
     "http://localhost:3000/api/fulfillment/orders/ORDER_ID"

# Get fulfillment statistics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/fulfillment/stats?period=7"
``` 