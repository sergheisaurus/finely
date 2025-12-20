import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
});

// Add CSRF token to all requests
api.interceptors.request.use((config) => {
    // Get CSRF token from meta tag or cookie
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }

    return config;
});

// Add error handling interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle different error types
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.message;

            switch (status) {
                case 401:
                    toast.error('Authentication required', {
                        description: 'Please log in to continue.',
                    });
                    break;
                case 403:
                    toast.error('Access denied', {
                        description: 'You do not have permission to perform this action.',
                    });
                    break;
                case 404:
                    toast.error('Not found', {
                        description: 'The requested resource was not found.',
                    });
                    break;
                case 419:
                    toast.error('Session expired', {
                        description: 'Please refresh the page and try again.',
                        action: {
                            label: 'Refresh',
                            onClick: () => window.location.reload(),
                        },
                    });
                    break;
                case 422:
                    // Validation errors - don't show toast, let the form handle it
                    break;
                case 500:
                    toast.error('Server error', {
                        description: 'Something went wrong. Please try again later.',
                    });
                    break;
                default:
                    toast.error('Error', {
                        description: message,
                    });
            }
        } else if (error.request) {
            toast.error('Network error', {
                description: 'Unable to connect to the server. Please check your connection.',
            });
        } else {
            toast.error('Error', {
                description: error.message,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
