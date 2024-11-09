/**
 * Core UI handling
 * Manages UI components and interactions
 */
import { UI_ELEMENTS } from '../config/constants.js';
import settings from '../config/settings.js';

class UI {
    constructor() {
        this.notifications = [];
        this.activeModals = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('settingsChanged', () => {
            this.applyTheme();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                this.closeLastModal();
            }
        });
    }

    showNotification(message, type = 'info', duration = UI_ELEMENTS.NOTIFICATION_DURATION) {
        const notification = {
            id: Date.now(),
            message,
            type
        };

        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.innerHTML = `
            <span class="message">${message}</span>
            <button class="close">&times;</button>
        `;

        document.body.appendChild(element);
        this.notifications.push({ ...notification, element });

        element.querySelector('.close').addEventListener('click', () => {
            this.removeNotification(notification.id);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }

    removeNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            const { element } = this.notifications[index];
            element.classList.add('fade-out');
            setTimeout(() => element.remove(), UI_ELEMENTS.ANIMATION_DURATION);
            this.notifications.splice(index, 1);
        }
    }

    showModal(options) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ${options.size || ''}">
                <div class="modal-header">
                    <h2>${options.title}</h2>
                    ${options.closable !== false ? '<button class="close">&times;</button>' : ''}
                </div>
                <div class="modal-body">${options.content}</div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        this.activeModals.push(modal);

        if (options.closable !== false) {
            modal.querySelector('.close').addEventListener('click', () => {
                this.closeModal(modal);
            });
        }

        return modal;
    }

    closeModal(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.remove();
            this.activeModals = this.activeModals.filter(m => m !== modal);
        }, UI_ELEMENTS.ANIMATION_DURATION);
    }

    closeLastModal() {
        if (this.activeModals.length > 0) {
            this.closeModal(this.activeModals[this.activeModals.length - 1]);
        }
    }

    closeAllModals() {
        [...this.activeModals].forEach(modal => this.closeModal(modal));
    }

    showLoading(container = document.body) {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="spinner"></div>';
        container.appendChild(loader);
        return loader;
    }

    hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.remove();
        }
    }

    applyTheme() {
        const theme = settings.get('theme');
        document.documentElement.setAttribute('data-theme', theme);
    }

    formatCurrency(amount) {
        return settings.getCurrencyFormatter().format(amount);
    }

    formatDate(date) {
        return settings.getDateFormatter().format(new Date(date));
    }

    createTable(options) {
        const table = document.createElement('table');
        table.className = 'data-table';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        options.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            if (column.sortable) {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.handleSort(table, column));
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        this.updateTableBody(table, options);

        return table;
    }

    updateTableBody(table, options) {
        const tbody = table.querySelector('tbody') || document.createElement('tbody');
        tbody.innerHTML = '';

        options.data.forEach(row => {
            const tr = document.createElement('tr');
            options.columns.forEach(column => {
                const td = document.createElement('td');
                td.innerHTML = column.render 
                    ? column.render(row[column.field], row)
                    : row[column.field];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        if (!table.contains(tbody)) {
            table.appendChild(tbody);
        }
    }

    handleSort(table, column) {
        // Implementation of table sorting
    }
}

export default new UI();