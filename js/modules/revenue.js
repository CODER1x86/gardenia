/**
 * Revenue Module
 * Handles revenue tracking and management
 */
import api from '../core/api.js';
import ui from '../core/ui.js';
import validation from '../core/validation.js';
import { dateUtils, numberUtils } from '../core/utils.js';

class RevenueModule {
    constructor() {
        this.revenues = [];
        this.sources = [
            'Taxes', 'Fees', 'Licenses', 
            'Permits', 'Grants', 'Others'
        ];
        this.filters = {
            startDate: null,
            endDate: null,
            source: 'all',
            minAmount: null,
            maxAmount: null
        };
    }

    async init() {
        try {
            await this.loadRevenues();
            this.setupEventListeners();
            this.setupFilters();
            this.renderRevenueChart();
        } catch (error) {
            ui.showNotification('Error initializing revenues', 'error');
            console.error('Revenue init error:', error);
        }
    }

    async loadRevenues() {
        const loader = ui.showLoading();
        try {
            const response = await api.getRevenue(this.filters);
            this.revenues = response.data;
            this.renderRevenueTable();
            this.updateTotalRevenue();
        } catch (error) {
            ui.showNotification('Failed to load revenues', 'error');
        } finally {
            ui.hideLoading(loader);
        }
    }

    renderRevenueTable() {
        const tableContainer = document.getElementById('revenueTable');
        if (!tableContainer) return;

        const table = ui.createTable({
            columns: [
                { field: 'date', label: 'Date', 
                  render: value => dateUtils.formatDate(value) },
                { field: 'source', label: 'Source' },
                { field: 'description', label: 'Description' },
                { field: 'amount', label: 'Amount', 
                  render: value => numberUtils.formatCurrency(value) },
                { field: 'actions', label: 'Actions', 
                  render: (_, row) => this.renderActionButtons(row) }
            ],
            data: this.revenues
        });

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
    }

    renderActionButtons(revenue) {
        return `
            <button class="btn-edit" data-id="${revenue.id}">Edit</button>
            <button class="btn-delete" data-id="${revenue.id}">Delete</button>
        `;
    }

    setupEventListeners() {
        // Add Revenue Button
        const addBtn = document.getElementById('addRevenue');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showRevenueModal());
        }

        // Table Action Buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                const id = e.target.dataset.id;
                this.showRevenueModal(this.revenues.find(rev => rev.id === id));
            } else if (e.target.classList.contains('btn-delete')) {
                const id = e.target.dataset.id;
                this.deleteRevenue(id);
            }
        });

        // Filter Form
        const filterForm = document.getElementById('revenueFilters');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }
    }

    setupFilters() {
        const sourceSelect = document.getElementById('sourceFilter');
        if (sourceSelect) {
            sourceSelect.innerHTML = `
                <option value="all">All Sources</option>
                ${this.sources.map(src => 
                    `<option value="${src}">${src}</option>`
                ).join('')}
            `;
        }

        // Date range picker initialization
        const dateRange = document.getElementById('dateRange');
        if (dateRange) {
            // Initialize date range picker
        }
    }

    async showRevenueModal(revenue = null) {
        const isEdit = !!revenue;
        const modal = ui.showModal({
            title: `${isEdit ? 'Edit' : 'Add'} Revenue`,
            content: `
                <form id="revenueForm">
                    <div class="form-group">
                        <label for="revenueDate">Date</label>
                        <input type="date" id="revenueDate" required 
                               value="${revenue ? revenue.date : ''}">
                    </div>
                    <div class="form-group">
                        <label for="revenueSource">Source</label>
                        <select id="revenueSource" required>
                            ${this.sources.map(src => `
                                <option value="${src}" 
                                    ${revenue && revenue.source === src ? 'selected' : ''}>
                                    ${src}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="revenueDescription">Description</label>
                        <textarea id="revenueDescription" required>
                            ${revenue ? revenue.description : ''}
                        </textarea>
                    </div>
                    <div class="form-group">
                        <label for="revenueAmount">Amount</label>
                        <input type="number" id="revenueAmount" required step="0.01"
                               value="${revenue ? revenue.amount : ''}">
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn-cancel">Cancel</button>
                <button type="button" class="btn-save">Save</button>
            `
        });

        const form = modal.querySelector('#revenueForm');
        const saveBtn = modal.querySelector('.btn-save');
        const cancelBtn = modal.querySelector('.btn-cancel');

        saveBtn.addEventListener('click', async () => {
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const revenueData = {
                    date: formData.get('revenueDate'),
                    source: formData.get('revenueSource'),
                    description: formData.get('revenueDescription'),
                    amount: parseFloat(formData.get('revenueAmount'))
                };

                if (isEdit) {
                    await this.updateRevenue(revenue.id, revenueData);
                } else {
                    await this.addRevenue(revenueData);
                }

                ui.closeModal(modal);
            } else {
                form.reportValidity();
            }
        });

        cancelBtn.addEventListener('click', () => {
            ui.closeModal(modal);
        });
    }

    async addRevenue(revenueData) {
        try {
            await api.addRevenue(revenueData);
            await this.loadRevenues();
            ui.showNotification('Revenue added successfully', 'success');
        } catch (error) {
            ui.showNotification('Failed to add revenue', 'error');
        }
    }

    async updateRevenue(id, revenueData) {
        try {
            await api.updateRevenue(id, revenueData);
            await this.loadRevenues();
            ui.showNotification('Revenue updated successfully', 'success');
        } catch (error) {
            ui.showNotification('Failed to update revenue', 'error');
        }
    }

    async deleteRevenue(id) {
        const confirmed = await ui.showConfirmation(
            'Are you sure you want to delete this revenue?'
        );

        if (confirmed) {
            try {
                await api.deleteRevenue(id);
                await this.loadRevenues();
                ui.showNotification('Revenue deleted successfully', 'success');
            } catch (error) {
                ui.showNotification('Failed to delete revenue', 'error');
            }
        }
    }

    updateTotalRevenue() {
        const totalElement = document.getElementById('totalRevenue');
        if (totalElement) {
            const total = this.revenues.reduce((sum, rev) => sum + rev.amount, 0);
            totalElement.textContent = numberUtils.formatCurrency(total);
        }
    }

    renderRevenueChart() {
        const chartCanvas = document.getElementById('revenueChart');
        if (!chartCanvas) return;

        const sourceTotals = this.revenues.reduce((acc, rev) => {
            acc[rev.source] = (acc[rev.source] || 0) + rev.amount;
            return acc;
        }, {});

        new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(sourceTotals),
                datasets: [{
                    data: Object.values(sourceTotals),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56',
                        '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return `${context.label}: ${numberUtils.formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    applyFilters() {
        const formData = new FormData(document.getElementById('revenueFilters'));
        this.filters = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            source: formData.get('source'),
            minAmount: formData.get('minAmount'),
            maxAmount: formData.get('maxAmount')
        };

        this.loadRevenues();
    }

    generateMonthlyReport() {
        // Implementation for monthly report generation
    }

    exportRevenueData() {
        // Implementation for data export
    }
}

export default new RevenueModule();