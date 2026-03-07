<?php

namespace App\Support;

use Illuminate\Http\Request;

class SecretMode
{
    public static function isActive(Request $request): bool
    {
        return $request->boolean('secret_mode')
            || $request->header('X-Secret-Mode') === 'true';
    }
}
