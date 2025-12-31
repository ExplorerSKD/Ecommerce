<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'first_name', 'last_name', 'phone',
        'address_line_1', 'address_line_2', 'city', 'state',
        'postal_code', 'country', 'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getFullAddressAttribute(): string
    {
        $parts = [$this->address_line_1];
        if ($this->address_line_2) $parts[] = $this->address_line_2;
        $parts[] = "{$this->city}, {$this->state} {$this->postal_code}";
        $parts[] = $this->country;
        return implode(', ', $parts);
    }

    public function setAsDefault(): void
    {
        // Remove default from other addresses
        self::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        $this->update(['is_default' => true]);
    }
}
