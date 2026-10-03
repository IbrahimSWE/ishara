# Ishara (إشارة)

Ishara helps deaf and hard-of-hearing people follow spoken conversation by
transcribing speech to on-screen text in real time.

This repository currently contains **Phase 1: Real-Time Speech-to-Text** —
a complete, working feature: listen, display live text, save the
conversation, and browse past conversations.

> Future phases (text-to-sign-language video, camera-based sign language
> recognition) are not part of this repository yet and will be added as
> separate, dated milestones when work on them begins.

## Tech stack

- **Backend:** Laravel (PHP), MySQL
- **Frontend:** React, integrated via Laravel's built-in Vite tooling (single
  project, not a separate SPA + API pair)
- **Speech recognition:** the browser's native Web Speech API
  (`SpeechRecognition` / `webkitSpeechRecognition`) — no external API key, no
  server-side speech processing
- **Local environment:** XAMPP (Apache + MySQL + PHP) on Windows

## Repository layout

```
DEAF PROJECT/                  (repo root)
  docs/superpowers/            design spec and implementation plan for Phase 1
  ishara/                      the Laravel + React application — see ishara/README.md
```

The Laravel application lives in the `ishara/` subfolder so the parent
folder's space-containing name never appears in a URL path or build tooling.

## Getting started

Full setup and run instructions (requirements, database setup, running the
app, running tests) are in **[`ishara/README.md`](ishara/README.md)**.

Quick start:

```bash
cd ishara
composer install
npm install
php artisan key:generate
php artisan migrate
npm run build
php artisan serve
```

Then open `http://127.0.0.1:8000` in Chrome or Edge (required for Web Speech
API support). No authentication — single shared local user.

## Features (Phase 1)

- Start/stop live speech-to-text transcription in the browser
- Bilingual English/Arabic UI, with RTL display for Arabic transcripts
- Each listening period is saved as a session once it ends
- Browse and reopen past sessions from a history list

## Project docs

- [`docs/superpowers/specs/2026-08-23-ishara-phase1-speech-to-text-design.md`](docs/superpowers/specs/2026-08-23-ishara-phase1-speech-to-text-design.md) — design spec
- [`docs/superpowers/plans/2026-08-23-ishara-phase1-speech-to-text.md`](docs/superpowers/plans/2026-08-23-ishara-phase1-speech-to-text.md) — implementation plan

## Running tests

```bash
cd ishara
php artisan test
```

Tests run against an in-memory SQLite database and never touch the local
`ishara_db` MySQL database.
