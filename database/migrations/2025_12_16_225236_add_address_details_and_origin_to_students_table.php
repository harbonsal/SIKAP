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
            $table->string('origin_region')->nullable()->after('citizenship'); // Jawa / Luar Jawa

            // Address Details
            $table->string('province')->nullable()->after('address');
            $table->string('city')->nullable()->after('province');
            $table->string('district')->nullable()->after('city');
            $table->string('village')->nullable()->after('district');
            $table->string('postal_code')->nullable()->after('village');
            $table->text('address_details')->nullable()->after('postal_code'); // Jalan, RT/RW, No Rumah
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'origin_region',
                'province',
                'city',
                'district',
                'village',
                'postal_code',
                'address_details',
            ]);
        });
    }
};
