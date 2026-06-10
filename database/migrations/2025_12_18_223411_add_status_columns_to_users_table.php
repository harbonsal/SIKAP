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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->date('inactive_date')->nullable();
            $table->string('inactive_reason')->nullable();
            $table->text('inactive_note')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'inactive_date', 'inactive_reason', 'inactive_note']);
        });
    }
};
