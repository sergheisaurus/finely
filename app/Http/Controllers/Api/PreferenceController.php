<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdatePreferenceRequest;
use App\Http\Resources\UserPreferenceResource;
use App\Models\UserPreference;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request): UserPreferenceResource
    {
        $preference = $request->user()->preference ?? UserPreference::create([
            'user_id' => $request->user()->id,
        ]);

        $preference->load(['defaultAccount', 'defaultCard']);

        return new UserPreferenceResource($preference);
    }

    public function update(UpdatePreferenceRequest $request): UserPreferenceResource
    {
        $preference = $request->user()->preference ?? UserPreference::create([
            'user_id' => $request->user()->id,
        ]);

        $preference->update($request->validated());
        $preference->load(['defaultAccount', 'defaultCard']);

        return new UserPreferenceResource($preference);
    }
}
