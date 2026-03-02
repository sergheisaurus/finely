import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <>
            <Head title="Log in" />

            <div className="relative min-h-svh overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 px-4 py-8 sm:px-6 md:py-12 lg:px-10 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/60">
                <div className="pointer-events-none absolute top-10 -left-24 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-700/30" />
                <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />

                <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center">
                    <Card className="w-full border-slate-300/70 bg-white/85 py-0 shadow-xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                        <CardHeader className="space-y-2 border-b border-slate-200/80 px-6 py-6 sm:px-8 dark:border-slate-700/80">
                            <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                                Log in
                            </CardTitle>
                            {status && (
                                <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    {status}
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="px-6 py-6 sm:px-8">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    Email address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="email@example.com"
                                                    className="border-slate-300/80 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="ml-auto text-sm"
                                                            tabIndex={5}
                                                        >
                                                            Forgot password?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    className="border-slate-300/80 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label htmlFor="remember">
                                                    Remember me
                                                </Label>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="h-11 w-full"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Log in
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
