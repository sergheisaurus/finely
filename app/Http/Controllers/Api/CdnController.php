<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use App\Services\Cdn\CdnClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CdnController extends Controller
{
    public function __construct(
        protected CdnClient $cdn,
    ) {}

    public function health(Request $request): JsonResponse
    {
        try {
            $stats = $this->cdn->stats();

            return response()->json([
                'ok' => true,
                'base_url' => $this->cdn->baseUrl(),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'base_url' => $this->cdn->baseUrl(),
                'error' => $e->getMessage(),
            ], 502);
        }
    }

    public function bootstrap(Request $request): JsonResponse
    {
        $configuredProjectId = config('cdn.project_id');

        $setting = IntegrationSetting::firstOrCreate([
            'key' => 'cdn.project',
        ]);

        $storedProjectId = $setting->value['project_id'] ?? null;
        $projectId = $configuredProjectId ?: $storedProjectId;

        // If we already have an id, verify it exists.
        if ($projectId) {
            $projects = $this->cdn->listProjects();
            $project = collect($projects)->firstWhere('id', $projectId);

            if ($project) {
                $setting->update([
                    'value' => [
                        'project_id' => $project['id'],
                        'name' => $project['name'] ?? null,
                    ],
                ]);

                return response()->json([
                    'ok' => true,
                    'project' => $project,
                    'stored' => true,
                ]);
            }
        }

        // Otherwise lookup by name and create if missing.
        $name = 'Finely';
        $projects = $this->cdn->listProjects();
        $existing = collect($projects)->first(function (array $p) use ($name): bool {
            return strtolower((string) ($p['name'] ?? '')) === strtolower($name);
        });

        $project = $existing ?: $this->cdn->createProject([
            'name' => $name,
            'description' => 'Finely uploads and attachments',
        ]);

        $setting->update([
            'value' => [
                'project_id' => $project['id'],
                'name' => $project['name'] ?? $name,
            ],
        ]);

        return response()->json([
            'ok' => true,
            'project' => $project,
            'stored' => true,
        ]);
    }

    public function media(Request $request, string $file): Response
    {
        try {
            $details = $this->cdn->fileDetails($file);
        } catch (RequestException $e) {
            if ($e->response?->status() === 404) {
                // Backwards-compat: some records may still store the upload session id.
                // Try resolving session -> result_file_id, then fetch the file.
                try {
                    $status = $this->cdn->uploadStatus($file);
                    $resolvedFileId = (string) ($status['result_file_id'] ?? '');

                    if ($resolvedFileId !== '') {
                        $details = $this->cdn->fileDetails($resolvedFileId);
                        $file = $resolvedFileId;
                    } else {
                        return response('File not found', 404);
                    }
                } catch (\Throwable) {
                    return response('File not found', 404);
                }
            } else {
                report($e);

                return response('CDN file lookup failed', 502);
            }
        } catch (\Throwable $e) {
            report($e);

            return response('CDN file lookup failed', 502);
        }

        $variant = $request->string('variant')->toString();
        $preferThumbnail = $variant === 'thumbnail';

        $path = $preferThumbnail
            ? ($details['thumbnail'] ?? $details['file'] ?? null)
            : ($details['file'] ?? $details['thumbnail'] ?? null);

        if (! is_string($path) || $path === '') {
            return response('File not found', 404);
        }

        $baseUrl = rtrim($this->cdn->baseUrl(), '/');
        if ($baseUrl === '') {
            return response('CDN is not configured', 502);
        }

        $url = Str::startsWith($path, ['http://', 'https://'])
            ? $path
            : $baseUrl.'/'.ltrim($path, '/');

        $http = Http::timeout(config('cdn.timeout', 15));

        // If using WAN route, include Pangolin Basic Auth for media as well.
        $wan = rtrim((string) config('cdn.wan_base_url', ''), '/');
        if ($wan !== '' && Str::startsWith($baseUrl, $wan)) {
            $pangolin = config('cdn.pangolin_basic_auth');
            if (is_string($pangolin) && $pangolin !== '') {
                $http = $http->withHeaders(['Authorization' => $pangolin]);
            }
        }

        // Pass through Range requests (useful for large media).
        if ($request->headers->has('Range')) {
            $http = $http->withHeaders([
                'Range' => (string) $request->header('Range'),
            ]);
        }

        $res = $http->get($url);

        if (! $res->successful()) {
            return response('File fetch failed', $res->status());
        }

        $status = $res->status();

        return response($res->body(), $status)
            ->header('Content-Type', $res->header('Content-Type', 'application/octet-stream'))
            ->header('Accept-Ranges', $res->header('Accept-Ranges', 'bytes'))
            ->header('Content-Range', $res->header('Content-Range'))
            ->header('Cache-Control', 'public, max-age=86400');
    }
}
