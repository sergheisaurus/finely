<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\AiTokenLog;
use App\Models\UserPreference;
use App\Services\Ai\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiSettingsController extends Controller
{
    public function show(Request $request)
    {
        $preferences = UserPreference::firstOrCreate(['user_id' => $request->user()->id]);
        
        return response()->json([
            'ai_model' => $preferences->ai_model ?? 'gemini-2.5-flash',
            'ai_system_prompt' => $preferences->ai_system_prompt,
            'ai_user_context' => $preferences->ai_user_context,
            'core_instructions' => GeminiService::CORE_INSTRUCTIONS,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'ai_model' => 'required|string',
            'ai_system_prompt' => 'nullable|string',
            'ai_user_context' => 'nullable|string',
        ]);

        $preferences = UserPreference::firstOrCreate(['user_id' => $request->user()->id]);
        $preferences->update($validated);

        return response()->json($preferences);
    }

    public function stats(Request $request)
    {
        $stats = AiTokenLog::where('user_id', $request->user()->id)
            ->select(
                DB::raw('SUM(input_tokens) as total_input_tokens'),
                DB::raw('SUM(output_tokens) as total_output_tokens'),
                DB::raw('COUNT(*) as total_requests')
            )
            ->first();

        return response()->json($stats);
    }
}
