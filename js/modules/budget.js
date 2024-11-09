/**
 * Budget Module
 * Handles budget-related operations and UI
 */
import api from '../core/api.js';
import ui from '../core/ui.js';
import { dateUtils, numberUtils } from '../core/utils.js';
import validation from '../core/validation.js';

class BudgetModule {
    constructor() {
        this.currentYear = dateUtils.getCurrentYear();
        this.currentMonth = dateUtils.getCurrentMonth();
        this.summary = {
            revenue: 0,
            expenses: 0,
            balance: 0
        };
    }

    async init() {
        try {
            await this.loadBudgetSummary();
            this.setupEventListeners();
            this.renderCharts();
        } catch (error) {
            ui.showNotification('Error loading budget data', 'error');
            console.error('Budget init error:', error);
        }
    }

    async loadBudgetSummary() {
        const loader = ui.showLoading();
        try {
            const [revenue, expenses] = await Promise.all([
                api.getRevenue({ year: this.currentYear }),
                api.getExpenses({ year: this.currentYear })
            ]);

            this.summary = {
                revenue: revenue.total || 0,
                expenses: expenses.total || 0,
                balance: (revenue.total || 0) - (expenses.total || 0)
            };

            this.updateSummaryUI();
        } catch (error) {
            ui.showNotification('Failed to load budget summary', 'error');
            console.error('Load summary error:', error);
        } finally {
            ui.hideLoading(loader);
        }
    }

    updateSummaryUI() {
        const elements = {
            revenue: document.getElementById('totalRevenue'),
            expenses: document.getElementById('totalExpenses'),
            balance: document.getElementById('netBalance')
        };

        if (elements.revenue) {
            elements.revenue.textContent = numberUtils.formatCurrency(this.summary.revenue);
            elements.revenue.className = 'amount positive';
        }

        if (elements.expenses) {
            elements.expenses.textContent = numberUtils.formatCurrency(this.summary.expenses);
            elements.expenses.className = 'amount negative';
        }

        if (elements.balance) {
            elements.balance.textContent = numberUtils.formatCurrency(this.summary.balance);
            elements.balance.className = `amount ${this.summary.balance >= 0 ? 'positive' : 'negative'}`;
        }
    }

    setupEventListeners() {
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.value = this.currentYear;
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.loadBudgetSummary();
            });
        }

        const exportBtn = document.getElementById('exportBudget');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportBudgetReport());
        }
    }

    async renderCharts() {
        const monthlyData = await this.getMonthlyData();
        
        // Revenue vs Expenses Chart
        const comparisonChart = document.getElementById('budgetComparison');
        if (comparisonChart) {
            new Chart(comparisonChart, {
                type: 'bar',
                data: {
                    labels: monthlyData.map(d => dateUtils.getMonthName(d.month)),
                    datasets: [
                        {
                            label: 'Revenue',
                            data: monthlyData.map(d => d.revenue),
                            backgroundColor: 'rgba(75, 192, 192, 0.5)'
                        },
                        {
                            label: 'Expenses',
                            data: monthlyData.map(d => d.expenses),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => numberUtils.formatCurrency(value)
                            }
                        }
                    }
                }
            });
        }

        // Balance Trend Chart
        const trendChart = document.getElementById('balanceTrend');
        if (trendChart) {
            new Chart(trendChart, {
                type: 'line',
                data: {
                    labels: monthlyData.map(d => dateUtils.getMonthName(d.month)),
                    datasets: [{
                        label: 'Net Balance',
                        data: monthlyData.map(d => d.revenue - d.expenses),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            ticks: {
                                callback: value => numberUtils.formatCurrency(value)
                            }
                        }
                    }
                }
            });
        }
    }

    async getMonthlyData() {
        try {
            const response = await api.request('/api/budget/monthly', {
                params: { year: this.currentYear }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching monthly data:', error);
            return [];
        }
    }

    async exportBudgetReport() {
        const loader = ui.showLoading();
        try {
            const response = await api.request('/api/budget/export', {
                params: { year: this.currentYear },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget_report_${this.currentYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            ui.showNotification('Budget report exported successfully', 'success');
        } catch (error) {
            ui.showNotification('Failed to export budget report', 'error');
            console.error('Export error:', error);
        } finally {
            ui.hideLoading(loader);
        }
    }
}

export default new BudgetModule();