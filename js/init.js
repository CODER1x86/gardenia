/**
 * Application Initialization
 * Sets up the application environment and loads required resources
 */
import { STORAGE_KEYS } from './config/constants.js';

class Initializer {
    constructor() {
        this.requiredModules = [
            'auth',
            'budget',
            'expense',
            'revenue'
        ];
    }

    async init() {
        try {
            await this.checkEnvironment();
            await this.loadConfiguration();
            await this.initializeDatabase();
            await this.loadModules();
            this.setupServiceWorker();
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }

    async checkEnvironment() {
        // Check browser compatibility
        if (!window.indexedDB) {
            throw new Error('Your browser doesn\'t support a stable version of IndexedDB.');
        }

        // Check for required APIs
        const requiredAPIs = ['Promise', 'localStorage', 'fetch'];
        for (const api of requiredAPIs) {
            if (!(api in window)) {
                throw new Error(`Your browser doesn't support ${api}`);
            }
        }
    }

    async loadConfiguration() {
        // Load stored configuration or use defaults
        const storedConfig = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                Object.assign(window.config, config);
            } catch (error) {
                console.error('Failed to parse stored configuration:', error);
                localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            }
        }
    }

    async initializeDatabase() {
        // Initialize IndexedDB for offline support
        const dbName = 'gardeniabudget';
        const dbVersion = 1;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('expenses')) {
                    db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('revenue')) {
                    db.createObjectStore('revenue', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async loadModules() {
        for (const module of this.requiredModules) {
            try {
                await import(`./modules/${module}.js`);
            } catch (error) {
                console.error(`Failed to load module: ${module}`, error);
                throw error;
            }
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('ServiceWorker registered:', registration);
                } catch (error) {
                    console.error('ServiceWorker registration failed:', error);
                }
            });
        }
    }
}

// Create and export initializer instance
const initializer = new Initializer();
export default initializer;

// Auto-initialize when script is loaded
initializer.init().catch(error => {
    console.error('Application initialization failed:', error);
    document.body.innerHTML = `
        <div class="error-screen">
            <h1>Initialization Error</h1>
            <p>Failed to initialize the application. Please refresh the page or contact support.</p>
            <button onclick="location.reload()">Refresh Page</button>
        </div>
    `;
});