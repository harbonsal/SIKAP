<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzClassTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_class_id',
        'semester',
        'juz_targets',
    ];

    protected $casts = [
        'juz_targets' => 'array',
        'semester' => 'integer',
    ];

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }
}
