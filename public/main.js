// Import functions from the js folder
import { loadHeaderFooter } from "./js/headerFooter.js";
import { registerUser, loginUser, logoutUser, checkAuth } from "./js/auth.js";
import { fetchProfile, updateProfile } from "./js/profile.js";
import { clearForm, addExpense, loadExpenses, editExpense, deleteExpense } from "./js/expense.js";
import { initializeSiteStyle, updateColor } from "./js/siteStyle.js";
import { showLoadingSpinner, hideLoadingSpinner } from "./js/spinner.js";
import { validateResponse, showError, showSuccess } from "./js/validation.js";
import { fetchAvailableBalance, fetchTotalRevenue, fetchTotalExpenses } from './js/financialData.js';

// Function to build query parameters from filters
function buildQueryParams(filters) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });
  return params.toString();
}

// Fetch and display data with dynamic filters
function fetchData(filters) {
  const queryParams = buildQueryParams(filters);

  // Fetch available balance
  fetchAvailableBalance(filters.year);

  // Fetch total revenue
  fetchTotalRevenue(filters.year);

  // Fetch total expenses
  fetchTotalExpenses(filters.year);

  // Optionally, you can add more specific functions here if needed
}

// Call the fetch functions with default filters on page load
document.addEventListener('DOMContentLoaded', function() {
  const currentYear = new Date().getFullYear();
  const filters = { year: currentYear };
  fetchData(filters);
});

// Event listener for filter changes
document.querySelectorAll('.filter-input').forEach(input => {
  input.addEventListener('change', () => {
    const filters = {
      year: document.getElementById('filter-year').value,
      month: document.getElementById('filter-month').value,
      category: document.getElementById('filter-category').value,
      unitNumber: document.getElementById('filter-unit-number').value,
      floor: document.getElementById('filter-floor').value
    };
    fetchData(filters);
  });
});
// Call the functions on page load
document.addEventListener("DOMContentLoaded", function () {
  loadTemplate("header-placeholder", "header.html");
  loadTemplate("footer-placeholder", "footer.html");

  // Ensure elements exist before adding event listeners
  const form = document.getElementById("input-form");
  if (form) {
    form.addEventListener("submit", addExpense);
  } else {
    console.warn("Form element not found.");
  }

  const clearButton = document.getElementById("clear-form");
  if (clearButton) {
    clearButton.addEventListener("click", clearForm);
  } else {
    console.warn("Clear button element not found.");
  }

  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", updateProfile);
  } else {
    console.warn("Profile form element not found.");
  }

  // Check if expenses load is necessary
  const expenseList = document.getElementById("expense-list");
  if (expenseList) {
    loadExpenses();
  } else {
    console.warn("Expense list container not found.");
  }

  // Check if profile fetch is necessary
  if (profileForm) {
    fetchProfile();
  } else {
    console.warn("Profile form not present for fetching profile.");
  }
});
// Function to update the current year in the footer
function updateCurrentYear() {
  const footerYear = document.getElementById("currentyear");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  } else {
    console.warn("Footer year element not found.");
  }
}

// Initialize date picker
document.addEventListener("DOMContentLoaded", function () {
  const datepickerElems = document.querySelectorAll(".datepicker");
  M.Datepicker.init(datepickerElems, {
    format: "yyyy-mm-dd",
    defaultDate: new Date(),
    setDefaultDate: true,
  });
});

// Function to redirect to login if not authenticated
function requireAuth() {
  fetch("/api/check-auth")
    .then((response) => response.json())
    .then((data) => {
      if (!data.authenticated) {
        window.location.href = "/login.html";
      }
    })
    .catch((error) => {
      console.error("Error checking authentication:", error);
      window.location.href = "/login.html";
    });
}

// Call requireAuth on pages that need authentication
document.addEventListener("DOMContentLoaded", () => {
  if (
    [
      "expense-management.html",
      "footer-settings.html",
      "inventory-management.html",
      "profile.html",
      "revenue-management.html",
      "style-modifier.html",
    ].includes(location.pathname.split("/").pop())
  ) {
    requireAuth();
  }
});

// Function to dynamically load HTML templates into a specified container
function loadTemplate(containerId, templatePath) {
  console.log(`Loading template from ${templatePath} into container ${containerId}`);
  showLoadingSpinner();
  fetch(templatePath)
    .then(response => response.text()) // Use .text() instead of .json()
    .then((htmlContent) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = htmlContent;
        console.log(`Template loaded successfully into ${containerId}`);
      } else {
        console.error(`Container with ID ${containerId} not found.`);
      }
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error loading template:", error);
      showError("Failed to load content.");
      hideLoadingSpinner();
    });
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();

  const inputForm = document.getElementById("input-form");
  if (inputForm) {
    inputForm.addEventListener("submit", addExpense);
  }

  const clearFormButton = document.getElementById("clear-form");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }

  loadExpenses();
});

// Function to initialize application event listeners
function initializeApp() {
  console.log("Initializing application...");

  // Load header and footer
  loadHeaderFooter();

  // Initialize Dropdowns
  initializeDropdowns();

  // Initialize site style
  initializeSiteStyle();

  // Update current year in footer
  updateCurrentYear();

  // Set up logout button listener if available
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Logout button clicked.");
      logoutUser();
    });
  }

  // Set up login form listener if available
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      console.log(`Login form submitted with username: ${username}`);
      loginUser(username, password);
    });
  }

  // Set up registration form listener if available
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = document.getElementById("register-username").value;
      const password = document.getElementById("register-password").value;
      console.log(`Registration form submitted with username: ${username}`);
      registerUser(username, password);
    });
  }

  // Check authentication status on load
  checkAuth();
  console.log("Application initialized.");
}

// Function to initialize dropdown elements
function initializeDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  dropdowns.forEach((dropdown) => {
    M.Dropdown.init(dropdown);
  });
}
