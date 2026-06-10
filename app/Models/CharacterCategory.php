<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CharacterCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type', // dimension, rubric
        'is_active',
        'description',
        'min_score',
        'max_score',
    ];
}
