/**
 * Expense Module
 * Handles expense tracking and management
 */
import api from '../core/api.js';
import ui from '../core/ui.js';
import validation from '../core/validation.js';
import { dateUtils, numberUtils } from '../core/utils.js';

class ExpenseModule {
    constructor() {
        this.expenses = [];
        this.categories = [
            'Utilities', 'Maintenance', 'Supplies', 
            'Salaries', 'Equipment', 'Others'
        ];
        this.filters = {
            startDate: null,
            endDate: null,
            category: 'all',
            minAmount: null,
            maxAmount: null
        };
    }

    async init() {
        try {
            await this.loadExpenses();
            this.setupEventListeners();
            this.setupFilters();
            this.renderExpenseChart();
        } catch (error) {
            ui.showNotification('Error initializing expenses', 'error');
            console.error('Expense init error:', error);
        }
    }

    async loadExpenses() {
        const loader = ui.showLoading();
        try {
            const response = await api.getExpenses(this.filters);
            this.expenses = response.data;
            this.renderExpenseTable();
            this.updateTotalExpenses();
        } catch (error) {
            ui.showNotification('Failed to load expenses', 'error');
        } finally {
            ui.hideLoading(loader);
        }
    }

    renderExpenseTable() {
        const tableContainer = document.getElementById('expenseTable');
        if (!tableContainer) return;

        const table = ui.createTable({
            columns: [
                { field: 'date', label: 'Date', 
                  render: value => dateUtils.formatDate(value) },
                { field: 'category', label: 'Category' },
                { field: 'description', label: 'Description' },
                { field: 'amount', label: 'Amount', 
                  render: value => numberUtils.formatCurrency(value) },
                { field: 'actions', label: 'Actions', 
                  render: (_, row) => this.renderActionButtons(row) }
            ],
            data: this.expenses
        });

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
    }

    renderActionButtons(expense) {
        return `
            <button class="btn-edit" data-id="${expense.id}">Edit</button>
            <button class="btn-delete" data-id="${expense.id}">Delete</button>
        `;
    }

    setupEventListeners() {
        // Add Expense Button
        const addBtn = document.getElementById('addExpense');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showExpenseModal());
        }

        // Table Action Buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                const id = e.target.dataset.id;
                this.showExpenseModal(this.expenses.find(exp => exp.id === id));
            } else if (e.target.classList.contains('btn-delete')) {
                const id = e.target.dataset.id;
                this.deleteExpense(id);
            }
        });

        // Filter Form
        const filterForm = document.getElementById('expenseFilters');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }
    }

    setupFilters() {
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="all">All Categories</option>
                ${this.categories.map(cat => 
                    `<option value="${cat}">${cat}</option>`
                ).join('')}
            `;
        }

        // Date range picker initialization
        const dateRange = document.getElementById('dateRange');
        if (dateRange) {
            // Initialize date range picker (implementation depends on your chosen library)
        }
    }

    async showExpenseModal(expense = null) {
        const isEdit = !!expense;
        const modal = ui.showModal({
            title: `${isEdit ? 'Edit' : 'Add'} Expense`,
            content: `
                <form id="expenseForm">
                    <div class="form-group">
                        <label for="expenseDate">Date</label>
                        <input type="date" id="expenseDate" required 
                               value="${expense ? expense.date : ''}">
                    </div>
                    <div class="form-group">
                        <label for="expenseCategory">Category</label>
                        <select id="expenseCategory" required>
                            ${this.categories.map(cat => `
                                <option value="${cat}" 
                                    ${expense && expense.category === cat ? 'selected' : ''}>
                                    ${cat}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseDescription">Description</label>
                        <textarea id="expenseDescription" required>
                            ${expense ? expense.description : ''}
                        </textarea>
                    </div>
                    <div class="form-group">
                        <label for="expenseAmount">Amount</label>
                        <input type="number" id="expenseAmount" required step="0.01"
                               value="${expense ? expense.amount : ''}">
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn-cancel">Cancel</button>
                <button type="button" class="btn-save">Save</button>
            `
        });

        const form = modal.querySelector('#expenseForm');
        const saveBtn = modal.querySelector('.btn-save');
        const cancelBtn = modal.querySelector('.btn-cancel');

        saveBtn.addEventListener('click', async () => {
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const expenseData = {
                    date: formData.get('expenseDate'),
                    category: formData.get('expenseCategory'),
                    description: formData.get('expenseDescription'),
                    amount: parseFloat(formData.get('expenseAmount'))
                };

                if (isEdit) {
                    await this.updateExpense(expense.id, expenseData);
                } else {
                    await this.addExpense(expenseData);
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

    async addExpense(expenseData) {
        try {
            await api.addExpense(expenseData);
            await this.loadExpenses();
            ui.showNotification('Expense added successfully', 'success');
        } catch (error) {
            ui.showNotification('Failed to add expense', 'error');
        }
    }

    async updateExpense(id, expenseData) {
        try {
            await api.updateExpense(id, expenseData);
            await this.loadExpenses();
            ui.showNotification('Expense updated successfully', 'success');
        } catch (error) {
            ui.showNotification('Failed to update expense', 'error');
        }
    }

    async deleteExpense(id) {
        const confirmed = await ui.showConfirmation(
            'Are you sure you want to delete this expense?'
        );

        if (confirmed) {
            try {
                await api.deleteExpense(id);
                await this.loadExpenses();
                ui.showNotification('Expense deleted successfully', 'success');
            } catch (error) {
                ui.showNotification('Failed to delete expense', 'error');
            }
        }
    }

    updateTotalExpenses() {
        const totalElement = document.getElementById('totalExpenses');
        if (totalElement) {
            const total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            totalElement.textContent = numberUtils.formatCurrency(total);
        }
    }

    renderExpenseChart() {
        const chartCanvas = document.getElementById('expenseChart');
        if (!chartCanvas) return;

        const categoryTotals = this.expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
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
        const formData = new FormData(document.getElementById('expenseFilters'));
        this.filters = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            category: formData.get('category'),
            minAmount: formData.get('minAmount'),
            maxAmount: formData.get('maxAmount')
        };

        this.loadExpenses();
    }
}

export default new ExpenseModule();