import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Bot, MessageSquare, Plus, Send, Settings, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ToolCall {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
}

interface Message {
    id: number;
    role: 'user' | 'model';
    content: string;
    meta_data?: {
        tool_calls?: ToolCall[];
    };
    created_at: string;
}

interface Conversation {
    id: number;
    title: string;
    updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Chat',
        href: '/chat',
    },
];

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<
        number | null
    >(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async (id: number) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/ai/conversations/${id}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            toast.error('Failed to load chat history');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/ai/conversations');
            setConversations(res.data);
            if (res.data.length > 0 && !activeConversationId) {
                // Optionally select the first one.
                setActiveConversationId(res.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    }, [activeConversationId]);

    // Fetch conversations on load
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        } else {
            setMessages([]);
        }
    }, [activeConversationId, fetchMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleNewChat = async () => {
        try {
            const res = await api.post('/ai/conversations', {
                title: 'New Conversation',
            });
            setConversations([res.data, ...conversations]);
            setActiveConversationId(res.data.id);
            setMessages([]);
        } catch (error) {
            console.error('Failed to create conversation:', error);
            toast.error('Failed to start new chat');
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?'))
            return;

        try {
            await api.delete(`/ai/conversations/${id}`);
            setConversations(conversations.filter((c) => c.id !== id));
            if (activeConversationId === id) {
                setActiveConversationId(null);
                setMessages([]);
            }
            toast.success('Conversation deleted');
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            toast.error('Failed to delete conversation');
        }
    };

    const sendMessage = async (conversationId: number, content: string) => {
        setIsSending(true);
        setInput('');

        // Optimistic update
        const tempId = Date.now();
        const userMsg: Message = {
            id: tempId,
            role: 'user',
            content: content,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
            const res = await api.post(
                `/ai/conversations/${conversationId}/messages`,
                { message: content },
            );
            const modelMsg = res.data.message;

            // Replace optimistically added message if needed (or just append model message)
            // Ideally we'd replace the temp ID with real ID, but appending model msg is key.
            setMessages((prev) => [...prev, modelMsg]);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
            // Remove optimistic message? or mark as failed
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        if (!activeConversationId) {
            // Create a new chat first if none selected
            try {
                const res = await api.post('/ai/conversations', {
                    title: 'New Conversation',
                });
                const newConvo = res.data;
                setConversations([newConvo, ...conversations]);
                setActiveConversationId(newConvo.id);
                // Now send message
                await sendMessage(newConvo.id, input.trim());
            } catch {
                toast.error('Failed to start chat');
            }
            return;
        }

        await sendMessage(activeConversationId, input.trim());
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Chat" />
            <div className="flex h-[calc(100vh-8rem)] gap-4 p-4 md:p-6">
                {/* Sidebar */}
                <Card className="flex w-64 flex-col overflow-hidden">
                    <div className="flex gap-2 border-b p-4">
                        <Button onClick={handleNewChat} className="flex-1">
                            <Plus className="mr-2 h-4 w-4" />
                            New Chat
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="AI Settings"
                        >
                            <Link href="/settings/ai">
                                <Settings className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-1 p-2">
                            {conversations.map((convo) => (
                                <button
                                    key={convo.id}
                                    onClick={() =>
                                        setActiveConversationId(convo.id)
                                    }
                                    className={cn(
                                        'flex items-center justify-between rounded-md p-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        activeConversationId === convo.id
                                            ? 'bg-accent text-accent-foreground'
                                            : '',
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                        <span className="truncate font-medium">
                                            {convo.title}
                                        </span>
                                    </div>
                                    <div
                                        role="button"
                                        onClick={(e) =>
                                            handleDeleteChat(e, convo.id)
                                        }
                                        className="rounded-sm p-1 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:opacity-100"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && (
                                <p className="p-4 text-center text-sm text-muted-foreground">
                                    No conversations yet.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Chat Area */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    {activeConversationId ? (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-hidden p-4">
                                <div
                                    ref={scrollRef}
                                    className="h-full space-y-4 overflow-y-auto pr-4"
                                >
                                    {isLoading ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                            <Bot className="mb-4 h-12 w-12 opacity-20" />
                                            <p>
                                                Start a conversation with Finely
                                                AI.
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    'flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3 text-sm',
                                                    msg.role === 'user'
                                                        ? 'ml-auto bg-primary text-primary-foreground'
                                                        : 'bg-muted',
                                                )}
                                            >
                                                {msg.meta_data?.tool_calls &&
                                                    msg.meta_data.tool_calls
                                                        .length > 0 && (
                                                        <div className="mb-2 space-y-2">
                                                            {msg.meta_data.tool_calls.map(
                                                                (
                                                                    tool: ToolCall,
                                                                    i: number,
                                                                ) => (
                                                                    <div
                                                                        key={i}
                                                                        className="rounded bg-background/50 p-2 text-xs"
                                                                    >
                                                                        <div className="flex items-center gap-1 font-semibold opacity-70">
                                                                            <Bot className="h-3 w-3" />
                                                                            Executed:{' '}
                                                                            {
                                                                                tool.name
                                                                            }
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
                                                {msg.content}
                                            </div>
                                        ))
                                    )}
                                    {isSending && (
                                        <div className="w-max rounded-lg bg-muted px-4 py-3 text-sm">
                                            <span className="animate-pulse">
                                                Thinking...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Input */}
                            <div className="border-t bg-background p-4">
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex gap-2"
                                >
                                    <Input
                                        placeholder="Type your message..."
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        disabled={isSending}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSending || !input.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <Bot className="mb-4 h-16 w-16 opacity-20" />
                            <h3 className="text-lg font-medium">
                                Finely AI Chat
                            </h3>
                            <p className="mt-2 max-w-md text-center">
                                Select a conversation from the sidebar or start
                                a new one to begin chatting with your personal
                                finance assistant.
                            </p>
                            <Button onClick={handleNewChat} className="mt-6">
                                Start New Chat
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
