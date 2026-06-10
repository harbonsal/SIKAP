<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzMonitoringViolation extends Model
{
    use HasFactory;

    protected $fillable = ['monitoring_id', 'musyrif_id', 'violation_type', 'note'];

    public function musyrif()
    {
        return $this->belongsTo(TahfidzMusyrif::class);
    }
}
