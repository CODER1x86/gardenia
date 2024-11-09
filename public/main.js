/**
 * Main Application Entry Point
 * Integrates all modules and handles application initialization
 */
import auth from './services/auth.js';
import ui from './core/ui.js';
import settings from './config/settings.js';
import BudgetModule from './modules/budget.js';
import ExpenseModule from './modules/expense.js';
import RevenueModule from './modules/revenue.js';
import { loadHeader } from './components/header.js';
import { loadFooter } from './components/footer.js';
import { fetchAvailableBalance, fetchTotalRevenue, fetchTotalExpenses } from './services/financial.js';

class App {
    constructor() {
        this.modules = {
            budget: BudgetModule,
            expense: ExpenseModule,
            revenue: RevenueModule
        };
        this.currentModule = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            ui.showLoadingSpinner();

            // Core initialization
            await Promise.all([
                auth.init(),
                settings.init(),
                this.initializeUI(),
                this.loadCurrentModule()
            ]);

            // Setup event listeners and load data
            this.setupEventListeners();
            await this.loadDashboardData();

            this.initialized = true;
            console.log('Application initialized successfully');
            ui.hideLoadingSpinner();
        } catch (error) {
            console.error('Application initialization failed:', error);
            ui.showNotification('Failed to initialize application', 'error');
            ui.hideLoadingSpinner();
        }
    }

    async initializeUI() {
        // Load structural components
        await Promise.all([loadHeader(), loadFooter()]);

        // Initialize UI elements
        ui.initializeSiteStyle();
        
        // Initialize dropdowns if Materialize is present
        if (typeof M !== 'undefined') {
            document.querySelectorAll('.dropdown-trigger').forEach(dropdown => {
                M.Dropdown.init(dropdown);
            });
        }

        // Update footer year
        const footerYear = document.getElementById('currentyear');
        if (footerYear) {
            footerYear.textContent = new Date().getFullYear();
        }
    }

    async loadCurrentModule() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        
        if (this.modules[currentPage]) {
            this.currentModule = this.modules[currentPage];
            await this.currentModule.init();
        }
    }

    async loadDashboardData(filters = {}) {
        try {
            const year = filters.year || new Date().getFullYear();
            const [balance, revenue, expenses] = await Promise.all([
                fetchAvailableBalance(year),
                fetchTotalRevenue(year),
                fetchTotalExpenses(year)
            ]);

            this.updateDashboardUI({ balance, revenue, expenses });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            ui.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboardUI(data) {
        const elements = {
            balance: document.getElementById('available-balance'),
            revenue: document.getElementById('total-revenue'),
            expenses: document.getElementById('total-expenses')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element && data[key]) {
                element.textContent = data[key];
            }
        });
    }

    setupEventListeners() {
        // Filter handling
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(filterForm);
                const filters = Object.fromEntries(formData.entries());
                this.loadDashboardData(filters);
            });
        }

        // Auth form handling
        this.setupAuthForms();

        // Navigation handling
        document.addEventListener('click', async (e) => {
            if (e.target.matches('nav a')) {
                e.preventDefault();
                const module = e.target.dataset.module;
                
                if (this.modules[module]) {
                    history.pushState(null, '', e.target.href);
                    await this.loadCurrentModule();
                }
            }
        });

        // Handle back/forward browser navigation
        window.addEventListener('popstate', () => this.loadCurrentModule());
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                await auth.login(
                    formData.get('username'),
                    formData.get('password')
                );
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                await auth.register(
                    formData.get('username'),
                    formData.get('password')
                );
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout().then(() => window.location.href = '/login.html');
            });
        }
    }

    checkAuth() {
        const protectedPages = [
            'expense-management',
            'footer-settings',
            'inventory-management',
            'profile',
            'revenue-management',
            'style-modifier'
        ];

        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        if (protectedPages.includes(currentPage) && !auth.isAuthenticated()) {
            window.location.href = '/login.html';
        }
    }
}

// Create and initialize the application
const app = new App();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// Export for global access
window.app = app;