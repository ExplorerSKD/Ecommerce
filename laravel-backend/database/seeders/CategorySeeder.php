<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Footwear',
                'slug' => 'footwear',
                'description' => 'Premium quality shoes, sneakers, and boots for all occasions.',
            ],
            [
                'name' => 'Watches',
                'slug' => 'watches',
                'description' => 'Luxury and smart watches from top brands.',
            ],
            [
                'name' => 'Audio',
                'slug' => 'audio',
                'description' => 'High-quality headphones, earbuds, and speakers.',
            ],
            [
                'name' => 'Accessories',
                'slug' => 'accessories',
                'description' => 'Sunglasses, bags, wallets, and more.',
            ],
            [
                'name' => 'Tech',
                'slug' => 'tech',
                'description' => 'Latest gadgets and technology products.',
            ],
            [
                'name' => 'Clothing',
                'slug' => 'clothing',
                'description' => 'Trendy apparel for men and women.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
