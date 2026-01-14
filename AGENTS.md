# Repository Guidelines

## Project Structure & Module Organization

This repository is an Obsidian plugin for Quaily. The runtime artifact is `main.js` (generated); the source of truth is TypeScript.

- `main.ts`: plugin entry point (bundled to `main.js`; avoid editing generated output).
- `src/actions/`: command implementations (publish, preview, AI metadata, channel selection, etc.).
- `src/modals/`: UI modals and modal utilities.
- `src/i18n/lang/`: translation JSON files (`en.json`, `zh.json`, `zh-tw.json`, `ja.json`).
- `manifest.json`, `versions.json`: Obsidian plugin metadata and version mapping.
- `styles.css`: plugin styles.

## Build, Test, and Development Commands

- `pnpm install` (or `npm install`): install dependencies.
- `pnpm run dev`: start esbuild in watch mode; continuously rebuilds `main.js`.
- `pnpm run build`: TypeScript type-check (`tsc -noEmit`) + production bundle to `main.js`.
- `pnpm run version`: update version files (`manifest.json`, `versions.json`) for releases.

Local Obsidian install (dev loop):

```bash
mkdir -p "$VAULT/.obsidian/plugins/obsidian-quail"
cp main.js manifest.json styles.css "$VAULT/.obsidian/plugins/obsidian-quail/"
```

## Coding Style & Naming Conventions

- Indentation: tabs, width 4 (see `.editorconfig`).
- TypeScript: keep changes strict-null-safe and prefer clear types at module boundaries.
- Naming: `PascalCase` for classes (e.g., modals), `camelCase` for functions/variables, and `kebab-case` for files in `src/actions/`.

Linting:

- `npx eslint .` (configured via `.eslintrc` with `@typescript-eslint`).

## Testing Guidelines

There is no automated test suite in this repo today. Validate changes by:

- Running `pnpm run build`, then exercising the affected commands in Obsidian.
- Including screenshots/GIFs for any modal/settings UI changes.

## Commit & Pull Request Guidelines

- Prefer Conventional Commit messages seen in history: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `chore: ...`.
- Release/version commits may be the version number only (e.g., `2.0.15`).

PRs should include a short description, relevant linked issues, and reproduction/verification steps (especially for publish/send flows).
