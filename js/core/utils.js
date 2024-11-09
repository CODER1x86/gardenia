/**
 * Utility functions
 * General-purpose helper functions used throughout the application
 */
export const dateUtils = {
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        return d.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    getCurrentMonth() {
        const date = new Date();
        return date.getMonth() + 1;
    },

    getCurrentYear() {
        return new Date().getFullYear();
    },

    getMonthName(month) {
        return new Date(2000, month - 1, 1).toLocaleString('en-PH', { month: 'long' });
    },

    getDateRange(period = 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), period === 'month' ? now.getMonth() : 0, 1);
        const end = new Date(now.getFullYear(), period === 'month' ? now.getMonth() + 1 : 12, 0);
        return { start, end };
    }
};

export const numberUtils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    },

    formatNumber(number, decimals = 2) {
        return Number(number).toFixed(decimals);
    },

    calculatePercentage(value, total) {
        return total ? ((value / total) * 100).toFixed(1) : 0;
    }
};

export const stringUtils = {
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    truncate(str, length = 30) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
};

export const arrayUtils = {
    groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    },

    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    sum(array, key) {
        return array.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
    }
};

export const storageUtils = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage Error:', error);
            return false;
        }
    },

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage Error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage Error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage Error:', error);
            return false;
        }
    }
};

export const domUtils = {
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    },

    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    addEventListeners(element, events = {}) {
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
};

export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

export const errorUtils = {
    handleError(error, showNotification = true) {
        console.error('Error:', error);
        
        if (showNotification) {
            const message = error.response?.data?.message || error.message || 'An error occurred';
            window.ui.showNotification(message, 'error');
        }
        
        return {
            error: true,
            message: error.message,
            details: error.response?.data
        };
    },

    isNetworkError(error) {
        return !window.navigator.onLine || error.message === 'Network Error';
    }
};