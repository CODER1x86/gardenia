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
document.addEventListener('DOMContentLoaded', function() {
  const datepickerElems = document.querySelectorAll('.datepicker');
  M.Datepicker.init(datepickerElems, {
    format: 'yyyy-mm-dd',
    defaultDate: new Date(),
    setDefaultDate: true
  });
});

// Function to initialize dropdowns
function initializeDropdowns() {
  const dropdownElems = document.querySelectorAll(".dropdown-trigger");
  M.Dropdown.init(dropdownElems, { hover: true, coverTrigger: false });
  console.log("Dropdowns initialized.");
}
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

// Function to dynamically load HTML templates into a specified container
function loadTemplate(containerId, templatePath) {
  console.log(
    `Loading template from ${templatePath} into container ${containerId}`
  );
  showLoadingSpinner();
  fetch(templatePath)
    .then(validateResponse)
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
