// Snippet 1: Initial Setup and Event Listeners
// This snippet sets up the initial event listeners and calls functions to load the header/footer, fetch data, check authentication status, set the initial language, and populate year options.
console.log("main.js is loaded");
document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter(); // Load common header and footer
  const currentYear = new Date()..getFullYear();
  document.getElementById("currentyear").textContent = currentYear;
  fetchData(); // Fetch data from Node.js server
  checkAuth(); // Check authentication status
  setInitialLanguage(); // Set initial language based on user preference
  setInitialYearOptions(); // Populate year options

  document.getElementById("filter-option").addEventListener("change", handleFilterChange);
  document.getElementById("run-report-btn").addEventListener("click", fetchReportData);
});
