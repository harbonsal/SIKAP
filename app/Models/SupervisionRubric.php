<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisionRubric extends Model
{
    use HasFactory;

    protected $fillable = ['supervision_question_id', 'score', 'description'];

    public function question()
    {
        return $this->belongsTo(SupervisionQuestion::class, 'supervision_question_id');
    }
}
