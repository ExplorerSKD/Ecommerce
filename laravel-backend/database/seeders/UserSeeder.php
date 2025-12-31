<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'phone' => '+1234567890',
            'address' => '123 Admin Street, Tech City, TC 12345',
        ]);

        // Create demo customer
        User::create([
            'name' => 'John Doe',
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'phone' => '+1987654321',
            'address' => '456 Customer Lane, Shop Town, ST 67890',
        ]);

        // Create additional test customers
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'phone' => '+1555666777',
            'address' => '789 Oak Avenue, Commerce City, CC 11111',
        ]);
    }
}
