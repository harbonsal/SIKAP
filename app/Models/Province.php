<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'name'];

    public function regencies()
    {
        return $this->hasMany(Regency::class);
    }
}
