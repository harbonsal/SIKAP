<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ListDatabases extends Command
{
    protected $signature = 'db:list';
    protected $description = 'List all databases';

    public function handle()
    {
        try {
            $tables = DB::select('SELECT table_name FROM information_schema.tables WHERE table_schema = "sim"');
            $this->info('Tables in database "sim":');
            foreach ($tables as $t) {
                $this->info('- ' . $t->table_name);
            }
        } catch (\Exception $e) {
            $this->error('Connection failed: ' . $e->getMessage());
        }
    }
}
