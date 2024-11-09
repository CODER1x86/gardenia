/**
 * Application settings and configuration
 * Manages app-wide settings and user preferences
 */
import { STORAGE_KEYS } from './constants.js';

class Settings {
    constructor() {
        this.defaults = {
            theme: 'light',
            dateFormat: 'MMM DD, YYYY',
            pageSize: 10,
            notifications: true,
            autoLogout: 30, // minutes
            language: 'en',
            currency: {
                code: 'PHP',
                symbol: '₱',
                position: 'before'
            },
            reports: {
                defaultRange: 'month',
                charts: true
            }
        };

        this.current = this.loadSettings();
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : this.defaults;
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.defaults;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.current));
            this.notifySettingsChange();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    get(key) {
        return key ? this.current[key] : this.current;
    }

    set(key, value) {
        if (typeof key === 'object') {
            this.current = { ...this.current, ...key };
        } else {
            this.current[key] = value;
        }
        this.saveSettings();
    }

    reset() {
        this.current = { ...this.defaults };
        this.saveSettings();
    }

    notifySettingsChange() {
        window.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: { settings: this.current }
        }));
    }

    // Theme management
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.set('theme', theme);
    }

    // Currency formatting
    getCurrencyFormatter() {
        const { code, symbol } = this.current.currency;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'symbol'
        });
    }

    // Date formatting
    getDateFormatter() {
        return new Intl.DateTimeFormat('en-PH', {
            dateStyle: 'medium'
        });
    }

    // Validation settings
    getValidationRules() {
        return {
            amounts: {
                min: 0,
                max: 999999999,
                decimals: 2
            },
            dates: {
                min: '2000-01-01',
                max: '2099-12-31'
            }
        };
    }

    // Export settings
    export() {
        return {
            settings: this.current,
            timestamp: new Date().toISOString()
        };
    }

    // Import settings
    import(data) {
        try {
            if (data && data.settings) {
                this.current = { ...this.defaults, ...data.settings };
                this.saveSettings();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }
}

export default new Settings();