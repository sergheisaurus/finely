# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Laravel 12 + React 19 + Inertia.js application with TypeScript, using Laravel Fortify for authentication and Laravel Wayfinder for type-safe routing. The project uses Pest for testing and includes a complete authentication system with two-factor authentication support.

## Development Commands

### Initial Setup
```bash
composer setup
```
This runs installation, env setup, key generation, migrations, and frontend build.

### Development Server
```bash
composer dev
```
Starts 4 concurrent processes: PHP server, queue worker, log viewer (Pail), and Vite dev server.

For SSR development:
```bash
composer dev:ssr
```

### Testing
Run all tests:
```bash
composer test
# or directly
php artisan test
```

Run a single test file:
```bash
php artisan test --filter=TestName
# or with Pest
./vendor/bin/pest tests/Feature/YourTest.php
```

Run a specific test:
```bash
./vendor/bin/pest --filter="test name"
```

### Code Quality

Lint and auto-fix PHP code:
```bash
./vendor/bin/pint
```

Lint and auto-fix TypeScript/React:
```bash
npm run lint
```

Format frontend code:
```bash
npm run format
npm run format:check  # check only
```

Type checking:
```bash
npm run types
```

### Build

Development build:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

SSR build:
```bash
npm run build:ssr
```

## Architecture

### Backend Structure

**Authentication**: Uses Laravel Fortify with custom Inertia.js views. All authentication views and logic are configured in `app/Providers/FortifyServiceProvider.php`. Custom actions for user creation and password reset are in `app/Actions/Fortify/`.

**Routes**:
- `routes/web.php` - Main application routes
- `routes/settings.php` - Settings-related routes (profile, password, 2FA, appearance)
- `routes/api.php` - API routes (uses Sanctum for authentication)
- `routes/console.php` - Artisan console commands

**Inertia Shared Data**: Configured in `app/Http/Middleware/HandleInertiaRequests.php`. Shares:
- App name and quote
- Auth user
- Sidebar state (from cookies)

### Frontend Structure

**Entry Point**: `resources/js/app.tsx` initializes Inertia with React 19 in StrictMode. SSR entry is in `resources/js/ssr.tsx`.

**Page Resolution**: Pages are auto-loaded from `resources/js/pages/` using Vite glob imports. Inertia expects kebab-case paths that map to page components.

**Layouts**:
- `resources/js/layouts/app-layout.tsx` - Main app layout
- `resources/js/layouts/auth-layout.tsx` - Auth pages layout
- `resources/js/layouts/settings/layout.tsx` - Settings pages layout
- Various sub-layouts in `layouts/app/` and `layouts/auth/`

**Type-Safe Routing**: Laravel Wayfinder generates TypeScript route helpers from Laravel routes. Located in `resources/js/wayfinder/index.ts`. Use these instead of hardcoded URLs.

**UI Components**: Uses Radix UI primitives with custom wrappers in `resources/js/components/ui/`. Components follow shadcn/ui patterns.

**Styling**: Tailwind CSS 4 with the Vite plugin. Theme management via `resources/js/hooks/use-appearance.tsx`.

**React Compiler**: Enabled via `babel-plugin-react-compiler` in Vite config for automatic optimization.

### Key Dependencies

- **Inertia.js**: SPA experience without building an API
- **Laravel Fortify**: Authentication backend (registration, login, password reset, 2FA)
- **Laravel Sanctum**: API authentication
- **Laravel Wayfinder**: Type-safe route generation for TypeScript
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS 4**: Utility-first CSS framework

## Testing

Tests use Pest with Laravel-specific plugins. Feature tests automatically use `RefreshDatabase` trait (configured in `tests/Pest.php`).

Test location: `tests/Feature/` and `tests/Unit/`

Custom expectations can be added in `tests/Pest.php`.

## Important Patterns

**Creating New Pages**:
1. Add route in `routes/web.php` or appropriate route file
2. Create page component in `resources/js/pages/` matching the Inertia render name
3. Wayfinder will auto-generate type-safe route helper on next build

**Adding Settings Pages**: Follow the pattern in `routes/settings.php` - routes are under `settings/*` and use the settings layout.

**Shared Inertia Data**: Modify `app/Http/Middleware/HandleInertiaRequests.php` to add globally available props.

**Form Requests**: Custom validation requests go in `app/Http/Requests/`. See `Settings/ProfileUpdateRequest.php` for example.

## Common Pitfalls

**Radix UI Select Empty Values**: `<SelectItem value="">` is NOT allowed - Radix Select throws an error because empty string is reserved for clearing the selection. When you need an "All" or "None" option, use a sentinel value:
```tsx
// BAD - will throw error
<SelectItem value="">All Categories</SelectItem>

// GOOD - use sentinel value
<Select
    value={categoryId || '__all__'}
    onValueChange={(v) => setCategoryId(v === '__all__' ? '' : v)}
>
    <SelectItem value="__all__">All Categories</SelectItem>
</Select>
```

## Notes

- The app uses React 19's new features and automatic JSX transform
- SSR support is available but optional
- Queue system is used (development runs with `queue:listen`)
- Pail provides real-time log viewing in development
- Sidebar state persists via cookies
