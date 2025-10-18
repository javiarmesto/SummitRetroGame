# Repository Guidelines

## Project Structure & Module Organization
- Root app in `proyecto html5/`.
- Source: `proyecto html5/index.html`, `proyecto html5/js/main.js`, `proyecto html5/css/styles.css`.
- Assets: `proyecto html5/assets/` (images, audio, misc).
- Dev tooling: `proyecto html5/package.json` (uses `live-server`).

## Build, Test, and Development Commands
- Setup: `cd "proyecto html5" && npm install` — installs dev dependency `live-server`.
- Run locally: `npm start` — serves `index.html` at `http://localhost:5500` with auto‑reload.
- Open directly: double‑click `index.html` if you don’t need the server.

## Coding Style & Naming Conventions
- JavaScript: ES6+, 2‑space indentation, semicolons, single quotes for strings.
- CSS: 2‑space indentation; use class names in lowercase with hyphens (e.g., `.game-hud`).
- Files: lowercase, hyphenated where applicable (e.g., `styles.css`, `main.js`).
- Avoid global leaks; keep new logic modularized into small functions in `js/main.js`.

## Testing Guidelines
- No automated tests yet. Validate changes by running `npm start` and exercising game flows (start, play, game over).
- Add lightweight assertions/logging behind a flag if helpful; remove debug output before committing.

## Commit & Pull Request Guidelines
- Commits: present tense, concise scope prefix.
  - Examples: `feat: add player dash`, `fix: prevent off‑canvas bullets`, `chore: tidy CSS`.
- PRs: include purpose, summary of changes, before/after notes or screenshots (if visual), and any manual test steps.
- Link related issues with `Fixes #ID` when applicable.

## Security & Configuration Tips
- Do not commit large binaries to `assets/`; prefer optimized images.
- No secrets should be required; if adding external services, document env vars and keep them out of source.

## Agent-Specific Notes
- Scope of these rules: entire repository. When editing files, keep changes minimal and consistent with existing style and structure.

