# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin for [Quaily.com](https://quaily.com), a publishing service. The plugin allows users to publish Obsidian notes as newsletters and blog posts.

## Build Commands

```bash
# Development with watch mode
pnpm dev

# Production build (includes TypeScript type checking)
pnpm build

# Version bump (updates manifest.json and versions.json)
pnpm version
```

The build outputs `main.js` which is loaded by Obsidian.

## Architecture

### Plugin Entry Point
- `main.ts` - Contains `QuailPlugin` class extending Obsidian's `Plugin`
- Manages OAuth tokens, API clients, and plugin lifecycle
- Dynamic command loading based on authentication state

### Core Patterns

**API Clients**: Two client instances from `quail-js`:
- `Client` - Main Quaily API (posts, lists, attachments)
- `AuxiliaClient` - AI features (frontmatter generation)

**Actions** (`src/actions/`): Each plugin command is a separate action file returning a command object. Actions are conditionally loaded via `getActions()` - only login shows when unauthenticated.

**Modals** (`src/modals/`): UI dialogs for error display, loading states, previews, and publish results.

**Frontmatter** (`src/frontmatter.ts`): Handles validation and transformation of note metadata. Required fields: `slug`. Supports field aliases (e.g., `description` → `summary`, `date` → `datetime`).

### Publishing Workflow
1. `arrangeArticle()` - Validates frontmatter, uploads local images, replaces URLs
2. `savePost()` - Creates/updates post via API, auto-generates missing metadata via AI
3. `publish()` - Publishes the saved post
4. `send()` - Delivers to subscribers

### Internationalization
- `src/i18n/` with language files in `src/i18n/lang/`
- Supports: English, Japanese, Chinese (Simplified/Traditional)
- Use `t('key')` function for translations

## Key Dependencies
- `obsidian` - Obsidian plugin API
- `quail-js` - Quaily.com API client
- `dayjs` - Date formatting
- `qrcode` - QR code generation for mobile preview

## Frontmatter Fields
Required: `slug` (alphanumeric, dashes, underscores only)
Optional: `datetime`, `summary`, `tags`, `cover_image_url`, `title`, `theme`
