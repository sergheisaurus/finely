<?php

return [
    // Optional: force a single base URL (legacy / override).
    'base_url' => env('CDN_BASE_URL'),

    // Preferred: dual-path connection strategy.
    // LAN is primary when running on the same NAS/Docker host.
    'lan_base_url' => env('CDN_LAN_BASE_URL', 'http://10.10.10.3:5173'),
    // WAN fallback (behind Pangolin proxy).
    'wan_base_url' => env('CDN_WAN_BASE_URL', 'https://cdn.sergheisaurus.com'),

    // Pangolin proxy auth (WAN only). Provide the full Authorization header value.
    // Example: "Basic Q0ROLUhBVVRIOlNhaHJ5ZUhvZ3RpZWREcm9vbGluZw=="
    'pangolin_basic_auth' => env('CDN_PANGOLIN_BASIC_AUTH'),

    // CDN API token (application layer). Sent as X-Api-Token.
    'api_token' => env('CDN_API_TOKEN'),

    // If set, Finely can use a fixed CDN project.
    'project_id' => env('CDN_PROJECT_ID'),

    // Request timeout (seconds)
    'timeout' => (int) env('CDN_TIMEOUT', 15),

    // LAN probe timeout (seconds) for selecting base URL.
    'probe_timeout' => (int) env('CDN_PROBE_TIMEOUT', 2),
];
