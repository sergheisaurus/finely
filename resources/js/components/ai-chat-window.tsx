import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAiChat } from '@/context/ai-chat-context';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Bot, Plus, Send, Settings, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ApiMessage {
    role: 'user' | 'model';
    content: string;
    meta_data?: {
        tool_calls?: {
            name: string;
            args: Record<string, unknown>;
            result?: unknown;
            error?: string;
        }[];
    };
}

export function AiChatWindow() {
    const {
        isOpen,
        setIsOpen,
        messages,
        addMessage,
        setMessages,
        isLoading,
        setIsLoading,
        clearHistory,
        conversationId,
        setConversationId,
    } = useAiChat();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Initialize conversation
    useEffect(() => {
        const initChat = async () => {
            if (isOpen && !isInitialized && !conversationId) {
                try {
                    const res = await api.get('/ai/conversations');
                    if (res.data.length > 0) {
                        const latestId = res.data[0].id;
                        setConversationId(latestId);

                        const msgRes = await api.get(
                            `/ai/conversations/${latestId}`,
                        );

                        const mappedMessages = msgRes.data.map(
                            (m: ApiMessage) => ({
                                role: m.role,
                                text: m.content,
                                tool_calls: m.meta_data?.tool_calls,
                            }),
                        );
                        setMessages(mappedMessages);
                    }
                } catch (error) {
                    console.error('Failed to init chat:', error);
                } finally {
                    setIsInitialized(true);
                }
            }
        };

        initChat();
    }, [isOpen, isInitialized, conversationId, setConversationId, setMessages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        addMessage({ role: 'user', text: userMessage });
        setIsLoading(true);

        try {
            let activeId = conversationId;

            if (!activeId) {
                const convoRes = await api.post('/ai/conversations', {
                    title: 'New Chat',
                });
                activeId = convoRes.data.id;
                setConversationId(activeId);
            }

            const response = await api.post(
                `/ai/conversations/${activeId}/messages`,
                {
                    message: userMessage,
                },
            );

            addMessage({
                role: 'model',
                text: response.data.message.content,
                tool_calls: response.data.tool_calls,
            });
        } catch (error) {
            console.error('AI Chat Error:', error);
            toast.error('Failed to get response from AI.');
            addMessage({
                role: 'model',
                text: 'Sorry, I encountered an error. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        clearHistory();
        setConversationId(null);
        setIsInitialized(true); // Prevent auto-reloading previous chat
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <Card className="fixed right-6 bottom-6 z-50 flex h-[500px] w-80 animate-in flex-col border-primary/20 shadow-2xl slide-in-from-bottom-10 fade-in sm:w-96">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-medium">
                        Finely AI
                    </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="AI Settings"
                    >
                        <Link href="/settings/ai">
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleNewChat}
                        title="New Conversation"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
                <div
                    ref={scrollRef}
                    className="h-full space-y-4 overflow-y-auto p-4"
                >
                    {messages.length === 0 && (
                        <div className="mt-10 px-4 text-center text-sm text-muted-foreground">
                            <Bot className="mx-auto mb-3 h-10 w-10 opacity-20" />
                            <p>Hi! I'm your Finely assistant.</p>
                            <p className="mt-2">
                                Ask me to check your budget, list transactions,
                                or add a new expense!
                            </p>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex w-max max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                                msg.role === 'user'
                                    ? 'ml-auto bg-primary text-primary-foreground'
                                    : 'bg-muted',
                            )}
                        >
                            {msg.tool_calls && msg.tool_calls.length > 0 && (
                                <div className="mb-2 space-y-2">
                                    {msg.tool_calls.map((tool, i) => (
                                        <div
                                            key={i}
                                            className="rounded bg-background/50 p-2 text-xs"
                                        >
                                            <p className="font-semibold">
                                                Tool: {tool.name}
                                            </p>
                                            {tool.error ? (
                                                <p className="text-red-500">
                                                    Error: {tool.error}
                                                </p>
                                            ) : (
                                                <pre className="mt-1 max-w-[250px] overflow-x-auto text-[10px] leading-relaxed break-words whitespace-pre-wrap opacity-80">
                                                    {JSON.stringify(
                                                        tool.result,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div>{msg.text}</div>
                        </div>
                    ))}
                </div>
            </CardContent>

            <CardFooter className="border-t bg-background p-3">
                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about transactions, budgets..."
                        className="h-10"
                    />
                    <Button type="submit" disabled={isLoading} size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
