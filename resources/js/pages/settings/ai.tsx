import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Bot, Coins, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Assistant',
        href: '/settings/ai',
    },
];

interface AiStats {
    total_input_tokens: number;
    total_output_tokens: number;
    total_requests: number;
}

export default function AiSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [userContext, setUserContext] = useState('');
    const [coreInstructions, setCoreInstructions] = useState('');
    const [stats, setStats] = useState<AiStats | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, statsRes] = await Promise.all([
                    api.get('/settings/ai'),
                    api.get('/settings/ai/stats'),
                ]);

                setAiModel(settingsRes.data.ai_model || 'gemini-2.5-flash');
                setSystemPrompt(settingsRes.data.ai_system_prompt || '');
                setUserContext(settingsRes.data.ai_user_context || '');
                setCoreInstructions(settingsRes.data.core_instructions || '');
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to load AI settings:', error);
                toast.error('Failed to load AI settings');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/settings/ai', {
                ai_model: aiModel,
                ai_system_prompt: systemPrompt,
                ai_user_context: userContext,
            });
            toast.success('AI settings updated successfully');
        } catch (error) {
            console.error('Failed to update AI settings:', error);
            toast.error('Failed to update AI settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="AI Assistant" />
                <SettingsLayout>
                    <div className="space-y-6">
                        <div className="h-64 animate-pulse rounded-lg bg-muted" />
                    </div>
                </SettingsLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Assistant" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">AI Assistant</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure the behavior and monitor usage of your personal finance assistant.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Requests
                                </CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_requests || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Interactions with AI
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Input Tokens
                                </CardTitle>
                                <Coins className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_input_tokens?.toLocaleString() || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Sent to model
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Output Tokens
                                </CardTitle>
                                <Bot className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_output_tokens?.toLocaleString() || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Generated by model
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>
                                Customize how the AI interacts with you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ai_model">
                                    Gemini Model
                                </Label>
                                <Select
                                    value={aiModel}
                                    onValueChange={setAiModel}
                                >
                                    <SelectTrigger id="ai_model">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-2.5-flash">
                                            Gemini 2.5 Flash (Recommended)
                                        </SelectItem>
                                        <SelectItem value="gemini-2.0-flash">
                                            Gemini 2.0 Flash
                                        </SelectItem>
                                        <SelectItem value="gemini-1.5-flash">
                                            Gemini 1.5 Flash
                                        </SelectItem>
                                        <SelectItem value="gemini-pro">
                                            Gemini Pro
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Newer models may be smarter but might have different rate limits.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">
                                    Persona & Custom Instructions
                                </Label>
                                <Textarea
                                    id="system_prompt"
                                    placeholder="You are Finely AI, a helpful personal finance assistant..."
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Define the AI's personality and any specific rules you want it to follow.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user_context">
                                    About You (User Context)
                                </Label>
                                <Textarea
                                    id="user_context"
                                    placeholder="I am a freelance graphic designer living in Zurich. My main currency is CHF..."
                                    value={userContext}
                                    onChange={(e) => setUserContext(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tell the AI about yourself so it can provide more personalized responses.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="core_instructions">
                                    Core System Instructions (Read-only)
                                </Label>
                                <Textarea
                                    id="core_instructions"
                                    value={coreInstructions}
                                    readOnly
                                    className="bg-muted text-muted-foreground"
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    These are the mandatory rules the AI must follow to function correctly within the app. They are appended to your custom instructions.
                                </p>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : 'Save Configuration'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
