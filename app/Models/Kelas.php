<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Jenjang;

class Kelas extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'jenjang_id'];

    protected static function booted()
    {
        static::creating(function ($kelas) {
            if (empty($kelas->jenjang_id) || !\App\Models\Jenjang::where('id', $kelas->jenjang_id)->exists()) {
                $jenjang = \App\Models\Jenjang::first() ?: \App\Models\Jenjang::create(['name' => 'Default Jenjang']);
                $kelas->jenjang_id = $jenjang->id;
            }
        });
    }

    public function jenjang()
    {
        return $this->belongsTo(Jenjang::class);
    }

    public function activeClasses()
    {
        return $this->hasMany(ActiveClass::class);
    }
}
