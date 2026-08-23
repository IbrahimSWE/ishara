<?php

namespace Tests\Feature;

use App\Models\TranscriptionSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranscriptionSessionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_requires_all_fields(): void
    {
        $response = $this->postJson('/api/sessions', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'spoken_language', 'full_text', 'started_at', 'ended_at',
        ]);
    }

    public function test_store_creates_a_session(): void
    {
        $payload = [
            'spoken_language' => 'en-US',
            'full_text' => 'Hello, how are you?',
            'started_at' => '2026-08-23T10:00:00Z',
            'ended_at' => '2026-08-23T10:05:00Z',
        ];

        $response = $this->postJson('/api/sessions', $payload);

        $response->assertStatus(201);
        $response->assertJsonFragment(['full_text' => 'Hello, how are you?']);
        $this->assertDatabaseHas('transcription_sessions', [
            'spoken_language' => 'en-US',
            'full_text' => 'Hello, how are you?',
        ]);
    }

    public function test_index_lists_sessions_newest_first(): void
    {
        $older = TranscriptionSession::create([
            'spoken_language' => 'en-US',
            'full_text' => 'Older session',
            'started_at' => '2026-08-20T10:00:00Z',
            'ended_at' => '2026-08-20T10:05:00Z',
        ]);

        $newer = TranscriptionSession::create([
            'spoken_language' => 'ar-SA',
            'full_text' => 'Newer session',
            'started_at' => '2026-08-22T10:00:00Z',
            'ended_at' => '2026-08-22T10:05:00Z',
        ]);

        $response = $this->getJson('/api/sessions');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertSame([$newer->id, $older->id], $ids);
    }
}
