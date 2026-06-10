<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DayLearningHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'day_id',
        'learning_hour_id',
        'is_active',
    ];

    public function day()
    {
        return $this->belongsTo(Day::class);
    }

    public function learningHour()
    {
        return $this->belongsTo(LearningHour::class);
    }
}
