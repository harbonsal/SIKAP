<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HealthComplaint extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'description'];

    // If needed: Records that have this complaint
    public function records()
    {
        return $this->belongsToMany(StudentHealthRecord::class, 'health_record_complaint', 'health_complaint_id', 'student_health_record_id');
    }
}
