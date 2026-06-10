<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->char('id', 2)->primary(); // e.g., '11'
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('regencies', function (Blueprint $table) {
            $table->char('id', 4)->primary(); // e.g., '1101'
            $table->char('province_id', 2);
            $table->string('name');
            $table->timestamps();

            $table->foreign('province_id')->references('id')->on('provinces')->onDelete('cascade');
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->char('id', 7)->primary(); // e.g., '1101010'
            $table->char('regency_id', 4);
            $table->string('name');
            $table->timestamps();

            $table->foreign('regency_id')->references('id')->on('regencies')->onDelete('cascade');
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->char('id', 10)->primary(); // e.g., '1101010001'
            $table->char('district_id', 7);
            $table->string('name');
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('villages');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regencies');
        Schema::dropIfExists('provinces');
    }
};
