<?php

use App\Http\Controllers\TranscriptionSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/sessions', [TranscriptionSessionController::class, 'store']);
Route::get('/sessions', [TranscriptionSessionController::class, 'index']);
Route::get('/sessions/{transcriptionSession}', [TranscriptionSessionController::class, 'show']);
