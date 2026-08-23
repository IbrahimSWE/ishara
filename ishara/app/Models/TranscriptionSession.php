<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TranscriptionSession extends Model
{
    protected $fillable = [
        'spoken_language',
        'full_text',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];
}
