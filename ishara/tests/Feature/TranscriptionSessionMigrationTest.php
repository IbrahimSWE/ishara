<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TranscriptionSessionMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_transcription_sessions_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('transcription_sessions'));
        $this->assertTrue(Schema::hasColumns('transcription_sessions', [
            'id', 'spoken_language', 'full_text', 'started_at', 'ended_at', 'created_at', 'updated_at',
        ]));
    }
}
