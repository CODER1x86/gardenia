//auth.js

// auth.js
import { showLoadingSpinner, hideLoadingSpinner } from "./spinner.js";
import { validateResponse, showError, showSuccess } from "./validation.js";

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

export { registerUser, loginUser, logoutUser, checkAuth };
