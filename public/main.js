console.log("main.js is loaded");

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

// Initialize Application Setup
function initializeApp() {
  loadHeaderFooter();
  displayCurrentYear();
  checkAuth();
  fetchData(); // Fetch budget summary data
  setLanguagePreference();
  initializeOptions();
  setupEventListeners();
}

// Display Current Year
function displayCurrentYear() {
  const currentYearElement = document.getElementById("currentyear");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
}
// Load Header and Footer Templates
function loadHeaderFooter() {
  loadTemplate("/header.html", "header-placeholder", initializeMenu);
  loadTemplate("/footer.html", "footer-placeholder");
}

// Generic Template Loader
function loadTemplate(url, placeholderId, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Error loading template: ${response.status}`);
      return response.text();
    })
    .then(html => {
      const placeholder = document.getElementById(placeholderId);
      if (placeholder) placeholder.innerHTML = html;
      if (callback) callback();
    })
    .catch(error => console.error(error));
}

// Initialize Menu Dropdown
function initializeMenu() {
  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  if (typeof M !== "undefined") M.Dropdown.init(dropdowns);
}
// Fetch Budget Summary Data
function fetchData() {
  showLoadingSpinner(); // Show loading spinner
  fetch("/api/data")
    .then(response => validateResponse(response))
    .then(data => {
      updateBudgetSummary(data);
      hideLoadingSpinner(); // Hide loading spinner
    })
    .catch(error => {
      console.error("Error fetching budget data:", error);
      hideLoadingSpinner(); // Hide loading spinner on error
      showError("Failed to load budget data.");
    });
}

// Validate HTTP Response
function validateResponse(response) {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

// Update Budget Summary
function updateBudgetSummary(data) {
  const { availableBalance, totalRevenue, totalExpenses } = data;
  updateElementText("available-balance", availableBalance);
  updateElementText("total-revenue", totalRevenue);
  updateElementText("total-expenses", totalExpenses);
}

// Update Text Content for Element
function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = text;
}
