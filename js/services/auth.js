/**
 * Authentication Service
 * Handles user authentication, session management, and authorization
 */
import api from '../core/api.js';
import { storageUtils } from '../core/utils.js';
import { STORAGE_KEYS } from '../config/constants.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.token = storageUtils.get(STORAGE_KEYS.AUTH_TOKEN);
            if (this.token) {
                api.setAuthToken(this.token);
                await this.validateToken();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.logout();
        } finally {
            this.initialized = true;
        }
    }

    async login(credentials) {
        try {
            const response = await api.request('/api/auth/login', {
                method: 'POST',
                data: credentials
            });

            this.setSession(response.token, response.user);
            return response.user;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async logout() {
        try {
            if (this.token) {
                await api.request('/api/auth/logout', { method: 'POST' });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
        }
    }

    setSession(token, user) {
        this.token = token;
        this.currentUser = user;
        api.setAuthToken(token);
        storageUtils.set(STORAGE_KEYS.AUTH_TOKEN, token);
        storageUtils.set(STORAGE_KEYS.USER_DATA, user);
    }

    clearSession() {
        this.token = null;
        this.currentUser = null;
        api.setAuthToken(null);
        storageUtils.remove(STORAGE_KEYS.AUTH_TOKEN);
        storageUtils.remove(STORAGE_KEYS.USER_DATA);
    }

    async validateToken() {
        try {
            const response = await api.request('/api/auth/verify');
            this.currentUser = response.user;
            return true;
        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    async changePassword(currentPassword, newPassword) {
        try {
            await api.request('/api/auth/change-password', {
                method: 'POST',
                data: { currentPassword, newPassword }
            });
            return true;
        } catch (error) {
            throw new Error(error.message || 'Password change failed');
        }
    }

    async requestPasswordReset(email) {
        try {
            await api.request('/api/auth/reset-password', {
                method: 'POST',
                data: { email }
            });
            return true;
        } catch (error) {
            throw new Error(error.message || 'Password reset request failed');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await api.request('/api/auth/reset-password/confirm', {
                method: 'POST',
                data: { token, newPassword }
            });
            return true;
        } catch (error) {
            throw new Error(error.message || 'Password reset failed');
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await api.request('/api/auth/profile', {
                method: 'PUT',
                data: profileData
            });
            this.currentUser = response.user;
            storageUtils.set(STORAGE_KEYS.USER_DATA, response.user);
            return response.user;
        } catch (error) {
            throw new Error(error.message || 'Profile update failed');
        }
    }

    setupAuthGuard() {
        // Add navigation guard for protected routes
        document.addEventListener('DOMContentLoaded', () => {
            const protectedPages = [
                'budget.html',
                'expenses.html',
                'revenue.html',
                'reports.html'
            ];

            const currentPage = window.location.pathname.split('/').pop();
            if (protectedPages.includes(currentPage) && !this.isAuthenticated()) {
                window.location.href = '/auth.html';
            }
        });

        // Watch for token expiration
        setInterval(() => {
            if (this.token) {
                this.validateToken().catch(() => {
                    window.location.href = '/auth.html';
                });
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }
}

export default new AuthService();