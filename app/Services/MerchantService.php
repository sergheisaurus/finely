<?php

namespace App\Services;

use App\Models\Merchant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MerchantService
{
    public function createMerchant(array $data): Merchant
    {
        if (isset($data['image_path'])) {
            $data['image_path'] = $this->handleImage($data['image_path']);
        }

        return Merchant::create($data);
    }

    public function updateMerchant(Merchant $merchant, array $data): Merchant
    {
        if (isset($data['image_path'])) {
            // Delete old image if it exists and is a local file
            if ($merchant->image_path && Storage::disk('public')->exists($merchant->image_path)) {
                Storage::disk('public')->delete($merchant->image_path);
            }

            $data['image_path'] = $this->handleImage($data['image_path']);
        }

        $merchant->update($data);

        return $merchant;
    }

    protected function handleImage(string $urlOrPath): ?string
    {
        if (empty($urlOrPath)) {
            return null;
        }

        // If it's already a local path (doesn't start with http), return as is
        if (!Str::startsWith($urlOrPath, ['http://', 'https://'])) {
            return $urlOrPath;
        }

        try {
            // Download the image
            $response = Http::timeout(10)->get($urlOrPath);

            if ($response->successful()) {
                $extension = pathinfo(parse_url($urlOrPath, PHP_URL_PATH), PATHINFO_EXTENSION);
                if (empty($extension)) {
                    $extension = 'png'; // Default to png if no extension found
                }
                // Sanitize extension
                $extension = substr($extension, 0, 4);

                $filename = 'merchants/' . Str::uuid() . '.' . $extension;
                
                Storage::disk('public')->put($filename, $response->body());

                return $filename;
            }
        } catch (\Exception $e) {
            // Log error?
            // Fallback to the original URL if download fails, so at least it displays (via the Resource fix)
            return $urlOrPath;
        }

        return $urlOrPath;
    }
}
