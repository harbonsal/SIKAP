<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mapel extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'ar_name', 'nama_arab', 'code', 'description'];

    protected static function booted()
    {
        static::creating(function ($mapel) {
            if (empty($mapel->code)) {
                $mapel->code = 'CODE_' . strtoupper(uniqid());
            }
        });
    }

    public function activeSubjects()
    {
        return $this->hasMany(ActiveSubject::class);
    }
}
