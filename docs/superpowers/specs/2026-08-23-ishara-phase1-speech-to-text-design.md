# Ishara (إشارة) — Phase 1 Design: Real-Time Speech-to-Text

## Purpose

Ishara helps deaf and hard-of-hearing people follow spoken conversation by
transcribing speech to on-screen text in real time. Phase 1 delivers this
core loop end-to-end: listen, display live text, save the conversation,
browse past conversations. Later phases (not part of this spec) will add
text-to-sign-language video (Phase 2) and camera-based sign language
recognition (Phase 3).

## Environment & constraints

- Local development on XAMPP (Apache, MySQL, PHP) on Windows.
- Backend: Laravel (latest), MySQL database `ishara_db` via XAMPP's default
  `root` user with no password.
- Frontend: React, integrated into the Laravel project via Laravel's built-in
  Vite tooling — one project, not a separate SPA + API pair.
- Speech recognition: the browser's native Web Speech API
  (`SpeechRecognition` / `webkitSpeechRecognition`). No external API key, no
  server-side speech processing.
- No authentication in Phase 1 — single shared local user, no login.

## Project layout

```
DEAF PROJECT/                  (git repo root)
  docs/superpowers/specs/      (this file and future specs)
  ishara/                      (Laravel application root)
    app/
    database/
    resources/
      js/                      (React app)
      views/app.blade.php      (single entry view)
    routes/
    ...
```

The Laravel app lives in the `ishara/` subfolder to avoid the parent
directory's space-containing name (`DEAF PROJECT`) ever appearing in a URL
path or build tooling. Local dev runs via `php artisan serve` from
`ishara/`, which is unaffected by the parent folder name.

## Data model

Single table: `transcription_sessions`.

| Column            | Type              | Notes                                   |
|-------------------|-------------------|------------------------------------------|
| id                | bigint, PK         | auto-increment                          |
| spoken_language   | string(10)        | e.g. `en-US`, `ar-SA` — language recognition ran in |
| full_text         | longtext          | accumulated final transcript for the session |
| started_at        | timestamp         | when "Start Listening" was pressed       |
| ended_at          | timestamp, nullable | when "Stop" was pressed                |
| created_at        | timestamp         | Laravel default                          |
| updated_at        | timestamp         | Laravel default                          |

One row = one listening period ("session"), matching the mental model of
"one conversation." Rows are immutable once saved (no editing past
transcripts in Phase 1).

`TranscriptionSession` Eloquent model wraps this table.

## Backend API

No auth, no versioning prefix beyond `/api`. JSON in, JSON out.

- `POST /api/sessions`
  Body: `{ spoken_language, full_text, started_at, ended_at }`
  Validates via a FormRequest (all fields required, `full_text` non-empty,
  `spoken_language` one of the supported locale codes). Creates and returns
  the new `TranscriptionSession`.

- `GET /api/sessions`
  Returns paginated list of sessions, newest first (by `started_at`), for
  the History page. Includes id, spoken_language, started_at, ended_at, and
  a truncated text preview.

- `GET /api/sessions/{id}`
  Returns one session's full detail (including complete `full_text`).

Implemented as a single `TranscriptionSessionController` with
`index`/`store`/`show` methods, plus a `StoreTranscriptionSessionRequest`
FormRequest for validation.

## Frontend

Single-page app mounted from one Blade view (`resources/views/app.blade.php`),
using React Router for two client-side routes. This keeps the whole app
served from one Laravel entry point (matching the "single app via Vite"
integration choice) while still feeling like a real SPA in the browser.

### Components / structure

- `LanguageProvider` (React context) — holds the **UI display language**
  (`en` / `ar`, independent from speech recognition language), persisted to
  `localStorage`. Toggling it flips `document.documentElement.dir` between
  `ltr`/`rtl` and swaps strings from a plain `resources/js/i18n/translations.js`
  dictionary object. No i18n library — the string set is small enough that a
  dictionary + context is simpler and has zero dependencies.

- `useSpeechRecognition` hook (`resources/js/hooks/useSpeechRecognition.js`)
  — encapsulates all Web Speech API wiring: feature detection, start/stop,
  interim vs. final result accumulation, and error events (`no-speech`,
  `audio-capture`, `not-allowed`, `network`, etc.). Exposes a small interface
  (`{ isSupported, isListening, interimText, finalText, error, start, stop,
  reset }`) so the UI component stays simple and so Phase 3 (camera-based
  recognition) can follow the same "hook wraps a browser API" pattern later.

- `ListenPage` (`/`) — the Phase 1 core screen:
  - Spoken-language dropdown (English / Arabic → `en-US` / `ar-SA`),
    disabled while listening
  - "Start Listening" / "Stop" button, driven by `useSpeechRecognition`
  - Live transcript area showing accumulated final text plus the current
    interim (in-progress) phrase styled distinctly (e.g. lighter/italic)
    so the user can tell what's confirmed vs. still being recognized
  - On Stop: if there's accumulated text, POSTs
    `{ spoken_language, full_text, started_at, ended_at }` to
    `/api/sessions`; on success shows a brief "saved" confirmation
  - If `useSpeechRecognition.isSupported` is false, shows a fallback
    message explaining the browser doesn't support live transcription
    (e.g. suggest Chrome/Edge) instead of a non-functional button

- `HistoryPage` (`/history`) — fetches `GET /api/sessions`, renders a list
  (date/time, spoken language, text preview), each item links to a detail
  view (or expands in place) showing the full `full_text` via
  `GET /api/sessions/{id}`.

- `Header` — app title, language toggle, nav link between Listen/History.

### Error handling

| Case | Behavior |
|---|---|
| Browser lacks Web Speech API | Inline message on `ListenPage`, Start button disabled |
| Mic permission denied | Inline message with guidance to allow mic access and retry |
| Recognition error (`no-speech`, `network`, `audio-capture`, ...) | Non-blocking banner; listening can be restarted without losing already-accumulated final text |
| Save request fails (network/server error) | Transcript remains visible on screen (never cleared before a confirmed save); banner offers a retry button that re-POSTs the same payload |

## Testing

- PHPUnit feature tests (`tests/Feature/TranscriptionSessionApiTest.php`)
  covering: store validation (missing/invalid fields rejected), store
  success (row created), index (pagination + ordering), show (404 on
  missing id, correct payload on hit).
- The Web Speech API itself is not exercised by automated tests (no
  headless browser in this environment reliably implements it) — verified
  manually by running the app in Chrome/Edge and speaking into the
  microphone for both English and Arabic.

## Out of scope for Phase 1

- Authentication / multi-user separation
- Editing or deleting saved sessions
- Text-to-sign-language video (Phase 2)
- Camera-based sign language recognition (Phase 3)
- Any i18n library / translation management system beyond the manual
  dictionary
