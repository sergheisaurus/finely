<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class InvoiceAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_primary' => 'boolean',
        ];
    }

    protected $appends = ['url'];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the full URL to the attachment.
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Check if this is an image file.
     */
    public function isImage(): bool
    {
        return in_array($this->file_type, [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ]);
    }

    /**
     * Check if this is a PDF file.
     */
    public function isPdf(): bool
    {
        return $this->file_type === 'application/pdf';
    }

    /**
     * Get human-readable file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' bytes';
    }
}
