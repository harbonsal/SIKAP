<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisionCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'min_score',
        'max_score',
        'color_class',
        'description',
    ];

    /**
     * Get the category for a given score
     */
    public static function getCategoryForScore($score)
    {
        return self::where('min_score', '<=', $score)
            ->where('max_score', '>=', $score)
            ->first();
    }
}
