# Modern E-Commerce Website

A full-stack e-commerce application with a React + TypeScript frontend and Laravel 11 REST API backend, featuring Razorpay payment gateway, Shiprocket shipping integration, and a comprehensive admin panel.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **Motion** for animations

### Backend
- **Laravel 11** REST API
- **MySQL** database
- **Laravel Sanctum** for authentication
- **Razorpay** payment gateway integration
- **Shiprocket** shipping integration
- **Role-based access** (Admin/Customer)

---

## Features

### Customer Features
- ✅ User authentication (Login/Register)
- ✅ Password reset via email
- ✅ Product browsing with filters & search
- ✅ Shopping cart with quantity management
- ✅ **Buy Now** for instant checkout
- ✅ Wishlist functionality
- ✅ Multiple Payment Options:
  - **Razorpay** (Cards, UPI, Net Banking)
  - **Cash on Delivery (COD)** with fee support
- ✅ Order history & shipment tracking
- ✅ Address management
- ✅ Product reviews & ratings
- ✅ FAQ section
- ✅ Product collections
- ✅ Support ticket system

### Admin Features
- ✅ Dashboard with analytics & reporting
- ✅ Product management with **Image Upload**
- ✅ **Nested Categories (Subcategories)** management
- ✅ **Homepage Category Control** (Limit 4)
- ✅ Collection management with **Image Upload**
- ✅ Order management & status updates
- ✅ Shipment creation via **Shiprocket**
- ✅ Review moderation & **Admin Review Creation**
- ✅ Coupon management
- ✅ **Promo Banner Management**
- ✅ FAQ management
- ✅ Support ticket handling
- ✅ User management
- ✅ Global settings (Sensitive keys moved to .env for security)
- ✅ **Mobile-responsive** admin panel with card views

---

## Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.2+
- Composer
- MySQL (via XAMPP or MySQL Server)

---

## 1. Backend Setup (Laravel)

```bash
# Navigate to backend folder
cd laravel-backend

# Copy environment file
cp .env.example .env
```

### Configure Database
Edit `.env` file with your MySQL credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce_db
DB_USERNAME=root
DB_PASSWORD=
```

### Create Database
Create a database named `ecommerce_db` in MySQL/phpMyAdmin.

### Install & Run
```bash
# Install dependencies
composer install

# Install Razorpay SDK
composer require razorpay/razorpay

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed demo data
php artisan db:seed

# Create storage link
php artisan storage:link

# Start Laravel server
php artisan serve
```

The API will be available at: **http://127.0.0.1:8000**

---

## 2. Frontend Setup (React)

Open a **new terminal** and run:

```bash
# Navigate to project root (not laravel-backend)
cd Modernecommercewebsite-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 3. Configuration

### Razorpay Setup
1. Create an account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Get your API keys from Settings > API Keys
3. Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Shiprocket Setup
1. Create an account at [Shiprocket](https://app.shiprocket.in)
2. Add to `.env`:
```env
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
SHIPROCKET_PICKUP_LOCATION=Primary
SHIPROCKET_PICKUP_PINCODE=110001
SHIPROCKET_CHANNEL_ID=
```

### SMTP Setup (for Password Reset)
For Gmail, use an [App Password](https://myaccount.google.com/apppasswords):
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourstore.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Running Both Servers

You need **two terminals** running simultaneously:

| Terminal 1 (Backend) | Terminal 2 (Frontend) |
|---------------------|----------------------|
| `cd laravel-backend` | `cd Modernecommercewebsite-main` |
| `php artisan serve` | `npm run dev` |
| http://127.0.0.1:8000 | http://localhost:5173 |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | password123 |
| **Customer** | customer@example.com | password123 |

---

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/v1`

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products with filters |
| GET | `/products/{id}` | Get product details |
| GET | `/categories` | List categories |
| GET | `/collections` | List product collections |
| GET | `/faqs` | Get FAQs |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | View cart |
| POST | `/cart/items` | Add to cart |
| GET | `/orders` | Order history |
| POST | `/orders` | Place order |
| GET | `/wishlist` | View wishlist |
| POST | `/razorpay/create-order` | Create payment order |
| POST | `/razorpay/verify-payment` | Verify payment |
| GET | `/shipping/track/{orderId}` | Track shipment |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Dashboard statistics |
| POST | `/admin/products` | Create product |
| PUT | `/admin/products/{id}` | Update product |
| DELETE | `/admin/products/{id}` | Delete product |
| GET | `/admin/reviews` | List reviews |
| PUT | `/admin/reviews/{id}/status` | Update review status |
| GET | `/admin/coupons` | List coupons |
| POST | `/admin/coupons` | Create coupon |
| GET | `/admin/support` | List support tickets |
| POST | `/admin/support/{id}/reply` | Reply to ticket |
| GET | `/admin/users` | List customers |
| POST | `/admin/shipping/create-shipment` | Create shipment |

---

## Project Structure

```
Modernecommercewebsite-main/
├── src/
│   └── app/
│       ├── components/          # Reusable UI components
│       │   └── admin/           # Admin-specific components
│       ├── contexts/            # React contexts (Auth, Cart)
│       ├── pages/               # Page components
│       │   └── admin/           # Admin panel pages
│       └── services/            # API service
├── laravel-backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/   # API controllers
│   │   ├── Models/                     # Eloquent models
│   │   ├── Services/                   # Business services
│   │   └── Http/Middleware/            # Custom middleware
│   ├── database/
│   │   ├── migrations/                 # Database schema
│   │   └── seeders/                    # Demo data
│   ├── resources/views/emails/         # Email templates
│   └── routes/api.php                  # API routes
└── README.md
```

---

## Admin Panel

Access the admin panel at: **http://localhost:5173/admin**

### Admin Pages
- **Dashboard** - Overview with key metrics
- **Products** - Product management
- **Categories** - Category organization
- **Orders** - Order processing & status updates
- **Reviews** - Review moderation (approve/reject)
- **Coupons** - Discount code management
- **FAQs** - Frequently asked questions
- **Collections** - Product collection curation
- **Support** - Customer ticket handling
- **Users** - Customer management
- **Settings** - Razorpay & Shiprocket configuration

---

## Mobile Responsiveness

The admin panel is fully responsive and optimized for mobile devices:

- **Dashboard** - Responsive stat cards and charts
- **Products/Reviews/Orders** - Table → Card view on mobile
- **Support/Users** - Stacked panels with back navigation
- **Settings** - Horizontal scrollable tabs on mobile

---

## Troubleshooting

### CORS Error
Make sure the Laravel backend is running and CORS is configured in `laravel-backend/config/cors.php`.

### Database Connection Error
1. Ensure MySQL is running (via XAMPP or MySQL Server)
2. Check `.env` database credentials
3. Create the `ecommerce_db` database manually if needed

### Products Not Loading
1. Verify backend is running at http://127.0.0.1:8000
2. Check browser console for errors
3. Run `php artisan db:seed` if database is empty

### Payment Issues
1. Verify Razorpay keys are correct in `.env`
2. For testing, use [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
3. Check Laravel logs: `storage/logs/laravel.log`

### Email Not Sending
1. Verify SMTP credentials in `.env`
2. For Gmail, ensure "Less secure apps" or App Password is enabled
3. Run `php artisan config:clear` after changing `.env`

---

## License

MIT