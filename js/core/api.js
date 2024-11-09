/**
 * Core API handling
 * Manages all API requests and responses
 */
import { API_ENDPOINTS, STATUS_CODES, ERROR_MESSAGES } from '../config/constants.js';
import settings from '../config/settings.js';

class API {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    async request(endpoint, options = {}) {
        try {
            const url = this.baseURL + endpoint;
            const config = {
                method: options.method || 'GET',
                headers: { ...this.defaultHeaders, ...options.headers },
                credentials: 'include'
            };

            if (options.data) {
                config.body = JSON.stringify(options.data);
            }

            const response = await this._fetchWithTimeout(url, config);
            
            if (!response.ok) {
                throw await this._handleError(response);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async _fetchWithTimeout(url, options, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(ERROR_MESSAGES.API.TIMEOUT);
            }
            throw error;
        }
    }

    async _handleError(response) {
        let error = new Error();
        try {
            const data = await response.json();
            error.message = data.error || ERROR_MESSAGES.API.SERVER_ERROR;
            error.status = response.status;
            error.data = data;
        } catch {
            error.message = ERROR_MESSAGES.API.SERVER_ERROR;
            error.status = response.status;
        }
        return error;
    }

    // Auth endpoints
    async login(credentials) {
        return this.request(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            data: credentials
        });
    }

    async logout() {
        return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST'
        });
    }

    // Financial endpoints
    async getExpenses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${API_ENDPOINTS.FINANCIAL.EXPENSES}?${queryString}`);
    }

    async addExpense(data) {
        return this.request(API_ENDPOINTS.FINANCIAL.EXPENSES, {
            method: 'POST',
            data
        });
    }

    async updateExpense(id, data) {
        return this.request(`${API_ENDPOINTS.FINANCIAL.EXPENSES}/${id}`, {
            method: 'PUT',
            data
        });
    }

    async deleteExpense(id) {
        return this.request(`${API_ENDPOINTS.FINANCIAL.EXPENSES}/${id}`, {
            method: 'DELETE'
        });
    }

    // Revenue endpoints
    async getRevenue(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${API_ENDPOINTS.FINANCIAL.REVENUE}?${queryString}`);
    }

    async addRevenue(data) {
        return this.request(API_ENDPOINTS.FINANCIAL.REVENUE, {
            method: 'POST',
            data
        });
    }

    // Balance endpoints
    async getBalance(year) {
        return this.request(`${API_ENDPOINTS.FINANCIAL.BALANCE}/${year}`);
    }

    // Report endpoints
    async generateReport(type, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${API_ENDPOINTS.REPORTS[type]}?${queryString}`);
    }

    // Unit endpoints
    async getUnits(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${API_ENDPOINTS.UNITS.BASE}?${queryString}`);
    }

    async getUnitDetails(id) {
        return this.request(API_ENDPOINTS.UNITS.DETAILS.replace(':id', id));
    }
}

export default new API();