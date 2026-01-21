<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ai\GeminiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'history' => 'nullable|array', // Allow passing conversation history
        ]);

        $response = $this->geminiService->generateResponse(
            $request->message,
            $request->user()->id,
            $request->history ?? []
        );

        return response()->json([
            'message' => $response['text'],
            'tool_calls' => $response['tool_calls'],
        ]);
    }
}
