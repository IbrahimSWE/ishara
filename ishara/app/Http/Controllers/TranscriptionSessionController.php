<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTranscriptionSessionRequest;
use App\Models\TranscriptionSession;

class TranscriptionSessionController extends Controller
{
    public function store(StoreTranscriptionSessionRequest $request)
    {
        $session = TranscriptionSession::create($request->validated());

        return response()->json($session, 201);
    }

    public function index()
    {
        return TranscriptionSession::query()
            ->orderByDesc('started_at')
            ->paginate(15);
    }
}
