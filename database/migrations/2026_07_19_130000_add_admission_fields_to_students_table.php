<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('previous_school')->nullable()->after('address_details');
            $table->string('accepted_grade')->nullable()->after('previous_school');
            $table->date('accepted_date')->nullable()->after('accepted_grade');
            $table->string('guardian_phone')->nullable()->after('guardian_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'previous_school',
                'accepted_grade',
                'accepted_date',
                'guardian_phone',
            ]);
        });
    }
};
