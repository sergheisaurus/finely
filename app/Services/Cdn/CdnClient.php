<?php

namespace App\Services\Cdn;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class CdnClient
{
    protected ?string $resolvedBaseUrl = null;

    protected function resolveBaseUrl(): string
    {
        // Legacy override.
        $forced = config('cdn.base_url');
        if (is_string($forced) && $forced !== '') {
            return rtrim($forced, '/');
        }

        if (is_string($this->resolvedBaseUrl) && $this->resolvedBaseUrl !== '') {
            return $this->resolvedBaseUrl;
        }

        $lan = rtrim((string) config('cdn.lan_base_url'), '/');
        $wan = rtrim((string) config('cdn.wan_base_url'), '/');

        // Prefer LAN if it responds quickly.
        try {
            $token = (string) config('cdn.api_token');
            $probe = Http::baseUrl($lan)
                ->acceptJson()
                ->timeout((int) config('cdn.probe_timeout', 2));

            if ($token !== '') {
                $probe = $probe->withHeaders(['X-Api-Token' => $token]);
            }

            $res = $probe->get('/api/stats/dashboard/');

            // If we got any HTTP response, the LAN endpoint is reachable.
            // It may still be unauthorized if the API token is missing, but WAN won't fix that.
            if ($res->status() > 0) {
                return $this->resolvedBaseUrl = $lan;
            }
        } catch (\Throwable) {
            // Ignore and fall back to WAN.
        }

        return $this->resolvedBaseUrl = $wan;
    }

    protected function pangolinAuthHeader(): ?string
    {
        $h = config('cdn.pangolin_basic_auth');
        if (! is_string($h) || $h === '') {
            return null;
        }

        return str_starts_with($h, 'Basic ') ? $h : ('Basic '.$h);
    }

    protected function request(): PendingRequest
    {
        $baseUrl = $this->resolveBaseUrl();

        $token = config('cdn.api_token');

        $req = Http::baseUrl($baseUrl)
            ->acceptJson()
            ->asJson()
            ->timeout(config('cdn.timeout', 15));

        // Pangolin proxy auth (WAN only).
        $wan = rtrim((string) config('cdn.wan_base_url'), '/');
        if ($wan !== '' && str_starts_with($baseUrl, $wan)) {
            $pangolin = $this->pangolinAuthHeader();
            if ($pangolin) {
                $req = $req->withHeaders(['Authorization' => $pangolin]);
            }
        }

        if ($token) {
            $req = $req->withHeaders([
                'X-Api-Token' => $token,
            ]);
        }

        return $req;
    }

    /**
     * Calls CDN stats endpoint to verify connectivity.
     */
    public function stats(): array
    {
        $res = $this->request()->get('/api/stats/dashboard/');
        $res->throw();

        return (array) $res->json();
    }

    public function listProjects(): array
    {
        $res = $this->request()->get('/api/projects/');
        $res->throw();

        return (array) $res->json();
    }

    public function createProject(array $payload): array
    {
        $res = $this->request()->post('/api/projects/', $payload);
        $res->throw();

        return (array) $res->json();
    }

    public function listFolders(string $projectId): array
    {
        $res = $this->request()->get('/api/folders/', [
            'project' => $projectId,
        ]);
        $res->throw();

        return (array) $res->json();
    }

    public function createFolder(array $payload): array
    {
        $res = $this->request()->post('/api/folders/', $payload);
        $res->throw();

        return (array) $res->json();
    }

    /**
     * Start a chunked upload session.
     *
     * Expected payload:
     * - project: UUID
     * - folder: UUID|null
     * - filename: string
     * - total_size: int
     * - total_chunks: int
     */
    public function startUpload(array $payload): array
    {
        $res = $this->request()->post('/api/uploads/start_upload/', $payload);
        $res->throw();

        return (array) $res->json();
    }

    /**
     * Upload a single chunk.
     */
    public function uploadChunk(string $sessionId, string $chunkPath, int $chunkIndex): array
    {
        $baseUrl = $this->resolveBaseUrl();

        $token = config('cdn.api_token');

        $req = Http::baseUrl($baseUrl)
            ->acceptJson()
            ->timeout(config('cdn.timeout', 15));

        // Pangolin proxy auth (WAN only).
        $wan = rtrim((string) config('cdn.wan_base_url'), '/');
        if ($wan !== '' && str_starts_with($baseUrl, $wan)) {
            $pangolin = $this->pangolinAuthHeader();
            if ($pangolin) {
                $req = $req->withHeaders(['Authorization' => $pangolin]);
            }
        }

        if ($token) {
            $req = $req->withHeaders([
                'X-Api-Token' => $token,
            ]);
        }

        $res = $req
            ->attach('chunk', file_get_contents($chunkPath), basename($chunkPath))
            ->post("/api/uploads/{$sessionId}/upload_chunk/", [
                'chunk_index' => $chunkIndex,
            ]);

        $res->throw();

        return (array) $res->json();
    }

    /**
     * Poll upload session status.
     */
    public function uploadStatus(string $sessionId): array
    {
        $res = $this->request()->get("/api/uploads/{$sessionId}/status/");
        $res->throw();

        return (array) $res->json();
    }

    public function fileDetails(string $fileId): array
    {
        $res = $this->request()->get("/api/files/{$fileId}/");
        $res->throw();

        return (array) $res->json();
    }

    public function deleteFile(string $fileId): void
    {
        $res = $this->request()->delete("/api/files/{$fileId}/");

        // Already deleted remotely is fine.
        if ($res->status() === 404) {
            return;
        }

        $res->throw();
    }

    public function baseUrl(): string
    {
        return $this->resolveBaseUrl();
    }
}
