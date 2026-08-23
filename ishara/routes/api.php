<?php

use App\Http\Controllers\TranscriptionSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/sessions', [TranscriptionSessionController::class, 'store']);
