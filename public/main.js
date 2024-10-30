console.log("main.js is loaded");

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();

  // Logout functionality
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      document.getElementById("facility-management").style.display = "none";
      document.getElementById("site-settings").style.display = "none";
      document.getElementById("login-link").style.display = "block";
      document.getElementById("logout-link").style.display = "none";
      alert("Logged out successfully!");
    });
  } else {
    console.error("Logout button not found!");
  }
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
    .then((response) => {
      if (!response.ok)
        throw new Error(`Error loading template: ${response.status}`);
      return response.text();
    })
    .then((html) => {
      const placeholder = document.getElementById(placeholderId);
      if (placeholder) placeholder.innerHTML = html;
      if (callback) callback();
    })
    .catch((error) => console.error(error));
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
    .then((response) => validateResponse(response))
    .then((data) => {
      updateBudgetSummary(data);
      hideLoadingSpinner(); // Hide loading spinner
    })
    .catch((error) => {
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
// Check Authentication Status
function checkAuth() {
  fetch("/api/check-auth")
    .then((response) => validateResponse(response))
    .then((data) => toggleAuthLinks(data.isAuthenticated))
    .catch((error) => {
      console.error("Error checking authentication:", error);
      showError("Authentication check failed.");
    });
}

// Toggle Authenticated Links
function toggleAuthLinks(isAuthenticated) {
  document.querySelectorAll(".auth-link").forEach((link) => {
    link.style.display = isAuthenticated ? "inline" : "none";
  });
}

// Mock authentication function
function login(username, password) {
  // Here, you would normally verify the credentials with your server
  const authenticated = true; // Simulate successful authentication
  if (authenticated) {
    document.getElementById("facility-management").style.display = "block";
    document.getElementById("site-settings").style.display = "block";
    document.getElementById("login-link").style.display = "none";
    document.getElementById("logout-link").style.display = "block";
    alert("Login successful!");
  } else {
    alert("Login failed. Please try again.");
  }
}
// Logout functionality
document.getElementById("logout-button").addEventListener("click", () => {
  document.getElementById("facility-management").style.display = "none";
  document.getElementById("site-settings").style.display = "none";
  document.getElementById("login-link").style.display = "block";
  document.getElementById("logout-link").style.display = "none";
  alert("Logged out successfully!");
});

// Set Language Preference
function setLanguagePreference() {
  const language = localStorage.getItem("language") || "en";
  setLanguage(language);
}

// Set Language in HTML Document
function setLanguage(language) {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
}

// Initialize Options for Filters
function initializeOptions() {
  populateYearOptions();
  populateMonthOptions();
  populateCategoryOptions();
}

// Populate Year Options
function populateYearOptions() {
  fetchOptions("/api/years", "year-select", (year) => year);
}
// Populate Month Options
function populateMonthOptions() {
  const year =
    document.getElementById("year-select")?.value || new Date().getFullYear();
  fetchOptions(`/api/months?year=${year}`, "month-select", (month) =>
    new Date(2024, month - 1).toLocaleString("default", { month: "long" })
  );
}

// Populate Category Options
function populateCategoryOptions() {
  fetchOptions("/api/categories", "category-select", (category) => category);
}

// Populate Unit Options
function populateUnitOptions() {
  fetchOptions("/api/units", "unit-select", (unit) => unit.unit_number);
}

// Generic Function to Fetch and Populate Options
function fetchOptions(apiUrl, selectId, mapFunction) {
  fetch(apiUrl)
    .then((response) => validateResponse(response))
    .then((data) => populateSelect(selectId, data, mapFunction))
    .catch((error) => {
      console.error(`Error fetching options from ${apiUrl}:`, error);
      showError("Failed to load options.");
    });
}

// Populate Select Element with Data
function populateSelect(selectId, data, mapFunction) {
  const selectElement = document.getElementById(selectId);
  if (selectElement) {
    selectElement.innerHTML = "";
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = mapFunction(item);
      option.textContent = mapFunction(item);
      selectElement.appendChild(option);
    });
  }
}
// Setup Event Listeners
function setupEventListeners() {
  const runReportBtn = document.getElementById("run-report-btn");
  const filterOptions = document.querySelectorAll(
    'input[name="filter-option"]'
  );
  if (runReportBtn) runReportBtn.addEventListener("click", fetchReportData);
  filterOptions.forEach((option) =>
    option.addEventListener("change", handleFilterChange)
  );
}

// Handle Filter Change
function handleFilterChange() {
  const filter = document.querySelector(
    'input[name="filter-option"]:checked'
  ).value;
  toggleFilterContainers(filter);
  if (filter === "unit") populateUnitOptions();
}

// Toggle Filter Containers Display
function toggleFilterContainers(filter) {
  toggleContainerDisplay(
    "year-select-container",
    ["year", "month"].includes(filter)
  );
  toggleContainerDisplay("month-select-container", filter === "month");
  toggleContainerDisplay("category-select-container", filter === "category");
  toggleContainerDisplay("unit-select-container", filter === "unit");
}

// Show or Hide Container Based on Condition
function toggleContainerDisplay(containerId, condition) {
  const container = document.getElementById(containerId);
  if (container) container.style.display = condition ? "block" : "none";
}
// Fetch Report Data
function fetchReportData() {
  const filter = document.querySelector(
    'input[name="filter-option"]:checked'
  ).value;
  const year = document.getElementById("year-select").value;
  const month = document.getElementById("month-select").value;
  let query = `/api/budget-details?filter=${filter}&year=${year}`;
  if (filter === "month") query += `&month=${month}`;
  fetch(query)
    .then((response) => validateResponse(response))
    .then((data) => updateReportTable(data, filter, year, month))
    .catch((error) => {
      console.error("Error fetching report data:", error);
      showError("Failed to load report data.");
    });
}

// Update Report Table
function updateReportTable(data, filter, year, month) {
  const { totalRevenue, totalExpenses, availableBalance } = data;
  updateReportRow(totalRevenue, totalExpenses, availableBalance);
  displaySelectedFilters(filter, year, month);
}

// Update Report Row with Data
function updateReportRow(totalRevenue, totalExpenses, availableBalance) {
  const tbody = document.getElementById("budget-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td>${totalRevenue}</td>
        <td>${totalExpenses}</td>
        <td>${availableBalance}</td>
      </tr>
    `;
  }
}

// Display Selected Filters
function displaySelectedFilters(filter, year, month) {
  const reportInfo = document.getElementById("report-info");
  const selectedFilters = document.getElementById("selected-filters");
  if (reportInfo && selectedFilters) {
    const filterText = filter === "year" ? year : `${month}/${year}`;
    selectedFilters.textContent = filterText;
    reportInfo.style.display = "inline";
  }
}
// Show loading spinner
function showLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "block";
}

// Hide loading spinner
function hideLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "none";
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000); // Hide after 5 seconds
  }
}
