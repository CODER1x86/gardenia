document.addEventListener("DOMContentLoaded", function () {
  initializeApp();

  if (document.getElementById("register-form")) {
    setupRegisterForm();
  }
  if (document.getElementById("login-form")) {
    setupLoginForm();
  }
  if (document.getElementById('login-link') || document.getElementById('logout-link')) {
    checkAuth();
  } else {
    console.log("Login/Logout links not found!");
  }
});

function initializeApp() {
  loadHeaderFooter();
  displayCurrentYear();
  fetchData(); // Fetch budget summary data
  setLanguagePreference();
  initializeOptions();
  setupEventListeners();
}
function checkAuth() {
  fetch("/api/check-auth")
    .then(response => response.json())
    .then(data => {
      toggleAuthLinks(data.isAuthenticated, data.user);
      if (data.isAuthenticated) {
        setupLogoutButton();
      }
    })
    .catch(error => {
      console.error("Error checking authentication:", error);
      showError("Authentication check failed.");
    });
}

function toggleAuthLinks(isAuthenticated, user) {
  document.querySelectorAll(".auth-link").forEach(link => {
    link.style.display = isAuthenticated ? "inline" : "none";
  });
  const loginLink = document.getElementById('login-link');
  const userGreeting = document.getElementById('user-greeting');
  const logoutLink = document.getElementById('logout-link');

  if (loginLink) loginLink.style.display = isAuthenticated ? 'none' : 'inline';
  if (userGreeting) userGreeting.style.display = isAuthenticated ? 'inline' : 'none';
  if (logoutLink) logoutLink.style.display = isAuthenticated ? 'inline' : 'none';

  if (userGreeting && user) {
    userGreeting.innerHTML = `Hello ${user.first_name}`;
  }
}

function setupLogoutButton() {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      fetch("/api/logout", { method: "POST" })
        .then(response => {
          if (!response.ok) throw new Error("Logout failed");
          return response.json();
        })
        .then(() => {
          window.location.href = 'index.html'; // Redirect to homepage
        })
        .catch(error => {
          console.error("Error:", error);
          alert("Failed to log out. Please try again.");
        });
    });
  } else {
    console.error("Logout button not found!");
  }
}
function loadHeaderFooter() {
  loadTemplate("/header.html", "header-placeholder", initializeMenu);
  loadTemplate("/footer.html", "footer-placeholder");
}

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

function initializeMenu() {
  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  if (typeof M !== "undefined") M.Dropdown.init(dropdowns);
}

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

function displayCurrentYear() {
  const currentYearElement = document.getElementById("currentyear");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
}
function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = text;
}

function showLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "block";
}

function hideLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "none";
}

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

function validateResponse(response) {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function setupRegisterForm() {
  document.getElementById("register-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    const birthdate = document.getElementById("birthdate").value;
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ first_name, last_name, birthdate, email, username, password })
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Username or email already taken. Please log in or reset your password.");
        }
        throw new Error("Error registering user");
      }
      return response.json();
    })
    .then(data => {
      alert("Registration successful");
      window.location.href = "index.html"; // Redirect to login page
    })
    .catch(error => {
      console.error("Error:", error);
      if (error.message.includes("Username or email already taken")) {
        if (confirm("Username or email already taken. Do you want to log in or reset your password?")) {
          window.location.href = "login.html"; // Redirect to login page
        }
      } else {
        alert(error.message);
      }
    });
  });

  document.getElementById("password").addEventListener("input", updatePasswordStrength);
}

function updatePasswordStrength() {
  const password = document.getElementById("password").value;
  const meter = document.getElementById("password-strength-meter");
  const text = document.getElementById("password-strength-text");
  const strength = calculatePasswordStrength(password);

  meter.value = strength.score;
  text.textContent = `Strength: ${strength.text}`;
}

function calculatePasswordStrength(password) {
  let score = 0;
  let text = "Very Weak";

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 1: text = "Weak"; break;
    case 2: text = "Fair"; break;
    case 3: text = "Good"; break;
    case 4: text = "Strong"; break;
  }

  return { score, text };
}

function setupLoginForm() {
  document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid username or password");
      }
      return response.json();
    })
    .then((data) => {
      alert("Login successful");
      window.location.href = "index.html"; // Redirect to users area
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(error.message);
    });
  });
}
