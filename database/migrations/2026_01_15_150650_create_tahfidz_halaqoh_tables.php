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
        // 1. Sesi Halaqoh (Pagi, Siang, Sore)
        Schema::create('tahfidz_halaqoh_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Pagi, Siang, Sore
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        // 2. Musyrif (Diambil dari Student)
        Schema::create('tahfidz_musyrifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Plotting Petugas (User/Guru pada Hari & Sesi tertentu)
        Schema::create('tahfidz_halaqoh_officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('tahfidz_halaqoh_sessions')->onDelete('cascade');
            $table->tinyInteger('day_of_week'); // 1=Senin, 7=Ahad (ISO-8601?) or check Laravel standard (0=Sun or 1=Mon) - Carbon uses 0-6 maybe? App\Models\Day uses 1-7 usually.
            // Let's assume 1=Senin for consistency with App logic if any, using tinyInteger.
            $table->timestamps();
        });

        // 4. Monitoring Form Header
        Schema::create('tahfidz_monitorings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->comment('Petugas yang mengisi')->constrained('users')->onDelete('cascade');
            $table->dateTime('recorded_at');
            $table->foreignId('session_id')->nullable()->constrained('tahfidz_halaqoh_sessions')->onDelete('set null');
            $table->text('general_note')->nullable(); // Berita acara umum
            $table->timestamps();
        });

        // 5. Monitoring Detail: Kehadiran Musyrif
        Schema::create('tahfidz_monitoring_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitoring_id')->constrained('tahfidz_monitorings')->onDelete('cascade');
            $table->foreignId('musyrif_id')->constrained('tahfidz_musyrifs')->onDelete('cascade');
            $table->string('status')->default('Hadir'); // Hadir, Izin, Sakit, Alpha
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // 6. Monitoring Detail: Pelanggaran
        Schema::create('tahfidz_monitoring_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitoring_id')->constrained('tahfidz_monitorings')->onDelete('cascade');
            $table->foreignId('musyrif_id')->constrained('tahfidz_musyrifs')->onDelete('cascade');
            $table->string('violation_type'); // Terlambat, Tidak bawa mushaf, dll (String for now as user said "dropdown list")
            $table->text('note')->nullable(); // Catatan tambahan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_monitoring_violations');
        Schema::dropIfExists('tahfidz_monitoring_attendances');
        Schema::dropIfExists('tahfidz_monitorings');
        Schema::dropIfExists('tahfidz_halaqoh_officers');
        Schema::dropIfExists('tahfidz_musyrifs');
        Schema::dropIfExists('tahfidz_halaqoh_sessions');
    }
};
