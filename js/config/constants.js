/**
 * Application-wide constants
 * Central location for all constant values used across the application
 */
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        VERIFY: '/api/auth/verify'
    },
    FINANCIAL: {
        EXPENSES: '/api/expenses',
        REVENUE: '/api/revenue',
        PAYMENTS: '/api/payments',
        BALANCE: '/api/balance'
    },
    UNITS: {
        BASE: '/api/units',
        DETAILS: '/api/units/:id'
    },
    REPORTS: {
        MONTHLY: '/api/reports/monthly',
        ANNUAL: '/api/reports/annual',
        CUSTOM: '/api/reports/custom'
    }
};

export const STATUS_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
};

export const VALIDATION_RULES = {
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 50,
        PATTERN: /^[a-zA-Z0-9_]+$/
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true
    },
    AMOUNT: {
        MIN: 0,
        MAX: 999999999,
        DECIMALS: 2
    }
};

export const UI_ELEMENTS = {
    MODAL_TYPES: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },
    NOTIFICATION_DURATION: 5000,
    ANIMATION_DURATION: 300
};

export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    API: 'YYYY-MM-DD',
    REPORT: 'MMMM YYYY'
};

export const CURRENCY = {
    CODE: 'PHP',
    SYMBOL: '₱',
    DECIMAL_PLACES: 2
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    SETTINGS: 'app_settings',
    THEME: 'app_theme'
};

export const ERROR_MESSAGES = {
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid username or password',
        SESSION_EXPIRED: 'Your session has expired',
        UNAUTHORIZED: 'Please log in to continue'
    },
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_FORMAT: 'Invalid format',
        AMOUNT_RANGE: 'Amount must be between 0 and 999,999,999'
    },
    API: {
        NETWORK_ERROR: 'Network error. Please check your connection',
        SERVER_ERROR: 'Server error. Please try again later',
        TIMEOUT: 'Request timed out'
    }
};