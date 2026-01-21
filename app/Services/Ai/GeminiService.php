<?php

namespace App\Services\Ai;

use App\Models\AiTokenLog;
use App\Models\UserPreference;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public const CORE_INSTRUCTIONS = "You have access to tools to manage transactions, accounts, categories, and merchants.
    RULES:
    1. EXECUTE TOOLS IMMEDIATELY. Do not describe what you are going to do. Just do it.
    2. If you need to create a merchant/category AND a transaction, call both tools in the same turn if possible.
    3. When creating transactions, you MUST ensure a payment method (account or card), category, and merchant are identified.
    4. If a dependency (like a merchant) is missing, CREATE IT FIRST using the appropriate tool. Do not hallucinate IDs.
    5. Ask questions only if you absolutely cannot proceed without user input.
    6. MANDATORY SUBCATEGORY CHECK: Before creating a new category, you MUST call 'get_categories' to see if a suitable parent exists. Always prefer creating a subcategory (by setting parent_id) over a top-level category. For example, 'Uber' should be a subcategory of 'Transportation'.
    7. ALWAYS provide a natural language confirmation after you have finished executing tools. Tell the user exactly what you did (e.g., 'I've recorded your $15 lunch at McDonald\'s').
    8. Be concise.";

    public function __construct(
        protected AiToolRegistry $toolRegistry
    ) {}

    public function generateResponse(string $prompt, int $userId, array $history = []): array
    {
        $apiKey = config('services.gemini.api_key');

        if (!$apiKey) {
            return ['text' => "Error: Gemini API key is not configured.", 'tool_calls' => []];
        }

        $preference = UserPreference::where('user_id', $userId)->first();
        $model = $preference->ai_model ?? 'gemini-2.5-flash';
        $userPersona = $preference->ai_system_prompt ?? "You are Finely AI, a helpful personal finance assistant.";
        $userContext = $preference->ai_user_context ? "\n\nUSER CONTEXT:\n" . $preference->ai_user_context : "";
        
        $combinedSystemPrompt = $userPersona . $userContext . "\n\n" . self::CORE_INSTRUCTIONS;

        $tools = $this->toolRegistry->getTools();
        
        $geminiTools = [
            'function_declarations' => array_map(function ($tool) {
                return [
                    'name' => $tool['name'],
                    'description' => $tool['description'],
                    'parameters' => $tool['parameters'],
                ];
            }, $tools),
        ];

        $systemInstruction = [
            'parts' => [
                ['text' => $combinedSystemPrompt]
            ]
        ];

        $contents = $history;
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $prompt]],
        ];

        $payload = [
            'system_instruction' => $systemInstruction,
            'contents' => $contents,
            'tools' => [$geminiTools],
            'generationConfig' => [
                'temperature' => 0.7,
            ]
        ];

        return $this->callGemini($payload, $userId, $apiKey, $geminiTools, $model);
    }

    protected function callGemini(array $payload, int $userId, string $apiKey, array $geminiTools, string $model, int $retryCount = 0): array
    {
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/models/{$model}:generateContent?key={$apiKey}", $payload);

        if ($response->failed()) {
            if ($response->status() === 429 && $retryCount < 3) {
                Log::warning("Gemini 429 Error. Retrying... (Attempt " . ($retryCount + 1) . ")");
                sleep(2 * ($retryCount + 1));
                return $this->callGemini($payload, $userId, $apiKey, $geminiTools, $model, $retryCount + 1);
            }
            Log::error('Gemini API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return ['text' => "I encountered an error communicating with the AI service.", 'tool_calls' => []];
        }

        $data = $response->json();
        $this->logTokenUsage($userId, $data, $model);

        $candidate = $data['candidates'][0] ?? null;
        if (!$candidate) {
            return ['text' => "I couldn't generate a response.", 'tool_calls' => []];
        }

        $parts = $candidate['content']['parts'] ?? [];
        $functionCalls = [];

        // Collect all function calls from parts
        foreach ($parts as $part) {
            if (isset($part['functionCall'])) {
                $functionCalls[] = $part['functionCall'];
            }
        }

        if (!empty($functionCalls)) {
            return $this->processFunctionCalls($functionCalls, $payload['contents'], $candidate['content'], $userId, $apiKey, $geminiTools, $model);
        }

        // Collect text response
        $responseText = '';
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $responseText .= $part['text'];
            }
        }

        return ['text' => $responseText ?: "I've completed the requested actions.", 'tool_calls' => []];
    }

    protected function processFunctionCalls(array $functionCalls, array $history, array $modelContent, int $userId, string $apiKey, array $geminiTools, string $model): array
    {
        // Sanitize model content to ensure empty args are objects (Map) not arrays (List)
        if (isset($modelContent['parts'])) {
            foreach ($modelContent['parts'] as &$part) {
                if (isset($part['functionCall'])) {
                    // Ensure args is an object if it exists, or if it's empty array
                    if (isset($part['functionCall']['args']) && is_array($part['functionCall']['args']) && empty($part['functionCall']['args'])) {
                        $part['functionCall']['args'] = (object)[];
                    }
                }
            }
        }

        // Add the model's response (with function calls) to history
        $history[] = $modelContent;

        $toolOutputs = [];
        $executedTools = [];

        foreach ($functionCalls as $call) {
            $name = $call['name'];
            $args = $call['args'] ?? [];

            try {
                Log::info("Executing AI Tool: {$name}", $args);
                $result = $this->toolRegistry->executeTool($name, $args, $userId);
                
                if (is_object($result) && method_exists($result, 'toArray')) {
                    $result = $result->toArray();
                }

                $toolOutputs[] = [
                    'functionResponse' => [
                        'name' => $name,
                        'response' => ['result' => $result]
                    ]
                ];
                
                $executedTools[] = [
                    'name' => $name,
                    'args' => $args,
                    'result' => $result, // We can truncate this if it's too large for frontend display later
                ];

            } catch (\Exception $e) {
                Log::error("AI Tool Execution Error: " . $e->getMessage());
                $toolOutputs[] = [
                    'functionResponse' => [
                        'name' => $name,
                        'response' => ['error' => $e->getMessage()]
                    ]
                ];
                
                $executedTools[] = [
                    'name' => $name,
                    'args' => $args,
                    'error' => $e->getMessage(),
                ];
            }
        }

        // Add tool outputs to history
        $history[] = [
            'role' => 'function',
            'parts' => $toolOutputs
        ];

        // Recursive call with updated history
        $payload = [
            'contents' => $history,
            'tools' => [$geminiTools],
        ];

        $preference = UserPreference::where('user_id', $userId)->first();
        $userPersona = $preference->ai_system_prompt ?? "You are Finely AI, a helpful personal finance assistant.";
        $userContext = $preference->ai_user_context ? "\n\nUSER CONTEXT:\n" . $preference->ai_user_context : "";
        $combinedSystemPrompt = $userPersona . $userContext . "\n\n" . self::CORE_INSTRUCTIONS;
        
        $payload['system_instruction'] = [
            'parts' => [['text' => $combinedSystemPrompt]]
        ];

        $nextResponse = $this->callGemini($payload, $userId, $apiKey, $geminiTools, $model);

        // Merge the current executed tools with any subsequent ones
        return [
            'text' => $nextResponse['text'],
            'tool_calls' => array_merge($executedTools, $nextResponse['tool_calls']),
        ];
    }

    protected function logTokenUsage(int $userId, array $data, string $model): void
    {
        if (isset($data['usageMetadata'])) {
            AiTokenLog::create([
                'user_id' => $userId,
                'input_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                'output_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                'model' => $model,
            ]);
        }
    }
}
