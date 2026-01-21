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
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { Bot, MessageCircle, Plus, Send, Settings, X } from 'lucide-react';
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

export function AiChat() {
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
                    // Fetch latest conversation
                    const res = await axios.get('/api/ai/conversations');
                    if (res.data.length > 0) {
                        const latestId = res.data[0].id;
                        setConversationId(latestId);

                        // Fetch messages for it
                        const msgRes = await axios.get(
                            `/api/ai/conversations/${latestId}`,
                        );
                        // Map backend messages to frontend format
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

            // If no conversation, create one first
            if (!activeId) {
                const convoRes = await axios.post('/api/ai/conversations', {
                    title: 'New Chat',
                });
                activeId = convoRes.data.id;
                setConversationId(activeId);
            }

            const response = await axios.post(
                `/api/ai/conversations/${activeId}/messages`,
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

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
                    size="icon"
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
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
                                        Ask me to check your budget, list
                                        transactions, or add a new expense!
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
                                    {msg.tool_calls &&
                                        msg.tool_calls.length > 0 && (
                                            <div className="mb-2 space-y-2">
                                                {msg.tool_calls.map(
                                                    (tool, i) => (
                                                        <div
                                                            key={i}
                                                            className="rounded bg-background/50 p-2 text-xs"
                                                        >
                                                            <div className="flex items-center gap-1 font-semibold opacity-70">
                                                                <Bot className="h-3 w-3" />
                                                                Executed:{' '}
                                                                {tool.name}
                                                            </div>
                                                            <div className="mt-1 truncate font-mono opacity-60">
                                                                {JSON.stringify(
                                                                    tool.args,
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    {msg.text}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="w-max rounded-lg bg-muted px-3 py-2 text-sm">
                                    <span className="animate-pulse">
                                        Processing...
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="border-t bg-background p-3">
                        <form
                            onSubmit={handleSubmit}
                            className="flex w-full gap-2"
                        >
                            <Input
                                ref={inputRef}
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
