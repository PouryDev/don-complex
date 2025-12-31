<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hall extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'capacity',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function sessionTemplates(): HasMany
    {
        return $this->hasMany(SessionTemplate::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }
}
