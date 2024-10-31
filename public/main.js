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
  const userNameElement = document.getElementById('user-name');
  const logoutLink = document.getElementById('logout-link');

  if (loginLink) loginLink.style.display = isAuthenticated ? 'none' : 'inline';
  if (userGreeting) userGreeting.style.display = isAuthenticated ? 'inline' : 'none';
  if (logoutLink) logoutLink.style.display = isAuthenticated ? 'inline' : 'none';

  if (userGreeting && user && userNameElement) {
    userNameElement.textContent = user.first_name;
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
function validateResponse(response) {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function displayCurrentYear() {
  const currentYearElement = document.getElementById("currentyear");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
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

function updateBudgetSummary(data) {
  const { availableBalance, totalRevenue, totalExpenses } = data;
  updateElementText("available-balance", availableBalance);
  updateElementText("total-revenue", totalRevenue);
  updateElementText("total-expenses", totalExpenses);
}

function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = text;
}

function setLanguagePreference() {
  const language = localStorage.getItem("language") || "en";
  setLanguage(language);
}

function setLanguage(language) {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
}

function initializeOptions() {
  populateYearOptions();
  populateMonthOptions();
  populateCategoryOptions();
}
function populateYearOptions() {
  fetchOptions("/api/years", "year-select", year => year);
}

function populateMonthOptions() {
  const year = document.getElementById("year-select")?.value || new Date().getFullYear();
  fetchOptions(`/api/months?year=${year}`, "month-select", month =>
    new Date(2024, month - 1).toLocaleString("default", { month: "long" })
  );
}

function populateCategoryOptions() {
  fetchOptions("/api/categories", "category-select", category => category);
}

function populateUnitOptions() {
  fetchOptions("/api/units", "unit-select", unit => unit.unit_number);
}

function fetchOptions(apiUrl, selectId, mapFunction) {
  fetch(apiUrl)
    .then(response => validateResponse(response))
    .then(data => populateSelect(selectId, data, mapFunction))
    .catch(error => {
      console.error(`Error fetching options from ${apiUrl}:`, error);
      showError("Failed to load options.");
    });
}

function populateSelect(selectId, data, mapFunction) {
  const selectElement = document.getElementById(selectId);
  if (selectElement) {
    selectElement.innerHTML = "";
    data.forEach(item => {
      const option = document.createElement("option");
      option.value = mapFunction(item);
      option.textContent = mapFunction(item);
      selectElement.appendChild(option);
    });
  }
}

function setupEventListeners() {
  const runReportBtn = document.getElementById("run-report-btn");
  const filterOptions = document.querySelectorAll('input[name="filter-option"]');
  if (runReportBtn) runReportBtn.addEventListener("click", fetchReportData);
  filterOptions.forEach(option =>
    option.addEventListener("change", handleFilterChange)
  );
}

function handleFilterChange() {
  const filter = document.querySelector('input[name="filter-option"]:checked').value;
  toggleFilterContainers(filter);
  if (filter === "unit") populateUnitOptions();
}

function toggleFilterContainers(filter) {
  toggleContainerDisplay("year-select-container", ["year", "month"].includes(filter));
  toggleContainerDisplay("month-select-container", filter === "month");
  toggleContainerDisplay("category-select-container", filter === "category");
  toggleContainerDisplay("unit-select-container", filter === "unit");
}

function toggleContainerDisplay(containerId, condition) {
  const container = document.getElementById(containerId);
  if (container) container.style.display = condition ? "block" : "none";
}
function fetchReportData() {
  const filter = document.querySelector('input[name="filter-option"]:checked').value;
  const year = document.getElementById("year-select").value;
  const month = document.getElementById("month-select").value;
  let query = `/api/budget-details?filter=${filter}&year=${year}`;
  if (filter === "month") query += `&month=${month}`;
  fetch(query)
    .then(response => validateResponse(response))
    .then(data => updateReportTable(data, filter, year, month))
    .catch(error => {
      console.error("Error fetching report data:", error);
      showError("Failed to load report data.");
    });
}

function updateReportTable(data, filter, year, month) {
  const { totalRevenue, totalExpenses, availableBalance } = data;
  updateReportRow(totalRevenue, totalExpenses, availableBalance);
  displaySelectedFilters(filter, year, month);
}

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

function displaySelectedFilters(filter, year, month) {
  const reportInfo = document.getElementById("report-info");
  const selectedFilters = document.getElementById("selected-filters");
  if (reportInfo && selectedFilters) {
    const filterText = filter === "year" ? year : `${month}/${year}`;
    selectedFilters.textContent = filterText;
    reportInfo.style.display = "inline";
  }
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
