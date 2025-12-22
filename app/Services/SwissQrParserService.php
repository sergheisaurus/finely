<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Zxing\QrReader;

class SwissQrParserService
{
    /**
     * Parse Swiss QR-Invoice content (SPC format).
     *
     * The Swiss QR-Invoice format consists of multiple lines with specific data.
     * See: https://www.paymentstandards.ch/dam/downloads/ig-qr-bill-en.pdf
     *
     * @return array<string, mixed>|null Returns parsed data or null if invalid
     */
    public function parse(string $qrContent): ?array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($qrContent));

        if (count($lines) < 28) {
            return null;
        }

        // Validate header
        if ($lines[0] !== 'SPC') {
            return null;
        }

        // Parse the standard SPC format
        $data = [
            'type' => $lines[0] ?? null,                    // SPC
            'version' => $lines[1] ?? null,                 // 0200
            'coding' => $lines[2] ?? null,                  // 1 = UTF-8
            'iban' => $lines[3] ?? null,                    // IBAN
            'creditor_address_type' => $lines[4] ?? null,   // S = structured, K = combined
            'creditor_name' => $lines[5] ?? null,
            'creditor_street' => $lines[6] ?? null,
            'creditor_building' => $lines[7] ?? null,
            'creditor_postal_code' => $lines[8] ?? null,
            'creditor_city' => $lines[9] ?? null,
            'creditor_country' => $lines[10] ?? null,
            // Lines 11-17 are for ultimate creditor (usually empty)
            'amount' => $this->parseAmount($lines[18] ?? ''),
            'currency' => $lines[19] ?? 'CHF',
            // Lines 20-25 are for ultimate debtor (usually empty)
            'reference_type' => $lines[26] ?? null,         // QRR, SCOR, or NON
            'reference' => $lines[27] ?? null,              // Payment reference
            'message' => $lines[28] ?? null,                // Unstructured message
            'trailer' => $lines[29] ?? null,                // EPD
            'billing_info' => $lines[30] ?? null,           // Additional billing info
        ];

        // Build formatted creditor address
        $data['creditor_address'] = $this->buildAddress($data);

        // Clean up empty values
        $data = array_map(fn ($value) => $value === '' ? null : $value, $data);

        return $data;
    }

    /**
     * Parse amount string to float.
     */
    protected function parseAmount(string $amount): ?float
    {
        $amount = trim($amount);

        if ($amount === '') {
            return null;
        }

        return (float) $amount;
    }

    /**
     * Build a formatted address string from components.
     */
    protected function buildAddress(array $data): ?string
    {
        $parts = array_filter([
            $data['creditor_street'] ?? null,
            $data['creditor_building'] ?? null,
        ]);

        $line1 = implode(' ', $parts);

        $parts2 = array_filter([
            $data['creditor_postal_code'] ?? null,
            $data['creditor_city'] ?? null,
        ]);

        $line2 = implode(' ', $parts2);

        $address = array_filter([$line1, $line2, $data['creditor_country'] ?? null]);

        return empty($address) ? null : implode(', ', $address);
    }

    /**
     * Extract QR code content from an uploaded image file.
     *
     * @return string|null The QR code content or null if not found
     */
    public function extractFromImage(UploadedFile $file): ?string
    {
        try {
            // Check file size (max 2MB)
            if ($file->getSize() > 2 * 1024 * 1024) {
                return null;
            }

            // Temporarily increase memory limit for QR processing
            $originalLimit = ini_get('memory_limit');
            ini_set('memory_limit', '256M');

            $qrReader = new QrReader($file->getRealPath());
            $text = $qrReader->text();

            // Restore original memory limit
            ini_set('memory_limit', $originalLimit);

            return $text ?: null;
        } catch (\Throwable $e) {
            // Restore memory limit in case of error
            if (isset($originalLimit)) {
                ini_set('memory_limit', $originalLimit);
            }

            return null;
        }
    }

    /**
     * Try to extract and parse QR data from an uploaded file.
     * Supports image files (PNG, JPEG, etc.).
     *
     * @return array{data: array<string, mixed>, raw_text: string}|null
     */
    public function parseFromFile(UploadedFile $file): ?array
    {
        // Only support image files for now
        if (! str_starts_with($file->getMimeType(), 'image/')) {
            return null;
        }

        $qrContent = $this->extractFromImage($file);

        if (! $qrContent) {
            return null;
        }

        $parsedData = $this->parse($qrContent);

        if (! $parsedData) {
            return null;
        }

        return [
            'data' => $parsedData,
            'raw_text' => $qrContent,
        ];
    }

    /**
     * Validate if a string looks like Swiss QR-Invoice content.
     */
    public function isValidSwissQr(string $content): bool
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($content));

        return count($lines) >= 28
            && ($lines[0] ?? '') === 'SPC'
            && in_array($lines[1] ?? '', ['0100', '0200'], true);
    }

    /**
     * Generate a Swiss QR code content string from data.
     * Useful for displaying the QR code in the UI.
     *
     * @param  array<string, mixed>  $data
     */
    public function generateQrContent(array $data): string
    {
        $lines = [
            'SPC',                                      // Header
            '0200',                                     // Version
            '1',                                        // Coding (UTF-8)
            $data['iban'] ?? '',                        // IBAN
            'S',                                        // Address type (structured)
            $data['creditor_name'] ?? '',               // Creditor name
            $data['creditor_street'] ?? '',             // Street
            $data['creditor_building'] ?? '',           // Building number
            $data['creditor_postal_code'] ?? '',        // Postal code
            $data['creditor_city'] ?? '',               // City
            $data['creditor_country'] ?? 'CH',          // Country
            '', '', '', '', '', '', '',                 // Ultimate creditor (empty)
            $data['amount'] ?? '',                      // Amount
            $data['currency'] ?? 'CHF',                 // Currency
            '', '', '', '', '', '',                     // Ultimate debtor (empty)
            $data['reference_type'] ?? 'NON',           // Reference type
            $data['reference'] ?? '',                   // Reference
            $data['message'] ?? '',                     // Message
            'EPD',                                      // Trailer
            $data['billing_info'] ?? '',                // Billing info
        ];

        return implode("\n", $lines);
    }
}
