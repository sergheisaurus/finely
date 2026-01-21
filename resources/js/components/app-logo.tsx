import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text leading-tight font-semibold text-transparent dark:from-emerald-400 dark:to-teal-400">
                    Finely
                </span>
            </div>
        </>
    );
}
