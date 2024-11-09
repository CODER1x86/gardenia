/**
 * User Service
 * Handles user management and profile operations
 */
import api from '../core/api.js';
import { storageUtils } from '../core/utils.js';
import validation from '../core/validation.js';

class UserService {
    constructor() {
        this.roles = {
            ADMIN: 'admin',
            MANAGER: 'manager',
            STAFF: 'staff',
            VIEWER: 'viewer'
        };

        this.permissions = {
            CREATE_USER: 'create_user',
            EDIT_USER: 'edit_user',
            DELETE_USER: 'delete_user',
            MANAGE_BUDGET: 'manage_budget',
            VIEW_REPORTS: 'view_reports',
            EXPORT_DATA: 'export_data'
        };
    }

    async getCurrentUser() {
        try {
            const response = await api.request('/api/users/me');
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch current user');
        }
    }

    async updateProfile(userData) {
        try {
            const response = await api.request('/api/users/profile', {
                method: 'PUT',
                data: userData
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to update profile');
        }
    }

    async getAllUsers() {
        try {
            const response = await api.request('/api/users');
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch users');
        }
    }

    async createUser(userData) {
        try {
            const validationResult = validation.validateForm(userData, {
                username: { required: true, minLength: 3 },
                email: { required: true, type: 'email' },
                role: { required: true }
            });

            if (!validationResult.isValid) {
                throw new Error(validationResult.errors[0]);
            }

            const response = await api.request('/api/users', {
                method: 'POST',
                data: userData
            });
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create user');
        }
    }

    async updateUser(userId, userData) {
        try {
            const response = await api.request(`/api/users/${userId}`, {
                method: 'PUT',
                data: userData
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to update user');
        }
    }

    async deleteUser(userId) {
        try {
            await api.request(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }

    async getUserActivity(userId) {
        try {
            const response = await api.request(`/api/users/${userId}/activity`);
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch user activity');
        }
    }

    hasPermission(user, permission) {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    }

    async updateUserPermissions(userId, permissions) {
        try {
            const response = await api.request(`/api/users/${userId}/permissions`, {
                method: 'PUT',
                data: { permissions }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to update user permissions');
        }
    }

    async getUsersByRole(role) {
        try {
            const response = await api.request('/api/users', {
                params: { role }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch users by role');
        }
    }

    async updateUserStatus(userId, status) {
        try {
            const response = await api.request(`/api/users/${userId}/status`, {
                method: 'PUT',
                data: { status }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to update user status');
        }
    }

    async resetUserPassword(userId) {
        try {
            const response = await api.request(`/api/users/${userId}/reset-password`, {
                method: 'POST'
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to reset user password');
        }
    }

    async searchUsers(query) {
        try {
            const response = await api.request('/api/users/search', {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to search users');
        }
    }

    getRolePermissions(role) {
        const permissionMap = {
            [this.roles.ADMIN]: Object.values(this.permissions),
            [this.roles.MANAGER]: [
                this.permissions.MANAGE_BUDGET,
                this.permissions.VIEW_REPORTS,
                this.permissions.EXPORT_DATA
            ],
            [this.roles.STAFF]: [
                this.permissions.VIEW_REPORTS
            ],
            [this.roles.VIEWER]: [
                this.permissions.VIEW_REPORTS
            ]
        };
        return permissionMap[role] || [];
    }

    validateUserData(userData) {
        const rules = {
            username: {
                required: true,
                minLength: 3,
                maxLength: 50,
                pattern: /^[a-zA-Z0-9_]+$/
            },
            email: {
                required: true,
                type: 'email'
            },
            role: {
                required: true,
                enum: Object.values(this.roles)
            }
        };

        return validation.validateForm(userData, rules);
    }
}

export default new UserService();