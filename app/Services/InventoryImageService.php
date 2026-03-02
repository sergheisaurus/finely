<?php

namespace App\Services;

use App\Models\CdnAsset;
use App\Models\IntegrationSetting;
use App\Models\OrderItem;
use App\Services\Cdn\CdnClient;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class InventoryImageService
{
    public function __construct(
        protected CdnClient $cdn,
    ) {}

    public function upload(OrderItem $item, UploadedFile $image): CdnAsset
    {
        $projectId = $this->resolveProjectId();
        $folderId = $this->resolveItemFolderId($item, $projectId);

        $totalSize = max(1, (int) ($image->getSize() ?? 0));
        $filename = $image->getClientOriginalName() ?: ('item-'.$item->id.'.'.$image->extension());
        $sourcePath = $image->getRealPath();

        if (! is_string($sourcePath) || $sourcePath === '') {
            throw new \RuntimeException('Could not read uploaded image payload.');
        }

        $chunkSize = 16 * 1024 * 1024; // 16MB (recommended by CDN contract)
        $totalChunks = max(1, (int) ceil($totalSize / $chunkSize));

        $start = $this->cdn->startUpload([
            'project' => $projectId,
            'folder' => $folderId,
            'filename' => $filename,
            'total_size' => $totalSize,
            'total_chunks' => $totalChunks,
        ]);

        $sessionId = (string) Arr::first([
            Arr::get($start, 'session_id'),
            Arr::get($start, 'upload_session_id'),
            Arr::get($start, 'id'),
            Arr::get($start, 'upload.id'),
        ], fn ($value) => is_string($value) && $value !== '');

        if ($sessionId === '') {
            throw new \RuntimeException('CDN did not return an upload session id.');
        }

        $chunkResponse = [];

        $sourceHandle = fopen($sourcePath, 'rb');
        if ($sourceHandle === false) {
            throw new \RuntimeException('Could not open uploaded image for chunking.');
        }

        try {
            for ($chunkIndex = 0; $chunkIndex < $totalChunks; $chunkIndex++) {
                $chunkBytes = fread($sourceHandle, $chunkSize);

                if ($chunkBytes === false) {
                    throw new \RuntimeException('Could not read uploaded image chunk.');
                }

                $tmpChunkPath = tempnam(sys_get_temp_dir(), 'finely_chunk_');
                if ($tmpChunkPath === false) {
                    throw new \RuntimeException('Could not create temporary chunk file.');
                }

                file_put_contents($tmpChunkPath, $chunkBytes);

                try {
                    $chunkResponse = $this->cdn->uploadChunk(
                        $sessionId,
                        $tmpChunkPath,
                        $chunkIndex,
                    );
                } finally {
                    @unlink($tmpChunkPath);
                }
            }
        } finally {
            fclose($sourceHandle);
        }

        // Poll for completion since the CDN processes chunks asynchronously
        $maxAttempts = 30; // 15 seconds
        $attempt = 0;
        $statusResponse = [];

        while ($attempt < $maxAttempts) {
            $statusResponse = $this->cdn->uploadStatus($sessionId);
            $status = Arr::get($statusResponse, 'status');

            if ($status === 'completed') {
                break;
            }

            if ($status === 'failed' || $status === 'cancelled') {
                throw new \RuntimeException('CDN upload failed: '.Arr::get($statusResponse, 'error', 'Unknown error'));
            }

            $attempt++;
            usleep(500000); // 500ms
        }

        if (Arr::get($statusResponse, 'status') !== 'completed') {
            throw new \RuntimeException('CDN upload timed out processing chunks.');
        }

        $payload = [
            ...$start,
            ...$chunkResponse,
            ...$statusResponse,
        ];

        $fileId = (string) Arr::first([
            Arr::get($payload, 'result_file_id'),
            Arr::get($payload, 'result_file.id'),
            Arr::get($payload, 'file.id'),
            Arr::get($payload, 'result.file.id'),
            Arr::get($payload, 'cdn_file_id'),
        ], fn ($value) => is_string($value) && $value !== '');

        if ($fileId === '') {
            throw new \RuntimeException('CDN upload finished but no file id was returned.');
        }

        $url = Arr::first([
            Arr::get($payload, 'result_file.file'),
            Arr::get($payload, 'file.url'),
            Arr::get($payload, 'result.file.url'),
            Arr::get($payload, 'url'),
        ], fn ($value) => is_string($value) && $value !== '');

        $thumbnailUrl = Arr::first([
            Arr::get($payload, 'result_file.thumbnail'),
            Arr::get($payload, 'file.thumbnail_url'),
            Arr::get($payload, 'result.file.thumbnail_url'),
            Arr::get($payload, 'thumbnail_url'),
        ], fn ($value) => is_string($value) && $value !== '');

        /** @var CdnAsset $asset */
        $asset = CdnAsset::query()->create([
            'user_id' => $item->order->user_id,
            'attachable_type' => $item->getMorphClass(),
            'attachable_id' => $item->id,
            'cdn_file_id' => $fileId,
            'cdn_project_id' => $projectId,
            'name' => $filename,
            'mime_type' => $image->getMimeType(),
            'size' => $totalSize,
            'url' => $this->normalizeCdnUrl($url),
            'thumbnail_url' => $this->normalizeCdnUrl($thumbnailUrl),
            'metadata' => [
                'folder_id' => $folderId,
                'item_id' => $item->id,
                'source' => 'inventory_item_image',
            ],
        ]);

        $this->repairAssetUrls($asset);

        return $asset;
    }

    public function repairAssetUrls(CdnAsset $asset): CdnAsset
    {
        if ($asset->url) {
            return $asset;
        }

        try {
            $status = $this->cdn->uploadStatus($asset->cdn_file_id);

            $resultFileId = (string) Arr::get($status, 'result_file_id', '');
            $filePath = Arr::get($status, 'result_file.file');
            $thumbPath = Arr::get($status, 'result_file.thumbnail');

            $updates = [
                'url' => $this->normalizeCdnUrl(is_string($filePath) ? $filePath : null),
                'thumbnail_url' => $this->normalizeCdnUrl(is_string($thumbPath) ? $thumbPath : null),
            ];

            if ($resultFileId !== '') {
                $updates['cdn_file_id'] = $resultFileId;
            }

            if ($updates['url'] || $updates['thumbnail_url']) {
                $asset->forceFill($updates)->save();

                return $asset->refresh();
            }
        } catch (RequestException $e) {
            // Not an upload session id, continue to file lookup.
        }

        try {
            $file = $this->cdn->fileDetails($asset->cdn_file_id);

            $filePath = Arr::get($file, 'file');
            $thumbPath = Arr::get($file, 'thumbnail');

            $asset->forceFill([
                'url' => $this->normalizeCdnUrl(is_string($filePath) ? $filePath : null),
                'thumbnail_url' => $this->normalizeCdnUrl(is_string($thumbPath) ? $thumbPath : null),
            ])->save();

            return $asset->refresh();
        } catch (\Throwable) {
            return $asset;
        }
    }

    protected function resolveProjectId(): string
    {
        $configuredProjectId = config('cdn.project_id');
        if (is_string($configuredProjectId) && $configuredProjectId !== '') {
            return $configuredProjectId;
        }

        $setting = IntegrationSetting::query()->firstWhere('key', 'cdn.project');
        $projectId = data_get($setting?->value, 'project_id');

        if (is_string($projectId) && $projectId !== '') {
            return $projectId;
        }

        throw new \RuntimeException('CDN project is not configured. Run CDN bootstrap first.');
    }

    protected function resolveItemFolderId(OrderItem $item, string $projectId): string
    {
        $folderName = 'inventory-item-'.$item->id;
        $foldersResponse = $this->cdn->listFolders($projectId);
        $folders = Arr::get($foldersResponse, 'results', $foldersResponse);

        $existingById = null;

        if (is_string($item->cdn_folder_id) && $item->cdn_folder_id !== '') {
            $existingById = collect($folders)->first(function ($folder) use ($item): bool {
                return is_array($folder)
                    && (string) ($folder['id'] ?? '') === $item->cdn_folder_id;
            });

            if (is_array($existingById)) {
                return (string) ($existingById['id'] ?? '');
            }

            // Stored folder no longer exists remotely, clear stale value.
            $item->forceFill([
                'cdn_folder_id' => null,
            ])->save();
        }

        $existing = collect($folders)->first(function ($folder) use ($folderName): bool {
            if (! is_array($folder)) {
                return false;
            }

            return Str::lower((string) ($folder['name'] ?? '')) === Str::lower($folderName);
        });

        $folderId = is_array($existing)
            ? (string) ($existing['id'] ?? '')
            : '';

        if ($folderId === '') {
            $created = $this->cdn->createFolder([
                'project' => $projectId,
                'name' => $folderName,
            ]);

            $folderId = (string) ($created['id'] ?? '');
        }

        if ($folderId === '') {
            throw new \RuntimeException('Could not create or resolve CDN folder for item image.');
        }

        $item->forceFill([
            'cdn_folder_id' => $folderId,
        ])->save();

        return $folderId;
    }

    protected function normalizeCdnUrl(?string $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }

        $baseUrl = rtrim($this->cdn->baseUrl(), '/');
        if ($baseUrl === '') {
            return $value;
        }

        return $baseUrl.'/'.ltrim($value, '/');
    }
}
