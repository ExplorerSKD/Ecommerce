<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\WishlistController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\CouponController;
use App\Http\Controllers\Api\V1\FaqController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\SupportController;
use App\Http\Controllers\Api\V1\RazorpayController;
use App\Http\Controllers\Api\V1\ShiprocketController;
use App\Http\Controllers\Api\V1\BannerController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// API Version 1
Route::prefix('v1')->group(function () {

    // =========== PUBLIC ROUTES ===========

    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });

    // Categories (public)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/home', [CategoryController::class, 'home']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);

    // Products (public)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/on-sale', [ProductController::class, 'onSale']);
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/products/{product}/reviews', [ReviewController::class, 'productReviews']);

    // Collections (public)
    Route::get('/collections', [CollectionController::class, 'index']);
    Route::get('/collections/{slug}', [CollectionController::class, 'show']);

    // FAQs (public)
    Route::get('/faqs', [FaqController::class, 'index']);

    // Banners (public)
    Route::get('/banners', [BannerController::class, 'index']);

    // Shiprocket - Check serviceability (public)
    Route::get('/shipping/check', [ShiprocketController::class, 'checkServiceability']);
    Route::get('/shipping/couriers', [ShiprocketController::class, 'getAvailableCouriers']);

    // Razorpay webhook (public, but verified with signature)
    Route::post('/razorpay/webhook', [RazorpayController::class, 'handleWebhook']);


    // =========== PROTECTED ROUTES (Authenticated Users) ===========

    Route::middleware('auth:sanctum')->group(function () {

        // Authentication
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/user', [AuthController::class, 'user']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::put('/password', [AuthController::class, 'changePassword']);
        });

        // Cart
        Route::prefix('cart')->group(function () {
            Route::get('/', [CartController::class, 'index']);
            Route::post('/items', [CartController::class, 'addItem']);
            Route::put('/items/{item}', [CartController::class, 'updateItem']);
            Route::delete('/items/{item}', [CartController::class, 'removeItem']);
            Route::delete('/', [CartController::class, 'clear']);
        });

        // Orders (Customer)
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index']);
            Route::post('/', [OrderController::class, 'store']);
            Route::get('/{order}', [OrderController::class, 'show']);
            Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
        });

        // Wishlist
        Route::prefix('wishlist')->group(function () {
            Route::get('/', [WishlistController::class, 'index']);
            Route::post('/', [WishlistController::class, 'store']);
            Route::post('/toggle', [WishlistController::class, 'toggle']);
            Route::get('/check/{productId}', [WishlistController::class, 'check']);
            Route::delete('/{productId}', [WishlistController::class, 'destroy']);
        });

        // Reviews
        Route::prefix('reviews')->group(function () {
            Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
            Route::post('/', [ReviewController::class, 'store']);
        });

        // Coupons (apply)
        Route::post('/coupons/apply', [CouponController::class, 'apply']);

        // Addresses
        Route::prefix('addresses')->group(function () {
            Route::get('/', [AddressController::class, 'index']);
            Route::post('/', [AddressController::class, 'store']);
            Route::put('/{id}', [AddressController::class, 'update']);
            Route::delete('/{id}', [AddressController::class, 'destroy']);
            Route::post('/{id}/default', [AddressController::class, 'setDefault']);
        });

        // Support Tickets
        Route::prefix('support')->group(function () {
            Route::get('/', [SupportController::class, 'index']);
            Route::post('/', [SupportController::class, 'store']);
            Route::get('/{id}', [SupportController::class, 'show']);
            Route::post('/{id}/reply', [SupportController::class, 'reply']);
            Route::post('/{id}/close', [SupportController::class, 'close']);
        });

        // Payment Methods
        Route::prefix('payment-methods')->group(function () {
            Route::get('/', [PaymentMethodController::class, 'index']);
            Route::post('/', [PaymentMethodController::class, 'store']);
            Route::put('/{paymentMethod}', [PaymentMethodController::class, 'update']);
            Route::delete('/{paymentMethod}', [PaymentMethodController::class, 'destroy']);
            Route::post('/{paymentMethod}/default', [PaymentMethodController::class, 'setDefault']);
        });

        // Razorpay Payment
        Route::prefix('razorpay')->group(function () {
            Route::post('/create-order', [RazorpayController::class, 'createOrder']);
            Route::post('/verify-payment', [RazorpayController::class, 'verifyPayment']);
            Route::get('/payment-status/{orderId}', [RazorpayController::class, 'getPaymentStatus']);
        });

        // Shiprocket - Customer tracking
        Route::get('/shipping/track/{orderId}', [ShiprocketController::class, 'trackByOrderId']);


        // =========== ADMIN ROUTES ===========

        Route::middleware('admin')->prefix('admin')->group(function () {

            // Dashboard Stats
            Route::get('/dashboard/stats', [OrderController::class, 'stats']);

            // Categories (Admin)
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

            // Products (Admin)
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{product}', [ProductController::class, 'update']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);
            Route::post('/products/{product}/image', [ProductController::class, 'uploadImage']);

            // Orders (Admin)
            Route::get('/orders', [OrderController::class, 'adminIndex']);
            Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::get('/orders/stats', [OrderController::class, 'stats']);

            // Reviews (Admin)
            Route::get('/reviews', [ReviewController::class, 'adminIndex']);
            Route::post('/reviews', [ReviewController::class, 'adminStore']);
            Route::put('/reviews/{id}/status', [ReviewController::class, 'updateStatus']);
            Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

            // Coupons (Admin)
            Route::get('/coupons', [CouponController::class, 'index']);
            Route::post('/coupons', [CouponController::class, 'store']);
            Route::put('/coupons/{id}', [CouponController::class, 'update']);
            Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);

            // FAQs (Admin)
            Route::get('/faqs', [FaqController::class, 'adminIndex']);
            Route::post('/faqs', [FaqController::class, 'store']);
            Route::put('/faqs/{id}', [FaqController::class, 'update']);
            Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);

            // Banners (Admin)
            Route::get('/banners', [BannerController::class, 'adminIndex']);
            Route::post('/banners', [BannerController::class, 'store']);
            Route::put('/banners/{id}', [BannerController::class, 'update']);
            Route::delete('/banners/{id}', [BannerController::class, 'destroy']);
            Route::put('/banners/{id}/toggle', [BannerController::class, 'toggleStatus']);
            Route::post('/banners/reorder', [BannerController::class, 'reorder']);

            // Collections (Admin)
            Route::get('/collections', [CollectionController::class, 'adminIndex']);
            Route::post('/collections', [CollectionController::class, 'store']);
            Route::put('/collections/{id}', [CollectionController::class, 'update']);
            Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);
            Route::post('/collections/{id}/products', [CollectionController::class, 'addProducts']);
            Route::delete('/collections/{id}/products', [CollectionController::class, 'removeProducts']);

            // Support Tickets (Admin)
            Route::get('/support', [SupportController::class, 'adminIndex']);
            Route::get('/support/{id}', [SupportController::class, 'adminShow']);
            Route::post('/support/{id}/reply', [SupportController::class, 'adminReply']);
            Route::put('/support/{id}/status', [SupportController::class, 'updateStatus']);

            // Users (Admin)
            Route::get('/users', function () {
                return response()->json([
                    'success' => true,
                    'data' => \App\Models\User::where('role', 'customer')
                        ->withCount('orders')
                        ->latest()
                        ->paginate(20),
                ]);
            });
            Route::get('/users/{id}', function ($id) {
                $user = \App\Models\User::with(['orders' => function ($q) {
                    $q->latest()->limit(10);
                }, 'addresses'])->findOrFail($id);
                return response()->json([
                    'success' => true,
                    'data' => $user,
                ]);
            });
            Route::put('/users/{id}/status', function (\Illuminate\Http\Request $request, $id) {
                $user = \App\Models\User::findOrFail($id);
                $user->update(['is_blocked' => $request->is_blocked]);
                return response()->json([
                    'success' => true,
                    'message' => $request->is_blocked ? 'User blocked' : 'User unblocked',
                ]);
            });

            // Shiprocket (Admin)
            Route::prefix('shipping')->group(function () {
                Route::post('/create-shipment', [ShiprocketController::class, 'createShipment']);
                Route::post('/generate-awb', [ShiprocketController::class, 'generateAwb']);
                Route::post('/schedule-pickup', [ShiprocketController::class, 'schedulePickup']);
                Route::post('/cancel', [ShiprocketController::class, 'cancelShipment']);
                Route::get('/track/awb/{awb}', [ShiprocketController::class, 'trackByAwb']);
            });
        });
    });
});
