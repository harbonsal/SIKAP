<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'district_id', 'name'];

    public function district()
    {
        return $this->belongsTo(District::class);
    }
}
