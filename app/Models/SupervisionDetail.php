<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisionDetail extends Model
{
    use HasFactory;

    protected $fillable = ['supervision_id', 'supervision_question_id', 'score', 'notes', 'checked_items'];

    protected $casts = [
        'checked_items' => 'array',
    ];

    public function supervision()
    {
        return $this->belongsTo(Supervision::class);
    }

    public function question()
    {
        return $this->belongsTo(SupervisionQuestion::class, 'supervision_question_id');
    }
}
