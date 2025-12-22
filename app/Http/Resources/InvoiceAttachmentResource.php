<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'formatted_size' => $this->formatted_size,
            'is_primary' => $this->is_primary,
            'url' => $this->url,
            'is_image' => $this->isImage(),
            'is_pdf' => $this->isPdf(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
