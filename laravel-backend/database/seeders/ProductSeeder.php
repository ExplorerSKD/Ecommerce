<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            // Audio
            [
                'category' => 'audio',
                'name' => 'Premium Wireless Headphones',
                'description' => 'Experience superior sound quality with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions.',
                'price' => 299.99,
                'original_price' => 399.99,
                'stock' => 50,
                'badge' => 'Sale',
                'rating' => 4.8,
                'reviews_count' => 128,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            ],
            [
                'category' => 'audio',
                'name' => 'Wireless Earbuds Pro',
                'description' => 'Compact and powerful wireless earbuds with crystal clear sound. Perfect for workouts and daily commute.',
                'price' => 149.99,
                'original_price' => null,
                'stock' => 100,
                'badge' => 'New',
                'rating' => 4.6,
                'reviews_count' => 89,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
            ],
            [
                'category' => 'audio',
                'name' => 'Portable Bluetooth Speaker',
                'description' => 'Powerful portable speaker with 360-degree sound and waterproof design. Perfect for outdoor adventures.',
                'price' => 79.99,
                'original_price' => 99.99,
                'stock' => 75,
                'badge' => 'Sale',
                'rating' => 4.4,
                'reviews_count' => 156,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
            ],

            // Watches
            [
                'category' => 'watches',
                'name' => 'Smart Watch Pro',
                'description' => 'Advanced smartwatch with health monitoring, GPS, and 5-day battery life. Stay connected on the go.',
                'price' => 599.99,
                'original_price' => null,
                'stock' => 30,
                'badge' => 'New',
                'rating' => 4.7,
                'reviews_count' => 234,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1670177257750-9b47927f68eb?w=500',
            ],
            [
                'category' => 'watches',
                'name' => 'Classic Leather Watch',
                'description' => 'Elegant timepiece with genuine leather strap and Swiss movement. Perfect for formal occasions.',
                'price' => 349.99,
                'original_price' => 449.99,
                'stock' => 25,
                'badge' => 'Sale',
                'rating' => 4.9,
                'reviews_count' => 67,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
            ],
            [
                'category' => 'watches',
                'name' => 'Sports Fitness Watch',
                'description' => 'Rugged sports watch with heart rate monitor, GPS tracking, and 50m water resistance.',
                'price' => 199.99,
                'original_price' => null,
                'stock' => 60,
                'badge' => null,
                'rating' => 4.5,
                'reviews_count' => 189,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
            ],

            // Accessories
            [
                'category' => 'accessories',
                'name' => 'Designer Sunglasses',
                'description' => 'Stylish designer sunglasses with UV protection and polarized lenses. Make a statement.',
                'price' => 199.99,
                'original_price' => 249.99,
                'stock' => 40,
                'badge' => 'Sale',
                'rating' => 4.6,
                'reviews_count' => 98,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1722842529941-825976fc14f1?w=500',
            ],
            [
                'category' => 'accessories',
                'name' => 'Premium Leather Wallet',
                'description' => 'Handcrafted genuine leather wallet with RFID protection. Slim design fits perfectly in any pocket.',
                'price' => 79.99,
                'original_price' => null,
                'stock' => 80,
                'badge' => null,
                'rating' => 4.8,
                'reviews_count' => 145,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
            ],
            [
                'category' => 'accessories',
                'name' => 'Travel Backpack',
                'description' => 'Durable travel backpack with laptop compartment and anti-theft features. Perfect for adventurers.',
                'price' => 129.99,
                'original_price' => 159.99,
                'stock' => 55,
                'badge' => 'Sale',
                'rating' => 4.7,
                'reviews_count' => 212,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
            ],

            // Footwear
            [
                'category' => 'footwear',
                'name' => 'Premium Running Shoes',
                'description' => 'Lightweight running shoes with advanced cushioning and breathable mesh upper. Run faster, longer.',
                'price' => 189.99,
                'original_price' => null,
                'stock' => 70,
                'badge' => 'New',
                'rating' => 4.8,
                'reviews_count' => 178,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            ],
            [
                'category' => 'footwear',
                'name' => 'Classic Leather Boots',
                'description' => 'Timeless leather boots with durable construction. Perfect for any season and occasion.',
                'price' => 249.99,
                'original_price' => 299.99,
                'stock' => 35,
                'badge' => 'Sale',
                'rating' => 4.6,
                'reviews_count' => 92,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500',
            ],
            [
                'category' => 'footwear',
                'name' => 'Casual Sneakers',
                'description' => 'Comfortable everyday sneakers with modern design. Step out in style.',
                'price' => 99.99,
                'original_price' => null,
                'stock' => 90,
                'badge' => null,
                'rating' => 4.4,
                'reviews_count' => 267,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500',
            ],

            // Tech
            [
                'category' => 'tech',
                'name' => 'Wireless Charging Pad',
                'description' => 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek and compact design.',
                'price' => 49.99,
                'original_price' => 69.99,
                'stock' => 120,
                'badge' => 'Sale',
                'rating' => 4.5,
                'reviews_count' => 334,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=500',
            ],
            [
                'category' => 'tech',
                'name' => 'Mechanical Keyboard',
                'description' => 'RGB mechanical keyboard with Cherry MX switches. Built for gamers and professionals.',
                'price' => 159.99,
                'original_price' => null,
                'stock' => 45,
                'badge' => 'New',
                'rating' => 4.9,
                'reviews_count' => 156,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
            ],
            [
                'category' => 'tech',
                'name' => 'Portable Power Bank',
                'description' => '20000mAh power bank with fast charging and multiple ports. Never run out of battery.',
                'price' => 59.99,
                'original_price' => 79.99,
                'stock' => 150,
                'badge' => 'Sale',
                'rating' => 4.6,
                'reviews_count' => 423,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
            ],

            // Clothing
            [
                'category' => 'clothing',
                'name' => 'Premium Cotton T-Shirt',
                'description' => 'Ultra-soft premium cotton t-shirt with modern fit. Available in multiple colors.',
                'price' => 39.99,
                'original_price' => null,
                'stock' => 200,
                'badge' => null,
                'rating' => 4.7,
                'reviews_count' => 567,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            ],
            [
                'category' => 'clothing',
                'name' => 'Denim Jacket',
                'description' => 'Classic denim jacket with vintage wash. A wardrobe essential for any season.',
                'price' => 129.99,
                'original_price' => 169.99,
                'stock' => 40,
                'badge' => 'Sale',
                'rating' => 4.8,
                'reviews_count' => 134,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500',
            ],
            [
                'category' => 'clothing',
                'name' => 'Performance Hoodie',
                'description' => 'Athletic hoodie with moisture-wicking fabric and comfortable fit. Perfect for workouts.',
                'price' => 79.99,
                'original_price' => null,
                'stock' => 85,
                'badge' => 'New',
                'rating' => 4.5,
                'reviews_count' => 89,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
            ],
        ];

        foreach ($products as $productData) {
            $category = Category::where('slug', $productData['category'])->first();
            
            if ($category) {
                unset($productData['category']);
                $productData['category_id'] = $category->id;
                Product::create($productData);
            }
        }
    }
}
