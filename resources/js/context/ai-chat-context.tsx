import { createContext, type ReactNode, useContext, useState } from 'react';

interface ToolCall {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    tool_calls?: ToolCall[];
}

interface AiChatContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    clearHistory: () => void;
    conversationId: number | null;
    setConversationId: (id: number | null) => void;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export function AiChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);

    const addMessage = (message: Message) => {
        setMessages((prev) => [...prev, message]);
    };

    const clearHistory = () => {
        setMessages([]);
        setConversationId(null);
    };

    return (
        <AiChatContext.Provider
            value={{
                isOpen,
                setIsOpen,
                messages,
                setMessages,
                addMessage,
                isLoading,
                setIsLoading,
                clearHistory,
                conversationId,
                setConversationId,
            }}
        >
            {children}
        </AiChatContext.Provider>
    );
}

export function useAiChat() {
    const context = useContext(AiChatContext);
    if (context === undefined) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
}
