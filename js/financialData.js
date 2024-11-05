// financialData.js

// Function to fetch and display available balance
export function fetchAvailableBalance() {
  fetch('/api/expenses')
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        const availableBalance = calculateAvailableBalance(data);
        document.getElementById('available-balance').textContent = availableBalance.toFixed(2);
      } else {
        console.error('Expected an array for expenses:', data);
      }
    })
    .catch(error => {
      console.error('Error fetching available balance:', error);
    });
}

// Function to fetch and display total revenue
export function fetchTotalRevenue() {
  fetch('/api/revenues')
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        const totalRevenue = calculateTotalRevenue(data);
        document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2);
      } else {
        console.error('Expected an array for revenues:', data);
      }
    })
    .catch(error => {
      console.error('Error fetching total revenue:', error);
    });
}

// Function to fetch and display total expenses
export function fetchTotalExpenses() {
  fetch('/api/expenses')
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        const totalExpenses = calculateTotalExpenses(data);
        document.getElementById('total-expenses').textContent = totalExpenses.toFixed(2);
      } else {
        console.error('Expected an array for expenses:', data);
      }
    })
    .catch(error => {
      console.error('Error fetching total expenses:', error);
    });
}

// Helper functions to calculate totals
function calculateAvailableBalance(expenses) {
  const totalBudget = 10000; // Example budget value
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return totalBudget - totalExpenses;
}

function calculateTotalRevenue(revenues) {
  return revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
}

function calculateTotalExpenses(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}
