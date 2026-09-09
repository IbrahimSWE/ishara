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
