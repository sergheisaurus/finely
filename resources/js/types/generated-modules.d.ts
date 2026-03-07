// Fallback typings for Wayfinder-generated modules.
//
// In this repo, route helpers (`@/routes/*`) and action helpers (`@/actions/*`)
// are generated at build time and gitignored. When PHP/Wayfinder generation
// isn't available locally, `npm run types` would otherwise fail.

type WayfinderResult = {
    url: string;
    method: import('@inertiajs/core').Method;
};

type WayfinderFormFactory = (...args: unknown[]) => Record<string, unknown>;

type WayfinderCallable = {
    (...args: unknown[]): WayfinderResult;
    url: (...args: unknown[]) => string;
    method: (...args: unknown[]) => import('@inertiajs/core').Method;
    form: WayfinderFormFactory;
};

type WayfinderControllerAction = {
    form: WayfinderFormFactory;
    url: (...args: unknown[]) => string;
};

type WayfinderController = Record<string, WayfinderControllerAction>;

declare module '@/routes' {
    export const dashboard: WayfinderCallable;
    export const journal: WayfinderCallable;
    export const logout: WayfinderCallable;
    export const login: WayfinderCallable;
    export const register: WayfinderCallable;
}

declare module '@/routes/pages' {
    export const dashboard: WayfinderCallable;
    export const journal: WayfinderCallable;
}

declare module '@/routes/appearance' {
    export const edit: WayfinderCallable;
}

declare module '@/routes/profile' {
    export const edit: WayfinderCallable;
}

declare module '@/routes/user-password' {
    export const edit: WayfinderCallable;
}

declare module '@/routes/verification' {
    export const send: WayfinderCallable;
}

declare module '@/routes/two-factor' {
    export const show: WayfinderCallable;
    export const enable: WayfinderCallable;
    export const disable: WayfinderCallable;
    export const confirm: WayfinderCallable;
    export const regenerateRecoveryCodes: WayfinderCallable;
    export const qrCode: WayfinderCallable;
    export const recoveryCodes: WayfinderCallable;
    export const secretKey: WayfinderCallable;
}

declare module '@/routes/two-factor/login' {
    export const store: WayfinderCallable;
}

declare module '@/routes/login' {
    export const store: WayfinderCallable;
}

declare module '@/routes/register' {
    export const store: WayfinderCallable;
}

declare module '@/routes/password' {
    export const request: WayfinderCallable;
    export const email: WayfinderCallable;
    export const update: WayfinderCallable;
}

declare module '@/routes/password/confirm' {
    export const store: WayfinderCallable;
}

declare module '@/actions/App/Http/Controllers/Settings/ProfileController' {
    const ProfileController: WayfinderController;
    export default ProfileController;
}

declare module '@/actions/App/Http/Controllers/Settings/PasswordController' {
    const PasswordController: WayfinderController;
    export default PasswordController;
}

declare module '@/actions/*' {
    const actionModule: WayfinderController;
    export default actionModule;
}
