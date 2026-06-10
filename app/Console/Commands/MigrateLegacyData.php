<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class MigrateLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:legacy-data {--clean : Truncate tables before migration}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate data from legacy sim_lama database';

    /**
     * User Level IDs cache
     */
    protected $levels = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Legacy Data Migration...');

        if ($this->option('clean')) {
            if ($this->confirm('This will wipe all existing Users and Students data. Continue?')) {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                DB::table('students')->truncate();
                DB::table('users')->truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                $this->warn('Tables truncated.');
            }
        }

        // Ensure user levels exist
        $this->setupUserLevels();

        // Migrate Users (Teachers & Students account base)
        $this->migrateUsers();

        // Migrate Students (Biodata)
        $this->migrateStudents();

        $this->info('Migration completed successfully.');
    }

    private function setupUserLevels()
    {
        $levels = ['Admin', 'Guru', 'Siswa', 'Karyawan', 'Kepala Sekolah'];
        foreach ($levels as $name) {
            $id = DB::table('user_levels')->where('name', $name)->value('id');
            if (!$id) {
                $id = DB::table('user_levels')->insertGetId([
                    'name' => $name,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            $this->levels[$name] = $id;
        }
    }

    private function migrateUsers()
    {
        $this->info('Migrating Users...');

        // Fetch legacy users
        $legacyUsers = DB::connection('mysql_legacy')->table('user')->get();
        $bar = $this->output->createProgressBar($legacyUsers->count());

        foreach ($legacyUsers as $legacy) {
            // Determine Level
            $levelId = null;
            if ($legacy->Kode_Status == 'ssw' || $legacy->Kode_Status == 'SAN') $levelId = $this->levels['Siswa'];
            elseif ($legacy->Kode_Status == 'ust' || $legacy->Kode_Status == 'UST') $levelId = $this->levels['Guru'];
            elseif ($legacy->Kode_Status == 'kar' || $legacy->Kode_Status == 'KAR') $levelId = $this->levels['Karyawan'];
            else $levelId = $this->levels['Siswa']; // Default

            // Status Map
            $status = ($legacy->Activated == 'Y') ? 'Aktif' : 'Tidak Aktif';

            // Email Generation (Unique)
            $email = $legacy->Kode_User . '@santri.sim';
            if ($levelId == $this->levels['Guru']) $email = $legacy->Kode_User . '@guru.sim';

            // Check existence
            $exists = DB::table('users')->where('nomor_induk', $legacy->Kode_User)->exists();

            if (!$exists) {
                DB::table('users')->insert([
                    'name' => $legacy->Nama,
                    'email' => $email, // Placeholder email
                    'nomor_induk' => $legacy->Kode_User,
                    'nama_arab' => $legacy->Nama_Arab,
                    'password' => Hash::make('12345678'), // Default password
                    'user_level_id' => $levelId,
                    'status' => $status,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
    }

    private function migrateStudents()
    {
        $this->info('Migrating Student Biodata...');

        $legacyBiodata = DB::connection('mysql_legacy')->table('biodata')->orderBy('ID_Biodata')->chunk(100, function ($rows) {
            foreach ($rows as $bio) {
                // Find User by NIS (nomor_induk)
                $user = DB::table('users')
                    ->where('nomor_induk', $bio->NIS)
                    ->where('user_level_id', $this->levels['Siswa'])
                    ->first();

                if ($user) {
                    // Check if profile exists
                    $exists = DB::table('students')->where('user_id', $user->id)->exists();

                    if (!$exists) {
                        // Map Gender
                        $gender = (strtoupper($bio->Jenis_Kelamin) == 'LAKI-LAKI') ? 'L' : 'P';
                        if ($bio->Jenis_Kelamin == '') $gender = 'L'; // Default

                        try {
                            DB::table('students')->insert([
                                'user_id' => $user->id,
                                'nisn' => $bio->NISN ?: null,
                                'gender' => $gender,
                                'birth_place' => $bio->Tempat_Lahir,
                                'birth_date' => $bio->Tanggal_Lahir ?? '2000-01-01',
                                'address' => $bio->Alamat_Peserta_Didik ?? '-',
                                'parent_name' => $bio->Nama_Ayah ?? 'Orang Tua',
                                'parent_phone' => $bio->Telepon_HP_Ortu,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } catch (\Exception $e) {
                            $this->error("Failed to migrate student NIS {$bio->NIS}: " . $e->getMessage());
                            Log::error("Migration Error Student NIS {$bio->NIS}: " . $e->getMessage());
                        }
                    }
                }
            }
            $this->output->write('.');
        });
        $this->newLine();
    }
}
