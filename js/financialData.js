// financialData.js

// Function to fetch and display available balance
export function fetchAvailableBalance(year) {
  fetch(`/api/balance?year=${year}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('available-balance').textContent = data.availableBalance.toFixed(2);
    })
    .catch(error => {
      console.error('Error fetching available balance:', error);
    });
}

// Function to fetch and display total revenue
export function fetchTotalRevenue(year) {
  fetch(`/api/revenues?year=${year}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('total-revenue').textContent = data.totalRevenue.toFixed(2);
    })
    .catch(error => {
      console.error('Error fetching total revenue:', error);
    });
}

// Function to fetch and display total expenses
export function fetchTotalExpenses(year) {
  fetch(`/api/expenses?year=${year}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('total-expenses').textContent = data.totalExpenses.toFixed(2);
    })
    .catch(error => {
      console.error('Error fetching total expenses:', error);
    });
}

// Call the functions on page load
document.addEventListener('DOMContentLoaded', function() {
  const currentYear = new Date().getFullYear();
  fetchAvailableBalance(currentYear);
  fetchTotalRevenue(currentYear);
  fetchTotalExpenses(currentYear);
});
