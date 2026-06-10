<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzHalaqohOfficer extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'session_id', 'assigned_date'];

    protected $casts = [
        'assigned_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function session()
    {
        return $this->belongsTo(TahfidzHalaqohSession::class, 'session_id');
    }
}
