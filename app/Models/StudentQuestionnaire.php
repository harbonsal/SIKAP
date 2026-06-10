<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentQuestionnaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'order',
        'is_active',
        'type', // boolean, rating, scale_1_3
        'options', // json
        'aspect', // A, B, C, D, E, F, G
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
        'options' => 'array',
    ];
}
