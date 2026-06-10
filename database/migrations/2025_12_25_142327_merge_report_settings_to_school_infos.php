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
        // 1. Modify school_infos table
        Schema::table('school_infos', function (Blueprint $table) {
            // Add new columns for Report Settings
            $table->date('report_date')->nullable()->after('city');
            $table->string('report_place_ar')->nullable()->after('report_date');
            $table->string('kop_image')->nullable()->after('report_place_ar');
            $table->string('stamp_image')->nullable()->after('kop_image');
            $table->string('signature_image')->nullable()->after('stamp_image'); // Optional if eventually needed

            // Drop manual Handmaster columns (redundant/auto)
            $table->dropColumn(['headmaster_name', 'headmaster_nip', 'headmaster_title']);
        });

        // 2. Drop report_settings table
        Schema::dropIfExists('report_settings');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert school_infos modifications
        Schema::table('school_infos', function (Blueprint $table) {
            $table->string('headmaster_name')->nullable();
            $table->string('headmaster_nip')->nullable();
            $table->string('headmaster_title')->nullable();

            $table->dropColumn(['report_date', 'report_place_ar', 'kop_image', 'stamp_image', 'signature_image']);
        });

        // 2. Re-create report_settings table
        Schema::create('report_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('text'); // text, image, boolean
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }
};
