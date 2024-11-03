// main.js

// Function to show error messages to the user and log errors to console
function showError(message) {
  const errorElement = document.getElementById("error-message");
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

// Function to check if a user is authenticated
function checkAuth() {
  console.log("Checking authentication status...");
  fetch("/api/check-auth")
    .then(validateResponse)
    .then((data) => {
      console.log("Authentication data received:", data);
      const loginLink = document.getElementById("login-link");
      const logoutLink = document.getElementById("logout-link");
      if (data.authenticated) {
        if (loginLink) loginLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "inline";
        console.log("User is authenticated. Showing logout link.");
      } else {
        if (loginLink) loginLink.style.display = "inline";
        if (logoutLink) logoutLink.style.display = "none";
        console.log("User is not authenticated. Showing login link.");
      }
    })
    .catch((error) => {
      console.error("Error checking authentication:", error);
      showError("Failed to check authentication status.");
    });
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
      alert("Registration successful! Please log in.");
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

// Function to initialize application event listeners
function initializeApp() {
  console.log("Initializing application...");

  // Set up logout button listener if available
  const logoutButton = document.getElementById("logout-link");
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Logout button clicked.");
      logoutUser();
    });
  } else {
    console.warn("Logout button not found!");
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
  } else {
    console.warn("Login form not found!");
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
  } else {
    console.warn("Registration form not found!");
  }

  // Check authentication status on load
  checkAuth();
  console.log("Application initialized.");
}
// Function to initialize application event listeners
function initializeApp() {
  console.log("Initializing application...");

  // Load header and footer
  loadTemplate("header-container", "/path/to/header.html");
  loadTemplate("footer-container", "/path/to/footer.html");

  // Set up logout button listener
  const logoutButton = document.getElementById("logout-link");
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Logout button clicked.");
      logoutUser();
    });
  }

  // Set up login form listener
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

  // Set up registration form listener
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

// Call initializeApp to start the application
document.addEventListener("DOMContentLoaded", initializeApp);
