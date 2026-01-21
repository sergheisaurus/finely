# AGENTS.md

This repository is a Laravel 12 + Inertia.js + React 19 + TypeScript app.
This document is written for agentic coding agents working in this repo.

## Quickstart
- Install everything + migrate + build:
  - `composer setup`
- Run dev (PHP server + queue + logs + Vite):
  - `composer dev`
- Run tests:
  - `composer test`

## Commands

### Setup / Dev
- One-time setup (installs deps, migrates, builds): `composer setup`
- Dev (server + queue + logs + Vite): `composer dev`
- SSR dev: `composer dev:ssr`

### Build / Lint / Format / Types
- Frontend dev: `npm run dev`
- Frontend build: `npm run build`
- Frontend build (SSR): `npm run build:ssr`
- PHP format: `./vendor/bin/pint`
- Frontend format (writes): `npm run format`
- Frontend format check: `npm run format:check`
- Frontend lint (auto-fixes): `npm run lint`
- Typecheck: `npm run types`

### Tests
- Full suite (clears config first): `composer test`
- Laravel runner: `php artisan test`
- Pest directly: `./vendor/bin/pest`

#### Run a single test (important)
- One file: `./vendor/bin/pest tests/Feature/YourTest.php`
- By test name (substring): `./vendor/bin/pest --filter="creates a transaction"`
- Laravel filter: `php artisan test --filter=TestName`
- Specific method: `./vendor/bin/pest --filter="::test_it_does_x"`

## CI parity (GitHub Actions)
- `.github/workflows/tests.yml`:
  - `npm ci`, `composer install`, `npm run build`, `./vendor/bin/pest`
- `.github/workflows/lint.yml`:
  - `vendor/bin/pint`, `npm run format`, `npm run lint`

## Generated / Ignored Files (Do Not Commit)
These are generated and gitignored (see `.gitignore`):
- `resources/js/wayfinder` (Wayfinder-generated TS route helpers)
- `resources/js/routes`, `resources/js/actions` (generated)
- `public/build`, `public/hot`, `bootstrap/ssr`, `vendor`, `node_modules`
- `.env*` (never commit secrets)

If route helpers look missing/outdated, regenerate via Vite:
- `npm run dev` or `npm run build`

## Cursor / Copilot Rules
- No Cursor rules detected (`.cursor/rules/**` or `.cursorrules`).
- No Copilot instructions detected (`.github/copilot-instructions.md`).

## Project Map
- Web/Inertia pages: `routes/web.php` + `resources/js/pages/**`
- Settings pages: `routes/settings.php`
- API (Sanctum): `routes/api.php` + `app/Http/Controllers/Api/**`
- Services (domain logic): `app/Services/**`
- API resources (response shape): `app/Http/Resources/**`
- Frontend API client: `resources/js/lib/api.ts`

## Code Style (General)
- Prefer small, readable, composable functions over clever abstractions.
- Keep controllers thin; put domain logic into `app/Services/*`.
- Match existing patterns in the area you touch.
- Avoid introducing new dependencies unless necessary.

## PHP / Laravel Guidelines
- Formatting:
  - Run `./vendor/bin/pint`; CI expects Pint style.
- Types:
  - Add return types to public methods where practical.
  - Prefer constructor property promotion for dependencies.
- Validation:
  - Prefer `FormRequest` classes in `app/Http/Requests/**`.
  - Use `$request->validated()` as the source of truth.
  - Use `withValidator()->after(...)` for cross-field rules.
- Authorization:
  - Use policies via `$this->authorize(...)` in controllers.
- DB safety:
  - Use `DB::transaction(...)` for multi-write operations.
- API responses:
  - Prefer `JsonResource` classes in `app/Http/Resources/**`.

## TypeScript / React Guidelines
- Formatting (authoritative):
  - `.prettierrc`: `tabWidth: 4`, `printWidth: 80`, `semi: true`, `singleQuote: true`.
  - Run `npm run format` after changes.
- Imports:
  - Use `@/*` alias for app imports (configured in `tsconfig.json`).
  - Use `import type { ... }` for type-only imports.
  - Let `prettier-plugin-organize-imports` handle sorting/removals.
- Types:
  - `tsconfig.json` is strict; avoid `any`.
  - Prefer `unknown` + narrowing for untrusted data.
- Naming:
  - React components: `PascalCase`.
  - Hooks: `useSomething` in `use-something.tsx`.
  - Pages typically default-export a component.
- Error handling:
  - Use `resources/js/lib/api.ts` for API calls.
  - 422 validation errors are intentionally not toasted; forms should handle.
  - Use user-friendly toasts for 401/403/404/419/500; log details to console.

## Editor / Whitespace

- `.editorconfig`:
  - `indent_size = 4`, `indent_style = space`, `end_of_line = lf`.
  - Markdown keeps trailing whitespace; YAML uses 2-space indentation.
- ESLint is flat-config (`eslint.config.js`) and includes `eslint-config-prettier`
  to avoid fighting Prettier.

## Inertia / Routing
- Inertia page resolution:
  - `resources/js/app.tsx` resolves `./pages/${name}.tsx`.
  - `Inertia::render('foo/bar')` must map to `resources/js/pages/foo/bar.tsx`.
- Prefer type-safe routing when available:
  - Wayfinder helpers are generated (gitignored). Do not hand-edit them.

## Tailwind / UI
- Prefer existing primitives in `resources/js/components/ui/*` (Radix-based).
- Use `cn(...)` from `resources/js/lib/utils.ts` for conditional class merging.
- Tailwind ordering is enforced by Prettier; don’t hand-sort.

### Radix Select Pitfall (Important)

Radix Select does NOT allow empty string values. Use a sentinel for "All".

```tsx
<Select
    value={categoryId || '__all__'}
    onValueChange={(v) => setCategoryId(v === '__all__' ? '' : v)}
>
    <SelectItem value="__all__">All Categories</SelectItem>
</Select>
```
