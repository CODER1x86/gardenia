/**
 * Header component handling
 * Manages navigation, user status, and notifications
 */
const Header = {
    init() {
        this.header = document.querySelector('header');
        if (!this.header) return;
        
        this.render();
        this.setupNavigation();
        this.setupUserMenu();
        this.setupNotifications();
    },

    render() {
        this.header.innerHTML = `
            <div class="header-content">
                <div class="logo">
                    <a href="/">Gardenia City Budget</a>
                </div>
                <nav class="main-nav">
                    <a href="/expenses.html" data-page="expenses">Expenses</a>
                    <a href="/revenue.html" data-page="revenue">Revenue</a>
                    <a href="/budget.html" data-page="budget">Budget</a>
                    <a href="/reports.html" data-page="reports">Reports</a>
                </nav>
                <div class="user-menu">
                    <span class="user-name"></span>
                    <button class="logout-btn" style="display: none;">Logout</button>
                    <button class="login-btn" style="display: none;">Login</button>
                </div>
            </div>
            <div class="notifications"></div>
        `;
    },

    setupNavigation() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const links = this.header.querySelectorAll('nav a');
        
        links.forEach(link => {
            if (link.dataset.page === currentPage) {
                link.classList.add('active');
            }
            
            link.addEventListener('click', (e) => {
                if (!window.auth.isAuthenticated()) {
                    e.preventDefault();
                    window.ui.showMessage('Please log in to access this page', 'warning');
                }
            });
        });
    },

    setupUserMenu() {
        const userMenu = this.header.querySelector('.user-menu');
        const userName = userMenu.querySelector('.user-name');
        const logoutBtn = userMenu.querySelector('.logout-btn');
        const loginBtn = userMenu.querySelector('.login-btn');

        if (window.auth.isAuthenticated()) {
            userName.textContent = window.auth.getCurrentUser().username;
            logoutBtn.style.display = 'inline-block';
            loginBtn.style.display = 'none';
        } else {
            userName.textContent = '';
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'inline-block';
        }

        logoutBtn.addEventListener('click', () => {
            window.auth.logout();
            window.location.href = '/';
        });

        loginBtn.addEventListener('click', () => {
            window.location.href = '/auth.html';
        });
    },

    setupNotifications() {
        const notificationsDiv = this.header.querySelector('.notifications');
        
        window.addEventListener('notification', (e) => {
            const notification = document.createElement('div');
            notification.className = `notification ${e.detail.type}`;
            notification.textContent = e.detail.message;
            
            notificationsDiv.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        });
    }
};

export default Header;