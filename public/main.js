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
// Load header and footer templates
function loadHeaderFooter() {
  loadTemplate("header-placeholder", "header.html");
  loadTemplate("footer-placeholder", "footer.html");
}

// Function to update the current year in the footer
function updateCurrentYear() {
  const footerYear = document.getElementById("currentyear");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  } else {
    console.warn("Footer year element not found.");
  }
}

// Function to show error messages to the user and log errors to console
function showError(message) {
  const errorElement = document.getElementById("feedback-error");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
    console.error(`Error Displayed: ${message}`);
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  } else {
    console.warn("Error element not found.");
  }
}

// Function to show success messages
function showSuccess(message) {
  const successElement = document.getElementById("feedback-success");
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = "block";
    setTimeout(() => {
      successElement.style.display = "none";
    }, 5000);
  } else {
    console.warn("Success element not found.");
  }
}
// Function to validate API responses and log issues
function validateResponse(response) {
  console.log(`Validating response: Status ${response.status}`);
  if (!response.ok) {
    console.error(
      `API error! Status: ${response.status}, Status Text: ${response.statusText}`
    );
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Show a loading spinner during operations and log the event
function showLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = "block";
    console.log("Loading spinner displayed.");
  } else {
    console.warn("Loading spinner element not found.");
  }
}

// Hide the loading spinner and log the event
function hideLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = "none";
    console.log("Loading spinner hidden.");
  } else {
    console.warn("Loading spinner element not found.");
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
// Function to handle user registration
function registerUser(username, password) {
  console.log(`Attempting to register user with username: ${username}`);
  showLoadingSpinner();
  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(validateResponse)
    .then((data) => {
      console.log("Registration successful:", data);
      hideLoadingSpinner();
      showSuccess("Registration successful! Please log in.");
    })
    .catch((error) => {
      console.error("Error during registration:", error);
      showError("Registration failed.");
      hideLoadingSpinner();
    });
}

// Function to handle user login
function loginUser(username, password) {
  console.log(`Attempting to log in user with username: ${username}`);
  showLoadingSpinner();
  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(validateResponse)
    .then((data) => {
      console.log("Login successful:", data);
      hideLoadingSpinner();
      checkAuth(); // Refresh auth status
      if (data.success) window.location.href = "/dashboard"; // Redirect example
    })
    .catch((error) => {
      console.error("Error during login:", error);
      showError("Login failed.");
      hideLoadingSpinner();
    });
}

// Function to handle user logout
function logoutUser() {
  console.log("Attempting to log out user.");
  showLoadingSpinner();
  fetch("/api/logout", { method: "POST" })
    .then(validateResponse)
    .then((data) => {
      console.log("Logout successful:", data);
      hideLoadingSpinner();
      checkAuth(); // Refresh auth status
    })
    .catch((error) => {
      console.error("Error during logout:", error);
      showError("Logout failed.");
      hideLoadingSpinner();
    });
}
// Function to check if a user is authenticated
function checkAuth() {
  console.log("Checking authentication status...");
  fetch("/api/check-auth")
    .then(validateResponse)
    .then((data) => {
      console.log("Authentication data received:", data);
      const loginLink = document.getElementById("login-link");
      const userGreeting = document.getElementById("user-greeting");
      const logoutLink = document.getElementById("logout-link");
      const userNameSpan = document.getElementById("user-name");

      if (data.authenticated) {
        if (loginLink) loginLink.style.display = "none";
        if (userGreeting) userGreeting.style.display = "inline";
        if (logoutLink) logoutLink.style.display = "inline";
        if (userNameSpan) userNameSpan.textContent = data.username;
        console.log("User is authenticated. Showing logout link.");
      } else {
        if (loginLink) loginLink.style.display = "inline";
        if (userGreeting) userGreeting.style.display = "none";
        if (logoutLink) logoutLink.style.display = "none";
        console.log("User is not authenticated. Showing login link.");
      }
    })
    .catch((error) => {
      console.error("Error checking authentication:", error);
      showError("Failed to check authentication status.");
    });
}

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
// Edit Expense Function
async function editExpense(expense_id) {
  const newCategory = prompt("Enter new category:");
  const newItem = prompt("Enter new item:");
  const newPrice = prompt("Enter new price:");
  const newDate = prompt("Enter new date (YYYY-MM-DD):");

  const response = await fetch(`/api/edit-expense/${expense_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: newCategory,
      item: newItem,
      price: newPrice,
      expense_date: newDate,
    }),
  });

  if (response.ok) {
    showSuccess("Expense updated successfully.");
    window.location.reload();
  } else {
    showError("Failed to update expense.");
  }
}

// Delete Expense Function
async function deleteExpense(expense_id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    const response = await fetch(`/api/delete-expense/${expense_id}`, {
      method: "POST",
    });

    if (response.ok) {
      showSuccess("Expense deleted successfully.");
      window.location.reload();
    } else {
      showError("Failed to delete expense.");
    }
  }
}
// Function to clear form inputs
function clearForm() {
  const form = document.getElementById("input-form");
  if (form) {
    form.reset();
    console.log("Form cleared.");
  } else {
    console.warn("Form element not found.");
  }
}

// Function to add a new expense
function addExpense(event) {
  event.preventDefault();
  const category = document.getElementById("category").value;
  const item = document.getElementById("item").value;
  const amount = document.getElementById("amount").value;
  const paymentDay = document.getElementById("payment-day").value;

  showLoadingSpinner();
  fetch("/api/expense-input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, item, amount, payment_date: paymentDay }),
  })
    .then(validateResponse)
    .then((data) => {
      console.log("Expense added:", data);
      hideLoadingSpinner();
      showSuccess("Expense added successfully.");
      clearForm();
      loadExpenses();
    })
    .catch((error) => {
      console.error("Error adding expense:", error);
      showError("Failed to add expense.");
      hideLoadingSpinner();
    });
}
// Function to load expenses and display them in the table
function loadExpenses() {
  console.log("Loading expenses...");
  showLoadingSpinner();
  fetch("/api/expenses")
    .then(validateResponse)
    .then((expenses) => {
      const expenseList = document.getElementById("expense-list");
      if (expenseList) {
        expenseList.innerHTML = expenses
          .map((expense) => {
            return `
              <tr>
                <td>${expense.category}</td>
                <td>${expense.item}</td>
                <td>${expense.price}</td>
                <td>${expense.expense_date}</td>
                <td>
                  <button class="btn-small" onclick="editExpense(${expense.expense_id})">Edit</button>
                  <button class="btn-small red" onclick="deleteExpense(${expense.expense_id})">Delete</button>
                </td>
              </tr>
            `;
          })
          .join("");
        console.log("Expenses loaded and displayed.");
      } else {
        console.error("Expense list container not found.");
      }
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error loading expenses:", error);
      showError("Failed to load expenses.");
      hideLoadingSpinner();
    });
}

// Import functions from the js folder
import { loadHeaderFooter } from '../js/headerFooter.js';
import { registerUser, loginUser, logoutUser, checkAuth } from '../js/auth.js';
import { fetchProfile, updateProfile } from '../js/profile.js';
import { clearForm, addExpense, loadExpenses, editExpense, deleteExpense } from '../js/expense.js';
import { initializeSiteStyle, updateColor } from '../js/siteStyle.js';
import { showLoadingSpinner, hideLoadingSpinner } from '../js/spinner.js';
import { showError, showSuccess } from '../js/validation.js';

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
  const dropdowns = document.querySelectorAll('.dropdown-trigger');
  dropdowns.forEach(dropdown => {
    M.Dropdown.init(dropdown);
  });
}

// Function to update current year in footer
function updateCurrentYear() {
  const currentYear = new Date().getFullYear();
  const footerYearElement = document.getElementById("current-year");
  if (footerYearElement) {
    footerYearElement.textContent = currentYear;
  }
}
