// Fallback typings for Wayfinder-generated modules.
//
// In this repo, route helpers (`@/routes/*`) and action helpers (`@/actions/*`)
// are generated at build time and gitignored. When PHP/Wayfinder generation
// isn't available locally, `npm run types` would otherwise fail.

declare module '@/routes' {
    export const dashboard: any;
    export const journal: any;
    export const logout: any;
    export const login: any;
    export const register: any;
}

declare module '@/routes/pages' {
    export const dashboard: any;
    export const journal: any;
}

declare module '@/routes/appearance' {
    export const edit: any;
}

declare module '@/routes/profile' {
    export const edit: any;
}

declare module '@/routes/user-password' {
    export const edit: any;
}

declare module '@/routes/verification' {
    export const send: any;
}

declare module '@/routes/two-factor' {
    export const show: any;
    export const enable: any;
    export const disable: any;
    export const confirm: any;
    export const regenerateRecoveryCodes: any;
    export const qrCode: any;
    export const recoveryCodes: any;
    export const secretKey: any;
}

declare module '@/routes/two-factor/login' {
    export const store: any;
}

declare module '@/routes/login' {
    export const store: any;
}

declare module '@/routes/register' {
    export const store: any;
}

declare module '@/routes/password' {
    export const request: any;
    export const email: any;
    export const update: any;
}

declare module '@/routes/password/confirm' {
    export const store: any;
}

declare module '@/actions/App/Http/Controllers/Settings/ProfileController' {
    const ProfileController: any;
    export default ProfileController;
}

declare module '@/actions/App/Http/Controllers/Settings/PasswordController' {
    const PasswordController: any;
    export default PasswordController;
}

declare module '@/actions/*' {
    const actionModule: any;
    export default actionModule;
}
