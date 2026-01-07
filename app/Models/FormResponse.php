<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormResponse extends Model
{
    protected $fillable = [
        'user_id',
        'form_id',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
