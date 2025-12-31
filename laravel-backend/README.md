# Laravel E-Commerce Backend API

A complete Laravel 11 REST API backend for e-commerce applications.

## Requirements

- PHP 8.2+
- Composer
- MySQL 5.7+ (via XAMPP or similar)
- Node.js (optional, for Vite)

## Quick Start

### 1. Setup Database

1. Start XAMPP and ensure MySQL is running
2. Create a new database named `ecommerce_db`

```sql
CREATE DATABASE ecommerce_db;
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce_db
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Install Dependencies

```bash
composer install
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Run Migrations

```bash
php artisan migrate
```

### 6. Seed Demo Data

```bash
php artisan db:seed
```

This creates:
- **Admin**: admin@example.com / password123
- **Customer**: customer@example.com / password123
- 6 categories and 18 products

### 7. Create Storage Link

```bash
php artisan storage:link
```

### 8. Start the Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

---

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login and get token |
| POST | `/auth/logout` | Yes | Logout (revoke token) |
| GET | `/auth/user` | Yes | Get current user |
| PUT | `/auth/profile` | Yes | Update profile |
| PUT | `/auth/password` | Yes | Change password |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | No | List all categories |
| GET | `/categories/{id}` | No | Get single category |
| POST | `/admin/categories` | Admin | Create category |
| PUT | `/admin/categories/{id}` | Admin | Update category |
| DELETE | `/admin/categories/{id}` | Admin | Delete category |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | No | List products (paginated) |
| GET | `/products/featured` | No | Get featured products |
| GET | `/products/on-sale` | No | Get products on sale |
| GET | `/products/{id}` | No | Get single product |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/{id}` | Admin | Update product |
| DELETE | `/admin/products/{id}` | Admin | Delete product |

**Product Query Parameters:**
- `search` - Search by name/description
- `category_id` - Filter by category ID
- `category` - Filter by category slug
- `min_price` - Minimum price
- `max_price` - Maximum price
- `badge` - Filter by badge (Sale, New)
- `featured` - Featured only (true/false)
- `in_stock` - In stock only (true/false)
- `sort_by` - Sort field (name, price, created_at, rating)
- `sort_order` - Sort direction (asc, desc)
- `per_page` - Items per page (max 50)

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart` | Yes | Get user's cart |
| POST | `/cart/items` | Yes | Add item to cart |
| PUT | `/cart/items/{id}` | Yes | Update item quantity |
| DELETE | `/cart/items/{id}` | Yes | Remove item from cart |
| DELETE | `/cart` | Yes | Clear entire cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders` | Yes | Get order history |
| POST | `/orders` | Yes | Place order from cart |
| GET | `/orders/{id}` | Yes | Get single order |
| POST | `/orders/{id}/cancel` | Yes | Cancel pending order |
| GET | `/admin/orders` | Admin | List all orders |
| PUT | `/admin/orders/{id}/status` | Admin | Update order status |
| GET | `/admin/orders/stats` | Admin | Get order statistics |

---

## Authentication

This API uses Laravel Sanctum for token-based authentication.

### Register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "name": "John Doe",
      "email": "customer@example.com",
      "role": "customer"
    },
    "token": "1|abc123xyz..."
  }
}
```

### Using the Token

Include the token in the Authorization header:

```bash
curl http://localhost:8000/api/v1/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Example Requests

### Get Products

```bash
curl "http://localhost:8000/api/v1/products?category=audio&sort_by=price&sort_order=asc"
```

### Add to Cart

```bash
curl -X POST http://localhost:8000/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2,
    "size": "M",
    "color": "Black"
  }'
```

### Place Order

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "United States"
    },
    "payment_method": "card"
  }'
```

---

## Connecting to Frontend

In your Vite frontend, create an API service:

```javascript
// src/services/api.js
const API_URL = 'http://localhost:8000/api/v1';

export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    return response.json();
  },

  // Auth
  login: (data) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => api.request('/auth/logout', { method: 'POST' }),
  getUser: () => api.request('/auth/user'),

  // Products
  getProducts: (params) => api.request(`/products?${new URLSearchParams(params)}`),
  getProduct: (id) => api.request(`/products/${id}`),
  getFeaturedProducts: () => api.request('/products/featured'),

  // Categories
  getCategories: () => api.request('/categories'),

  // Cart
  getCart: () => api.request('/cart'),
  addToCart: (data) => api.request('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  updateCartItem: (id, data) => api.request(`/cart/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeCartItem: (id) => api.request(`/cart/items/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => api.request('/orders'),
  placeOrder: (data) => api.request('/orders', { method: 'POST', body: JSON.stringify(data) }),
};
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Customer | customer@example.com | password123 |

---

## Project Structure

```
laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── AuthController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CartController.php
│   │   │   └── OrderController.php
│   │   └── Middleware/
│   │       └── AdminMiddleware.php
│   └── Models/
│       ├── User.php
│       ├── Category.php
│       ├── Product.php
│       ├── Cart.php
│       ├── CartItem.php
│       ├── Order.php
│       └── OrderItem.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── config/
    ├── cors.php
    └── sanctum.php
```

---

## License

MIT
