# Ishara Phase 1 (Speech-to-Text) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 Ishara app end-to-end: a Laravel + React (via Vite) app where a user starts listening, sees live speech-to-text transcription, and can browse saved past conversations.

**Architecture:** One Laravel project (`ishara/`) serves a React single-page app through Laravel's Vite integration. The browser's native Web Speech API drives transcription entirely client-side; a small Laravel JSON API (`/api/sessions`) persists finished sessions to MySQL. No authentication, no external speech service.

**Tech Stack:** Laravel (latest, installed fresh via Composer), MySQL (XAMPP default `root`/no password), React 18 + React Router, Vite (`laravel-vite-plugin` + `@vitejs/plugin-react`), PHPUnit (Laravel's default in-memory SQLite test DB).

**Spec:** `docs/superpowers/specs/2026-08-23-ishara-phase1-speech-to-text-design.md`

## Global Constraints

- No authentication in Phase 1 — single shared local user.
- React is integrated into Laravel via Vite (one project, one entry point) — not a separate SPA + API pair.
- Database name is exactly `ishara_db`, connected via XAMPP's default `root` user with no password.
- Speech recognition uses only the browser's native Web Speech API — no external API keys, no server-side speech processing.
- One `transcription_sessions` row = one listening period (start-to-stop), not one phrase. Rows are immutable once created.
- UI language toggle (`en`/`ar`) is a plain dictionary + React context — no i18n library.
- Supported spoken-recognition languages are exactly `en-US` and `ar-SA`.
- All commands below are run from `DEAF PROJECT/` unless a step says to `cd ishara` first; once inside `ishara/`, stay there for the rest of that task.

---

### Task 1: Scaffold Laravel project and connect it to MySQL `ishara_db`

**Files:**
- Create: `ishara/` (entire fresh Laravel project via Composer)
- Modify: `ishara/.env`

**Interfaces:**
- Produces: a working Laravel installation at `ishara/`, migrated against a real `ishara_db` MySQL database, that every later task builds on.

- [ ] **Step 1: Confirm XAMPP MySQL is running**

Open the XAMPP Control Panel and make sure the **MySQL** module is started (green/"Running"). Apache isn't required for this task.

- [ ] **Step 2: Scaffold the Laravel project**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
composer create-project laravel/laravel ishara
```

Expected: a new `ishara/` directory containing a full Laravel app (`artisan`, `app/`, `routes/`, etc.).

- [ ] **Step 3: Create the `ishara_db` database**

```bash
"/c/xampp/mysql/bin/mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS ishara_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Expected: command exits with no output/error. (Adjust the path if your XAMPP is installed somewhere other than `C:\xampp`.)

- [ ] **Step 4: Point Laravel at MySQL**

Laravel 11+ defaults new projects to SQLite. Edit `ishara/.env` and set (replacing whatever `DB_*` values are already there):

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ishara_db
DB_USERNAME=root
DB_PASSWORD=
```

Leave the auto-generated `ishara/database/database.sqlite` file in place — it's unused once `DB_CONNECTION=mysql` is set, and removing it isn't necessary.

- [ ] **Step 5: Verify the connection with the default migrations**

```bash
cd ishara
php artisan migrate
```

Expected: output shows the default migrations (`create_users_table`, `create_cache_table`, `create_jobs_table`, etc.) running successfully against `ishara_db`. If you get a connection error, re-check Step 1 and Step 4.

- [ ] **Step 6: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/
git commit -m "Scaffold Laravel project and connect it to MySQL ishara_db"
```

---

### Task 2: `transcription_sessions` migration and model

**Files:**
- Create: `ishara/database/migrations/<timestamp>_create_transcription_sessions_table.php`
- Create: `ishara/app/Models/TranscriptionSession.php`
- Create: `ishara/tests/Feature/TranscriptionSessionMigrationTest.php`

**Interfaces:**
- Produces: `TranscriptionSession` Eloquent model with fillable `spoken_language`, `full_text`, `started_at`, `ended_at`, and `datetime` casts on `started_at`/`ended_at` — used by every later backend task.

- [ ] **Step 1: Write the failing test**

Create `ishara/tests/Feature/TranscriptionSessionMigrationTest.php`:

```php
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd ishara
php artisan test --filter test_transcription_sessions_table_has_expected_columns
```

Expected: FAIL — table `transcription_sessions` does not exist.

- [ ] **Step 3: Generate the model and migration**

```bash
php artisan make:model TranscriptionSession -m
```

This creates `app/Models/TranscriptionSession.php` and a migration file at `database/migrations/<timestamp>_create_transcription_sessions_table.php`.

- [ ] **Step 4: Write the migration**

Replace the generated migration's contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcription_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('spoken_language', 10);
            $table->longText('full_text');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcription_sessions');
    }
};
```

- [ ] **Step 5: Write the model**

Replace `app/Models/TranscriptionSession.php` with:

```php
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
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
php artisan test --filter test_transcription_sessions_table_has_expected_columns
```

Expected: PASS.

- [ ] **Step 7: Apply the migration to the real database**

```bash
php artisan migrate
```

Expected: `create_transcription_sessions_table` migration runs against `ishara_db`.

- [ ] **Step 8: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/database/migrations ishara/app/Models/TranscriptionSession.php ishara/tests/Feature/TranscriptionSessionMigrationTest.php
git commit -m "Add transcription_sessions migration and model"
```

---

### Task 3: Sessions JSON API (store, index, show)

**Files:**
- Create: `ishara/routes/api.php`
- Modify: `ishara/bootstrap/app.php`
- Create: `ishara/app/Http/Requests/StoreTranscriptionSessionRequest.php`
- Create: `ishara/app/Http/Controllers/TranscriptionSessionController.php`
- Create: `ishara/tests/Feature/TranscriptionSessionApiTest.php`

**Interfaces:**
- Consumes: `App\Models\TranscriptionSession` from Task 2 (fillable `spoken_language`, `full_text`, `started_at`, `ended_at`).
- Produces: `POST /api/sessions` (201 + created session JSON, or 422 on validation failure), `GET /api/sessions` (paginated JSON with a `data` array, newest `started_at` first), `GET /api/sessions/{transcriptionSession}` (200 + session JSON, or 404 if missing). These three endpoints are what the frontend (Tasks 6-7) calls.

#### Cycle A — store

- [ ] **Step 1: Write the failing tests**

Create `ishara/tests/Feature/TranscriptionSessionApiTest.php`:

```php
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
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd ishara
php artisan test --filter TranscriptionSessionApiTest
```

Expected: FAIL — `/api/sessions` route does not exist (404s).

- [ ] **Step 3: Wire up the `api` route file**

Edit `ishara/bootstrap/app.php` — add the `api:` line inside `withRouting(...)`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

- [ ] **Step 4: Create the validation request**

Create `ishara/app/Http/Requests/StoreTranscriptionSessionRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTranscriptionSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'spoken_language' => ['required', 'string', 'in:en-US,ar-SA'],
            'full_text' => ['required', 'string'],
            'started_at' => ['required', 'date'],
            'ended_at' => ['required', 'date', 'after_or_equal:started_at'],
        ];
    }
}
```

- [ ] **Step 5: Create the controller with `store()`**

Create `ishara/app/Http/Controllers/TranscriptionSessionController.php`:

```php
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
}
```

- [ ] **Step 6: Add the route**

Create `ishara/routes/api.php`:

```php
<?php

use App\Http\Controllers\TranscriptionSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/sessions', [TranscriptionSessionController::class, 'store']);
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
php artisan test --filter TranscriptionSessionApiTest
```

Expected: both `test_store_requires_all_fields` and `test_store_creates_a_session` PASS.

- [ ] **Step 8: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/bootstrap/app.php ishara/routes/api.php ishara/app/Http/Requests/StoreTranscriptionSessionRequest.php ishara/app/Http/Controllers/TranscriptionSessionController.php ishara/tests/Feature/TranscriptionSessionApiTest.php
git commit -m "Add POST /api/sessions endpoint with validation"
```

#### Cycle B — index

- [ ] **Step 1: Write the failing test**

Add to `ishara/tests/Feature/TranscriptionSessionApiTest.php` (inside the existing class):

```php
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
php artisan test --filter test_index_lists_sessions_newest_first
```

Expected: FAIL — `GET /api/sessions` route does not exist (404).

- [ ] **Step 3: Add `index()` to the controller**

Add this method to `TranscriptionSessionController` (alongside `store`):

```php
    public function index()
    {
        return TranscriptionSession::query()
            ->orderByDesc('started_at')
            ->paginate(15);
    }
```

- [ ] **Step 4: Add the route**

Add to `ishara/routes/api.php`:

```php
Route::get('/sessions', [TranscriptionSessionController::class, 'index']);
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
php artisan test --filter test_index_lists_sessions_newest_first
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/routes/api.php ishara/app/Http/Controllers/TranscriptionSessionController.php ishara/tests/Feature/TranscriptionSessionApiTest.php
git commit -m "Add GET /api/sessions list endpoint"
```

#### Cycle C — show

- [ ] **Step 1: Write the failing tests**

Add to `ishara/tests/Feature/TranscriptionSessionApiTest.php`:

```php
    public function test_show_returns_full_session(): void
    {
        $session = TranscriptionSession::create([
            'spoken_language' => 'en-US',
            'full_text' => 'A full conversation transcript.',
            'started_at' => '2026-08-23T10:00:00Z',
            'ended_at' => '2026-08-23T10:05:00Z',
        ]);

        $response = $this->getJson("/api/sessions/{$session->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['full_text' => 'A full conversation transcript.']);
    }

    public function test_show_returns_404_for_missing_session(): void
    {
        $response = $this->getJson('/api/sessions/999');

        $response->assertStatus(404);
    }
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
php artisan test --filter "test_show_returns"
```

Expected: FAIL — route does not exist.

- [ ] **Step 3: Add `show()` to the controller**

Add this method to `TranscriptionSessionController`:

```php
    public function show(TranscriptionSession $transcriptionSession)
    {
        return response()->json($transcriptionSession);
    }
```

- [ ] **Step 4: Add the route**

Add to `ishara/routes/api.php`:

```php
Route::get('/sessions/{transcriptionSession}', [TranscriptionSessionController::class, 'show']);
```

Route-model binding means a missing id automatically 404s — no manual not-found handling needed.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
php artisan test --filter "test_show_returns"
```

Expected: both PASS.

- [ ] **Step 6: Run the full test file**

```bash
php artisan test --filter TranscriptionSessionApiTest
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/routes/api.php ishara/app/Http/Controllers/TranscriptionSessionController.php ishara/tests/Feature/TranscriptionSessionApiTest.php
git commit -m "Add GET /api/sessions/{id} show endpoint"
```

---

### Task 4: Frontend bootstrap (React + Vite wired into Laravel)

**Files:**
- Modify: `ishara/vite.config.js`
- Modify: `ishara/routes/web.php`
- Create: `ishara/resources/views/app.blade.php`
- Create: `ishara/resources/js/app.jsx`
- Create: `ishara/resources/js/App.jsx`
- Create: `ishara/resources/js/pages/ListenPage.jsx` (stub)
- Create: `ishara/resources/js/pages/HistoryPage.jsx` (stub)
- Delete: `ishara/resources/views/welcome.blade.php` (no longer routed to)

**Interfaces:**
- Produces: a mounted React app at `/` and `/history`, rendering `ListenPage`/`HistoryPage` respectively — the mount point Tasks 5-7 build on.

- [ ] **Step 1: Install frontend dependencies**

```bash
cd ishara
npm install
npm install react react-dom react-router-dom
npm install -D @vitejs/plugin-react
```

Expected: `package.json` gains `react`, `react-dom`, `react-router-dom` under `dependencies` and `@vitejs/plugin-react` under `devDependencies`.

- [ ] **Step 2: Configure Vite for React**

Replace `ishara/vite.config.js` with:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
});
```

- [ ] **Step 3: Create the entry point**

Create `ishara/resources/js/app.jsx`:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('app');
createRoot(container).render(<App />);
```

- [ ] **Step 4: Create stub pages**

Create `ishara/resources/js/pages/ListenPage.jsx`:

```jsx
import React from 'react';

export default function ListenPage() {
    return <p>Listen page coming in Task 6.</p>;
}
```

Create `ishara/resources/js/pages/HistoryPage.jsx`:

```jsx
import React from 'react';

export default function HistoryPage() {
    return <p>History page coming in Task 7.</p>;
}
```

- [ ] **Step 5: Create the root `App` component with routing**

Create `ishara/resources/js/App.jsx`:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ListenPage from './pages/ListenPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
    return (
        <BrowserRouter>
            <header className="app-header">
                <span className="app-header__title">Ishara — إشارة</span>
            </header>
            <main className="app-main">
                <Routes>
                    <Route path="/" element={<ListenPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}
```

- [ ] **Step 6: Create the Blade entry view**

Create `ishara/resources/views/app.blade.php`:

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ishara — إشارة</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

- [ ] **Step 7: Route to the SPA and remove the default welcome page**

Replace `ishara/routes/web.php` with:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('app'));
Route::get('/history', fn () => view('app'));
```

Delete `ishara/resources/views/welcome.blade.php` (no longer referenced by any route).

- [ ] **Step 8: Verify the build succeeds**

```bash
npm run build
```

Expected: build completes with no errors, producing files under `ishara/public/build/`.

- [ ] **Step 9: Manual verification in the browser**

```bash
php artisan serve
```

Open `http://127.0.0.1:8000` — expect to see the "Ishara — إشارة" header and "Listen page coming in Task 6." Navigate to `http://127.0.0.1:8000/history` — expect "History page coming in Task 7." Stop the server (Ctrl+C) when done.

- [ ] **Step 10: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/vite.config.js ishara/routes/web.php ishara/resources/views/app.blade.php ishara/resources/js ishara/package.json ishara/package-lock.json
git rm ishara/resources/views/welcome.blade.php
git commit -m "Bootstrap React SPA served through Laravel Vite integration"
```

---

### Task 5: Bilingual UI toggle (language context + header)

**Files:**
- Create: `ishara/resources/js/i18n/translations.js`
- Create: `ishara/resources/js/context/LanguageContext.jsx`
- Create: `ishara/resources/js/components/Header.jsx`
- Modify: `ishara/resources/js/App.jsx`

**Interfaces:**
- Consumes: `App.jsx`'s `BrowserRouter` (from Task 4) — `Header` uses `<Link>`, so it must render inside the router.
- Produces: `useLanguage()` hook returning `{ language, toggleLanguage, t }`, used by `ListenPage` (Task 6) and `HistoryPage` (Task 7) to translate labels.

- [ ] **Step 1: Create the translation dictionary**

Create `ishara/resources/js/i18n/translations.js`:

```js
const translations = {
    en: {
        appName: 'Ishara',
        navListen: 'Listen',
        navHistory: 'History',
        toggleLanguageLabel: 'العربية',
    },
    ar: {
        appName: 'إشارة',
        navListen: 'استماع',
        navHistory: 'السجل',
        toggleLanguageLabel: 'English',
    },
};

export default translations;
```

- [ ] **Step 2: Create the language context**

Create `ishara/resources/js/context/LanguageContext.jsx`:

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'ishara_ui_language';

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => (
        localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'
    ));

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage((current) => (current === 'en' ? 'ar' : 'en'));
    };

    const t = (key) => translations[language][key] ?? key;

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
```

- [ ] **Step 3: Create the header**

Create `ishara/resources/js/components/Header.jsx`:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
    const { t, toggleLanguage } = useLanguage();

    return (
        <header className="app-header">
            <span className="app-header__title">{t('appName')}</span>
            <nav className="app-header__nav">
                <Link to="/">{t('navListen')}</Link>
                <Link to="/history">{t('navHistory')}</Link>
            </nav>
            <button type="button" onClick={toggleLanguage} className="app-header__lang-toggle">
                {t('toggleLanguageLabel')}
            </button>
        </header>
    );
}
```

- [ ] **Step 4: Wire the provider and header into `App.jsx`**

Replace `ishara/resources/js/App.jsx` with:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import ListenPage from './pages/ListenPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Header />
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<ListenPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </LanguageProvider>
    );
}
```

- [ ] **Step 5: Manual verification**

```bash
cd ishara
npm run build
php artisan serve
```

Open `http://127.0.0.1:8000`. Expect: header shows "Ishara", nav links "Listen"/"History", a button labeled "العربية". Click the button: page flips to RTL, header now shows "إشارة", nav links become "استماع"/"السجل", button now reads "English". Reload the page: language choice persists (still Arabic). Click the button again to switch back to English. Stop the server when done.

- [ ] **Step 6: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/resources/js
git commit -m "Add bilingual EN/AR UI toggle with language context"
```

---

### Task 6: Live speech-to-text (`useSpeechRecognition` hook + `ListenPage`)

**Files:**
- Create: `ishara/resources/js/hooks/useSpeechRecognition.js`
- Modify: `ishara/resources/js/pages/ListenPage.jsx` (replace stub)
- Modify: `ishara/resources/js/i18n/translations.js` (add keys)

**Interfaces:**
- Consumes: `useLanguage()` from Task 5 for `t()`.
- Produces: `useSpeechRecognition()` returning `{ isSupported, isListening, interimText, finalText, error, start(lang), stop(), reset() }` — a reusable pattern later phases (camera-based recognition) can follow.
- Consumes: `POST /api/sessions` from Task 3 (`spoken_language`, `full_text`, `started_at`, `ended_at`).

- [ ] **Step 1: Add new translation keys**

In `ishara/resources/js/i18n/translations.js`, add these keys to both the `en` and `ar` objects (keep the existing keys from Task 5):

```js
const translations = {
    en: {
        appName: 'Ishara',
        navListen: 'Listen',
        navHistory: 'History',
        toggleLanguageLabel: 'العربية',
        spokenLanguageLabel: 'Spoken language',
        startListening: 'Start Listening',
        stopListening: 'Stop',
        recognitionError: 'Recognition error',
        sessionSaved: 'Session saved',
        saveFailed: 'Could not save this session.',
        retry: 'Retry',
        unsupportedBrowser: 'Your browser does not support live speech recognition. Please use Google Chrome or Microsoft Edge.',
        micPermissionDenied: 'Microphone access was denied. Please allow microphone access in your browser and try again.',
    },
    ar: {
        appName: 'إشارة',
        navListen: 'استماع',
        navHistory: 'السجل',
        toggleLanguageLabel: 'English',
        spokenLanguageLabel: 'لغة التحدث',
        startListening: 'ابدأ الاستماع',
        stopListening: 'إيقاف',
        recognitionError: 'خطأ في التعرف على الصوت',
        sessionSaved: 'تم حفظ الجلسة',
        saveFailed: 'تعذر حفظ هذه الجلسة.',
        retry: 'إعادة المحاولة',
        unsupportedBrowser: 'متصفحك لا يدعم التعرف الفوري على الكلام. يرجى استخدام Google Chrome أو Microsoft Edge.',
        micPermissionDenied: 'تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح والمحاولة مرة أخرى.',
    },
};

export default translations;
```

- [ ] **Step 2: Create the speech recognition hook**

Create `ishara/resources/js/hooks/useSpeechRecognition.js`:

```js
import { useCallback, useRef, useState } from 'react';

const getRecognitionConstructor = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function useSpeechRecognition() {
    const RecognitionConstructor = getRecognitionConstructor();
    const isSupported = RecognitionConstructor !== null;

    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [finalText, setFinalText] = useState('');
    const [error, setError] = useState(null);

    const start = useCallback((lang) => {
        if (!isSupported) {
            return;
        }

        setError(null);
        setInterimText('');

        const recognition = new RecognitionConstructor();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interim = '';
            let finalChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalChunk += `${transcript} `;
                } else {
                    interim += transcript;
                }
            }

            if (finalChunk) {
                setFinalText((current) => current + finalChunk);
            }
            setInterimText(interim);
        };

        recognition.onerror = (event) => {
            setError(event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [isSupported]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const reset = useCallback(() => {
        setFinalText('');
        setInterimText('');
        setError(null);
    }, []);

    return { isSupported, isListening, interimText, finalText, error, start, stop, reset };
}
```

- [ ] **Step 3: Implement `ListenPage`**

Replace `ishara/resources/js/pages/ListenPage.jsx` with:

```jsx
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const LANGUAGE_OPTIONS = [
    { value: 'en-US', label: 'English' },
    { value: 'ar-SA', label: 'العربية' },
];

export default function ListenPage() {
    const { t } = useLanguage();
    const {
        isSupported, isListening, interimText, finalText, error, start, stop, reset,
    } = useSpeechRecognition();

    const [spokenLanguage, setSpokenLanguage] = useState('en-US');
    const [startedAt, setStartedAt] = useState(null);
    const [saveState, setSaveState] = useState('idle');

    const handleStart = () => {
        if (error) {
            // Resuming after a recognition error — keep the transcript captured so far.
            start(spokenLanguage);
            return;
        }

        reset();
        setSaveState('idle');
        setStartedAt(new Date().toISOString());
        start(spokenLanguage);
    };

    const saveSession = async () => {
        setSaveState('saving');
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    spoken_language: spokenLanguage,
                    full_text: finalText.trim(),
                    started_at: startedAt,
                    ended_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error('save failed');
            }

            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    };

    const handleStop = () => {
        stop();
        if (finalText.trim().length > 0) {
            saveSession();
        }
    };

    if (!isSupported) {
        return <p className="listen-page__unsupported">{t('unsupportedBrowser')}</p>;
    }

    return (
        <div className="listen-page">
            <label className="listen-page__language-picker">
                {t('spokenLanguageLabel')}
                <select
                    value={spokenLanguage}
                    onChange={(e) => setSpokenLanguage(e.target.value)}
                    disabled={isListening}
                >
                    {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>

            <button type="button" onClick={isListening ? handleStop : handleStart}>
                {isListening ? t('stopListening') : t('startListening')}
            </button>

            <div className="listen-page__transcript">
                <span>{finalText}</span>
                <span className="listen-page__interim">{interimText}</span>
            </div>

            {error && (
                <p className="listen-page__error">
                    {error === 'not-allowed' ? t('micPermissionDenied') : `${t('recognitionError')}: ${error}`}
                </p>
            )}
            {saveState === 'saved' && <p className="listen-page__saved">{t('sessionSaved')}</p>}
            {saveState === 'error' && (
                <p className="listen-page__save-error">
                    {t('saveFailed')}{' '}
                    <button type="button" onClick={saveSession}>{t('retry')}</button>
                </p>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Manual verification**

```bash
cd ishara
npm run build
php artisan serve
```

Open `http://127.0.0.1:8000` in **Google Chrome or Microsoft Edge** (Web Speech API support varies by browser). Click "Start Listening", allow microphone access when prompted, and speak a sentence. Expect: words appear in the transcript area as you speak (interim text lighter, finalized text solid). Click "Stop". Expect: a "Session saved" message appears. Switch the spoken-language dropdown to "العربية", start listening again, and speak a short Arabic sentence — expect Arabic text to appear. Open phpMyAdmin (`http://localhost/phpmyadmin`) and confirm the `ishara_db`.`transcription_sessions` table now has rows matching what you said.

Also verify error recovery: while listening, block the microphone (e.g. deny/revoke the permission in the browser's site settings) and confirm the mic-permission-denied message appears; then start a session, let it sit silent long enough to trigger a `no-speech` error, and confirm clicking "Start Listening" again resumes without clearing the text already captured.

- [ ] **Step 5: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/resources/js
git commit -m "Add live speech-to-text on ListenPage via Web Speech API"
```

---

### Task 7: Session history (`HistoryPage`)

**Files:**
- Modify: `ishara/resources/js/pages/HistoryPage.jsx` (replace stub)
- Modify: `ishara/resources/js/i18n/translations.js` (add key)

**Interfaces:**
- Consumes: `GET /api/sessions` and `GET /api/sessions/{id}` from Task 3; `useLanguage()` from Task 5.

- [ ] **Step 1: Add the new translation key**

In `ishara/resources/js/i18n/translations.js`, add to both `en` and `ar`:

```js
// en
historyLoadError: 'Could not load past sessions.',

// ar
historyLoadError: 'تعذر تحميل الجلسات السابقة.',
```

(Add each line inside its respective language object, alongside the keys from Task 6.)

- [ ] **Step 2: Implement `HistoryPage`**

Replace `ishara/resources/js/pages/HistoryPage.jsx` with:

```jsx
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function HistoryPage() {
    const { t } = useLanguage();
    const [sessions, setSessions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        fetch('/api/sessions', { headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('failed to load');
                return response.json();
            })
            .then((data) => setSessions(data.data))
            .catch(() => setLoadError(true));
    }, []);

    useEffect(() => {
        if (selectedId === null) {
            setSelectedSession(null);
            return;
        }

        fetch(`/api/sessions/${selectedId}`, { headers: { Accept: 'application/json' } })
            .then((response) => response.json())
            .then((data) => setSelectedSession(data));
    }, [selectedId]);

    if (loadError) {
        return <p className="history-page__error">{t('historyLoadError')}</p>;
    }

    return (
        <div className="history-page">
            <ul className="history-page__list">
                {sessions.map((session) => (
                    <li key={session.id}>
                        <button type="button" onClick={() => setSelectedId(session.id)}>
                            <span>{new Date(session.started_at).toLocaleString()}</span>
                            <span>{session.spoken_language}</span>
                            <span>{session.full_text.slice(0, 80)}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {selectedSession && (
                <div className="history-page__detail">
                    <h2>{new Date(selectedSession.started_at).toLocaleString()}</h2>
                    <p>{selectedSession.full_text}</p>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 3: Manual verification**

```bash
cd ishara
npm run build
php artisan serve
```

Open `http://127.0.0.1:8000/history`. Expect: the sessions saved during Task 6's verification appear in the list, newest first, each showing date/time, language code, and a text preview. Click one: expect the full transcript to appear below the list.

- [ ] **Step 4: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/resources/js
git commit -m "Add HistoryPage listing and viewing past sessions"
```

---

### Task 8: Styling, README, and final end-to-end verification

**Files:**
- Modify: `ishara/resources/css/app.css`
- Create: `ishara/README.md`

**Interfaces:**
- None — this task only affects presentation and documentation; no other task depends on it.

- [ ] **Step 1: Write the stylesheet**

Replace `ishara/resources/css/app.css` with:

```css
:root {
    color-scheme: light;
    font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif;
}

body {
    margin: 0;
    background: #f7f7f9;
    color: #1a1a1a;
}

.app-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e5;
}

.app-header__title {
    font-size: 1.25rem;
    font-weight: 700;
}

.app-header__nav {
    display: flex;
    gap: 1rem;
    flex: 1;
}

.app-header__nav a {
    color: #1a1a1a;
    text-decoration: none;
}

.app-header__lang-toggle {
    border: 1px solid #cfcfd6;
    background: #fff;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
}

.app-main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
}

.listen-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.listen-page__language-picker {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 220px;
}

.listen-page button {
    align-self: flex-start;
    padding: 0.6rem 1.4rem;
    font-size: 1rem;
    border-radius: 8px;
    border: none;
    background: #2f6fed;
    color: #fff;
    cursor: pointer;
}

.listen-page__transcript {
    min-height: 8rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid #e0e0e5;
    border-radius: 8px;
    font-size: 1.1rem;
    line-height: 1.6;
    white-space: pre-wrap;
}

.listen-page__interim {
    color: #8a8a93;
    font-style: italic;
}

.listen-page__error,
.listen-page__save-error {
    color: #b3261e;
}

.listen-page__saved {
    color: #1b7f3a;
}

.history-page__list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.history-page__list button {
    width: 100%;
    text-align: start;
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 1px solid #e0e0e5;
    border-radius: 8px;
    cursor: pointer;
}

.history-page__detail {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid #e0e0e5;
    border-radius: 8px;
    white-space: pre-wrap;
}
```

- [ ] **Step 2: Write the README**

Create `ishara/README.md`:

```markdown
# Ishara (إشارة) — Phase 1: Real-Time Speech-to-Text

Helps deaf and hard-of-hearing people follow spoken conversation by
transcribing speech to on-screen text in real time.

## Requirements

- XAMPP (Apache + MySQL + PHP)
- Composer
- Node.js + npm
- Google Chrome or Microsoft Edge (for Web Speech API support)

## First-time setup

1. Start **MySQL** (and, optionally, **Apache** for phpMyAdmin) in the XAMPP Control Panel.
2. From this directory, install PHP dependencies: `composer install`
3. Install JS dependencies: `npm install`
4. Copy `.env.example` to `.env` if you don't already have one, then confirm it has:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=ishara_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```
5. Create the database (once): open phpMyAdmin at `http://localhost/phpmyadmin` and create a database named `ishara_db`, or run:
   ```
   "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS ishara_db;"
   ```
6. Generate an app key (if not already set): `php artisan key:generate`
7. Run migrations: `php artisan migrate`

## Running locally

Ishara runs via Laravel's own server, not through XAMPP's Apache — XAMPP is only needed here for MySQL (and phpMyAdmin).

1. Make sure XAMPP's **MySQL** module is running.
2. Build frontend assets: `npm run build` (or `npm run dev` for hot-reload while developing)
3. Start the app: `php artisan serve`
4. Open `http://127.0.0.1:8000` in Chrome or Edge.

## Running the test suite

```
php artisan test
```

Tests run against an in-memory SQLite database (configured in `phpunit.xml`) and never touch `ishara_db`.

## Project structure

- `app/Models/TranscriptionSession.php` — one row per listening period
- `app/Http/Controllers/TranscriptionSessionController.php` — `/api/sessions` endpoints
- `resources/js/pages/ListenPage.jsx` — live speech-to-text screen
- `resources/js/pages/HistoryPage.jsx` — past sessions screen
- `resources/js/hooks/useSpeechRecognition.js` — Web Speech API wrapper

## Roadmap

- **Phase 2:** text-to-sign-language video
- **Phase 3:** camera-based sign language recognition
```

- [ ] **Step 3: Full end-to-end manual verification**

```bash
cd ishara
php artisan test
```

Expected: all tests pass (migration + API tests).

```bash
npm run build
php artisan serve
```

In Chrome or Edge: visit `http://127.0.0.1:8000`, toggle language EN/AR, record a short English session and a short Arabic session (Start → speak → Stop), confirm both show "Session saved", then visit `/history` and confirm both appear with correct language tags and correct preview text, and that clicking each shows the full transcript.

- [ ] **Step 4: Commit**

```bash
cd "/c/xampp/htdocs/DEAF PROJECT"
git add ishara/resources/css/app.css ishara/README.md
git commit -m "Add app styling, README, and finish Phase 1 verification"
```
