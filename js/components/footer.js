/**
 * Footer component handling
 * Manages footer rendering and dynamic content updates
 */
const Footer = {
    init() {
        this.footer = document.querySelector('footer');
        if (!this.footer) return;
        
        this.render();
        this.attachEventListeners();
    },

    render() {
        this.footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <nav>
                        <a href="/expenses.html">Expenses</a>
                        <a href="/revenue.html">Revenue</a>
                        <a href="/budget.html">Budget</a>
                        <a href="/reports.html">Reports</a>
                    </nav>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <p>Email: admin@gardenia.com</p>
                    <p>Phone: (123) 456-7890</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} Gardenia City Budget. All rights reserved.</p>
            </div>
        `;
    },

    attachEventListeners() {
        const links = this.footer.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!window.auth.isAuthenticated()) {
                    e.preventDefault();
                    window.ui.showMessage('Please log in to access this page', 'warning');
                }
            });
        });
    }
};

export default Footer;