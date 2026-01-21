<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Services\Ai\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiChatController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    public function index(Request $request)
    {
        return $request->user()->aiConversations()
            ->orderBy('updated_at', 'desc')
            ->take(20)
            ->get();
    }

    public function store(Request $request)
    {
        $conversation = $request->user()->aiConversations()->create([
            'title' => 'New Chat',
        ]);

        return response()->json($conversation);
    }

    public function show(Request $request, AiConversation $conversation)
    {
        $this->authorize('view', $conversation);

        return $conversation->messages()->orderBy('created_at')->get();
    }

    public function destroy(Request $request, AiConversation $conversation)
    {
        $this->authorize('delete', $conversation);
        $conversation->delete();
        return response()->noContent();
    }

    public function sendMessage(Request $request, AiConversation $conversation)
    {
        $this->authorize('update', $conversation);

        $request->validate(['message' => 'required|string']);

        // 1. Save User Message
        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $request->message,
        ]);

        // 2. Build History for Gemini
        $history = $conversation->messages()
            ->where('id', '<', $userMessage->id)
            ->orderBy('created_at')
            ->get()
            ->map(function ($msg) {
                if ($msg->role === 'user') {
                    return ['role' => 'user', 'parts' => [['text' => $msg->content]]];
                } elseif ($msg->role === 'model') {
                    $parts = [];
                    if ($msg->content) {
                        $parts[] = ['text' => $msg->content];
                    }
                    // Reconstruct tool calls if present in meta_data? 
                    // For now, let's keep it simple and send text context.
                    // Complex tool state reconstruction is tricky without storing exact raw parts.
                    return ['role' => 'model', 'parts' => $parts];
                }
                // Handle 'function' role if I decide to store tool outputs explicitly later
                return null; 
            })
            ->filter()
            ->values()
            ->toArray();

        // 3. Call Gemini
        $response = $this->geminiService->generateResponse(
            $request->message,
            $request->user()->id,
            $history
        );

        // 4. Save Model Message
        $modelMessage = $conversation->messages()->create([
            'role' => 'model',
            'content' => $response['text'],
            'meta_data' => !empty($response['tool_calls']) ? ['tool_calls' => $response['tool_calls']] : null,
        ]);

        // 5. Update Conversation Title (if it's the first message interaction, maybe summarize?)
        // For now, just touch updated_at
        $conversation->touch();

        return response()->json([
            'message' => $modelMessage,
            'tool_calls' => $response['tool_calls']
        ]);
    }
}
