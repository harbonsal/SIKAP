<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisionQuestion extends Model
{
    use HasFactory;

    protected $fillable = ['number', 'category', 'aspect'];

    public function rubrics()
    {
        return $this->hasMany(SupervisionRubric::class);
    }
}
