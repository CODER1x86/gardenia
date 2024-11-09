/**
 * Financial Service
 * Handles financial calculations and operations
 */
import api from '../core/api.js';
import { dateUtils, numberUtils } from '../core/utils.js';

class FinancialService {
    constructor() {
        this.taxRates = {
            standard: 0.12,
            reduced: 0.06,
            special: 0.03
        };
    }

    async getFinancialSummary(year, month) {
        try {
            const response = await api.request('/api/financial/summary', {
                params: { year, month }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch financial summary');
        }
    }

    async getBalanceSheet(date) {
        try {
            const response = await api.request('/api/financial/balance-sheet', {
                params: { date }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch balance sheet');
        }
    }

    calculateTax(amount, type = 'standard') {
        const rate = this.taxRates[type] || this.taxRates.standard;
        return amount * rate;
    }

    calculateInterest(principal, rate, time) {
        return principal * (rate / 100) * time;
    }

    calculateDepreciation(cost, salvageValue, lifeYears, method = 'straight-line') {
        switch (method) {
            case 'straight-line':
                return (cost - salvageValue) / lifeYears;
            case 'declining-balance':
                return cost * (2 / lifeYears);
            default:
                throw new Error('Unsupported depreciation method');
        }
    }

    async generateFinancialReport(options) {
        try {
            const response = await api.request('/api/financial/report', {
                method: 'POST',
                data: options
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to generate financial report');
        }
    }

    async getFiscalYearData(year) {
        try {
            const response = await api.request('/api/financial/fiscal-year', {
                params: { year }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch fiscal year data');
        }
    }

    calculateBudgetVariance(budgeted, actual) {
        const variance = actual - budgeted;
        const percentageVariance = (variance / budgeted) * 100;
        return {
            absolute: variance,
            percentage: percentageVariance,
            favorable: variance > 0
        };
    }

    async getRevenueProjection(months = 12) {
        try {
            const response = await api.request('/api/financial/revenue-projection', {
                params: { months }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to get revenue projection');
        }
    }

    calculateFinancialRatios(data) {
        return {
            currentRatio: data.currentAssets / data.currentLiabilities,
            quickRatio: (data.currentAssets - data.inventory) / data.currentLiabilities,
            debtToEquity: data.totalLiabilities / data.totalEquity,
            returnOnAssets: data.netIncome / data.totalAssets,
            returnOnEquity: data.netIncome / data.totalEquity
        };
    }

    async getBudgetPerformance(year) {
        try {
            const response = await api.request('/api/financial/budget-performance', {
                params: { year }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch budget performance');
        }
    }

    calculateCashFlow(revenues, expenses) {
        const operatingCashFlow = revenues.reduce((sum, rev) => sum + rev.amount, 0) -
                                 expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return {
            operatingCashFlow,
            netCashFlow: operatingCashFlow // Add other cash flows as needed
        };
    }

    async exportFinancialData(options) {
        try {
            const response = await api.request('/api/financial/export', {
                method: 'POST',
                data: options,
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            throw new Error('Failed to export financial data');
        }
    }
}

export default new FinancialService();