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
        Schema::create('academic_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->default('pesantren_activity'); // 'kbm_aktif', 'holiday', 'exam', 'pesantren_activity'
            $table->date('start_date');
            $table->date('end_date');
            $table->string('color')->default('indigo'); // 'indigo', 'rose', 'amber', 'emerald', 'cyan', 'violet'
            $table->text('description')->nullable();
            $table->boolean('is_kbm_active')->default(true);
            $table->timestamps();
        });

        if (Schema::hasTable('pekans')) {
            Schema::table('pekans', function (Blueprint $table) {
                if (!Schema::hasColumn('pekans', 'is_kbm')) {
                    $table->boolean('is_kbm')->default(true)->after('end_date');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_calendar_events');

        if (Schema::hasTable('pekans')) {
            Schema::table('pekans', function (Blueprint $table) {
                if (Schema::hasColumn('pekans', 'is_kbm')) {
                    $table->dropColumn('is_kbm');
                }
            });
        }
    }
};
