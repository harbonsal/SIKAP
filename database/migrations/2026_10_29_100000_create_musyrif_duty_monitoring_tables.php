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
        // 1. Master Template Jadwal & Tugas Asrama Musyrif
        if (!Schema::hasTable('musyrif_duty_templates')) {
            Schema::create('musyrif_duty_templates', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('category')->default('Asrama'); // Ibadah, Makan, Asrama, Piket Khusus
                $table->time('start_time');
                $table->time('end_time');
                $table->string('applicable_days')->default('all'); // 'all', '1,2,3,4,5,6' (Senin-Sabtu), '0' (Ahad)
                $table->text('target_description')->nullable();
                $table->integer('order_num')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Logbook & Checklist Tugas Harian Musyrif
        if (!Schema::hasTable('musyrif_duty_logs')) {
            Schema::create('musyrif_duty_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('duty_template_id')->constrained('musyrif_duty_templates')->onDelete('cascade');
                $table->foreignId('active_kamar_id')->nullable()->constrained('active_kamars')->nullOnDelete();
                $table->date('date');
                $table->string('status')->default('completed'); // 'completed', 'late', 'excused'
                $table->dateTime('checked_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'duty_template_id', 'date'], 'musyrif_duty_unique');
                $table->index(['date', 'user_id']);
                $table->index(['date', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('musyrif_duty_logs');
        Schema::dropIfExists('musyrif_duty_templates');
    }
};

