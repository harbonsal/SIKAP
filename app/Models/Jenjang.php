<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jenjang extends Model
{
    protected $fillable = ['name', 'nama_arab', 'headmaster_user_id', 'headmaster_title'];

    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }

    public function headmaster()
    {
        return $this->belongsTo(User::class, 'headmaster_user_id');
    }
}
