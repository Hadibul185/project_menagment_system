import axios from 'axios'

const normalizedBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:9001').replace(/\/+$/, '')

// ─── Create Axios Instance ────────────────────────────────────────────────────
const api = axios.create({
    baseURL: normalizedBaseUrl,
    timeout: 10000,  // 10 second timeout
    withCredentials: false,  // Set to true only if backend sends credentials in cookies
})

// ─── Auth Failure Handler (set by App component) ──────────────────────────────
let onAuthFailure = null

export const setAuthFailureHandler = (handler) => {
    onAuthFailure = handler
}

// ─── Request Interceptor — Attach JWT Token ────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        
        if (token) {
            // Always use "Bearer <token>" format
            config.headers.Authorization = `Bearer ${token}`
            console.debug('[API] Token attached to request:', config.url)
        } else {
            console.debug('[API] No token found for request:', config.url)
        }
        
        return config
    },
    (error) => {
        console.error('[API] Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// ─── Response Interceptor — Handle Auth Errors ─────────────────────────────────
api.interceptors.response.use(
    (response) => {
        console.debug('[API] Response received:', response.config.url, response.status)
        return response
    },
    (error) => {
        const { config, response } = error
        const requestDetails = {
            method: config?.method?.toUpperCase(),
            url: `${config?.baseURL || ''}${config?.url || ''}`,
            status: response?.status,
            code: error?.code,
            responseData: response?.data
        }

        // Identify auth endpoints (don't logout on auth endpoint failures)
        const isAuthEndpoint = config?.url?.includes('/auth/login') ||
                               config?.url?.includes('/auth/signup')

        // Handle 401 (Unauthorized - Missing/Invalid Token)
        if (response?.status === 401 && !isAuthEndpoint) {
            console.warn('[API] Unauthorized (401) - Token invalid or expired')
            
            // Clear auth data
            localStorage.removeItem('token')
            localStorage.removeItem('user')

            // Trigger auth failure handler
            if (onAuthFailure) {
                onAuthFailure(error)
            }

            return Promise.reject({
                ...error,
                message: 'Session expired. Please log in again.',
                code: 'AUTH_FAILED'
            })
        }

        // Handle 403 (Forbidden - Insufficient Permissions)
        if (response?.status === 403 && !isAuthEndpoint) {
            console.warn('[API] Forbidden (403) - Insufficient permissions')
            
            return Promise.reject({
                ...error,
                message: response.data?.message || 'You do not have permission to access this resource.',
                code: 'FORBIDDEN'
            })
        }

        // Handle 422 (Validation Error)
        if (response?.status === 422) {
            console.warn('[API] Validation error (422):', response.data?.details)
            return Promise.reject({
                ...error,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: response.data?.details
            })
        }

        // Handle other errors
        if (!response) {
            console.error('[API] Network/CORS error:', requestDetails)
            return Promise.reject({
                ...error,
                message: error.message || 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR'
            })
        }

        console.error('[API] Request failed:', requestDetails)
        return Promise.reject(error)
    }
)

export default api
