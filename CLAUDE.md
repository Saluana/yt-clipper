# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

Overview

- This repository uses Bun as the runtime and tooling by default. Follow Bun commands and APIs described below.

Developer commands

- Install dependencies: bun install
- Run the app (development with hot reload): bun --hot ./index.ts
- Run a single TypeScript file: bun <file.ts>
- Run tests: bun test
- Build assets (CSS/TS/HTML): bun build <file.html|file.ts|file.css>
- Run a script defined in package.json: bun run <script>

Linting & typechecking

- Type checking is expected to use the TypeScript toolchain; run tsc if configured or rely on the user's preferred command. Add tests with bun test.

Architecture summary

- Small single-package repo. Entry point: index.ts (project root) — Bun serves HTML and backend routes.
- Frontend: HTML imports (index.html) import .tsx/.ts/.js modules directly. React components may be in frontend.tsx or similarly named files.
- Backend: index.ts registers routes via Bun.serve and may expose endpoints under /api/*.
- Data storage: prefer built-in Bun integrations (bun:sqlite, Bun.sql for Postgres, Bun.redis) when present.

Files of interest

- index.ts — application entrypoint (server + routes)
- package.json — project metadata and scripts

Development notes

- Do not use Express, ws, pg, better-sqlite3, or other Node packages that Bun provides alternatives for; use Bun's built-ins.
- Bun automatically loads .env; do not add dotenv.
- When modifying files, follow existing code style and import patterns.

Editing guidance for Claude Code

- Prefer editing existing files over creating new ones.
- Avoid adding new docs unless requested.
- When running commands locally, use Bun commands listed above.

For server use Elysia 
---