// Snippet 1: Initial Setup and Event Listeners
// Sets up initial event listeners, loads the header/footer, fetches initial data, and populates year options.
console.log("main.js is loaded");

document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter(); // Load common header and footer
  const currentYearElement = document.getElementById("currentyear");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
  fetchData(); // Fetch budget data from the server
  checkAuth(); // Check authentication status
  setInitialLanguage(); // Set language based on user preference
  setInitialYearOptions(); // Populate year options
  setInitialMonthOptions(); // Populate month options
  setInitialCategoryOptions(); // Populate category options
  const filterOption = document.getElementById("filter-option");
  if (filterOption) {
    filterOption.addEventListener("change", handleFilterChange);
  }
  const runReportBtn = document.getElementById("run-report-btn");
  if (runReportBtn) {
    runReportBtn.addEventListener("click", fetchReportData);
  }
});
// Snippet 2: Filter Changes and Data Fetching
// Functions to handle filter changes and fetch data based on selected filters (year, month, unit).
function handleFilterChange() {
  const filter = document.querySelector(
    'input[name="filter-option"]:checked'
  ).value;
  document.getElementById("year-select-container").style.display =
    filter === "year" || filter === "month" ? "block" : "none";
  document.getElementById("month-select-container").style.display =
    filter === "month" ? "block" : "none";
  document.getElementById("unit-select-container").style.display =
    filter === "unit" ? "block" : "none";
  if (filter === "unit") {
    populateUnitOptions();
  }
}

document.querySelectorAll('input[name="filter-option"]').forEach((elem) => {
  elem.addEventListener("change", handleFilterChange);
});

function setInitialYearOptions() {
  fetch("/api/years")
    .then((response) => response.json())
    .then((data) => {
      const yearSelect = document.getElementById("year-select");
      if (yearSelect) {
        yearSelect.innerHTML = ''; // Clear existing options
        data.forEach((year) => {
          const option = document.createElement("option");
          option.value = year.year;
          option.textContent = year.year;
          yearSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching years:", error));
}

function setInitialMonthOptions() {
  const year = document.getElementById("year-select").value;
  fetch(`/api/months?year=${year}`)
    .then((response) => response.json())
    .then((data) => {
      const monthSelect = document.getElementById("month-select");
      if (monthSelect) {
        monthSelect.innerHTML = ""; // Clear existing options
        data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.month;
          option.textContent = new Date(2024, item.month - 1).toLocaleString(
            "default",
            { month: "long" }
          ); // Convert month number to month name
          monthSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching months:", error));
}

function populateUnitOptions() {
  fetch("/api/units")
    .then((response) => response.json())
    .then((data) => {
      const unitSelect = document.getElementById("unit-select");
      if (unitSelect) {
        unitSelect.innerHTML = ""; // Clear existing options
        data.forEach((unit) => {
          const option = document.createElement("option");
          option.value = unit.unit_number;
          option.textContent = unit.unit_number;
          unitSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching unit options:", error));
}
// Snippet 3: Fetch and Display Report Data
// Fetches report data based on selected filters and displays it in the table.
function fetchReportData() {
  const filter = document.querySelector(
    'input[name="filter-option"]:checked'
  ).value;
  const year = document.getElementById("year-select").value;
  const month = document.getElementById("month-select").value;
  let query = `/api/budget-details?filter=${filter}&year=${year}`;
  if (filter === "month") query += `&month=${month}`;
  fetch(query)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const tbody = document.getElementById("budget-table-body");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td>${data.totalRevenue}</td>
            <td>${data.totalExpenses}</td>
            <td>${data.availableBalance}</td>
          </tr>
        `;
      }
      const reportInfo = document.getElementById("report-info");
      const selectedFilters = document.getElementById("selected-filters");
      if (reportInfo && selectedFilters) {
        let filterText = filter === "year" ? year : `${month}/${year}`;
        selectedFilters.textContent = filterText;
        reportInfo.style.display = "inline";
      }
    })
    .catch((error) => console.error("Error fetching report data:", error));
}
// Snippet 4: Language Selection
// Set language preference and apply it to the document.
function setLanguage(language) {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
}

function setInitialLanguage() {
  const language = localStorage.getItem("language") || "en";
  setLanguage(language);
}
// Snippet 5: Load Header and Footer
// Loads header and footer templates, and initializes the menu after loading the header.
function loadHeaderFooter() {
  fetch("/header.html")
    .then((response) => response.text())
    .then((html) => {
      const headerPlaceholder = document.getElementById("header-placeholder");
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = html;
        initializeMenu();
      }
    })
    .catch((error) => console.error("Error loading header:", error));

  fetch("/footer.html")
    .then((response) => response.text())
    .then((html) => {
      const footerPlaceholder = document.getElementById("footer-placeholder");
      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = html;
      }
    })
    .catch((error) => console.error("Error loading footer:", error));
}

function initializeMenu() {
  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  if (typeof M !== "undefined") {
    M.Dropdown.init(dropdowns);
  }
}
// Snippet 6: Data Fetching for Budget Summary
// Fetches initial budget data to populate the budget summary section.
function fetchData() {
  fetch("/api/data")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const availableBalance = document.getElementById("available-balance");
      const totalRevenue = document.getElementById("total-revenue");
      const totalExpenses = document.getElementById("total-expenses");
      if (availableBalance) {
        availableBalance.textContent = data.availableBalance;
      }
      if (totalRevenue) {
        totalRevenue.textContent = data.totalRevenue;
      }
      if (totalExpenses) {
        totalExpenses.textContent = data.totalExpenses;
      }
    })
    .catch((error) => console.error("Error fetching budget data:", error));
}
// Snippet 7: Authentication Handling
// Checks authentication status and controls visibility of authenticated links.
function checkAuth() {
  fetch("/api/check-auth")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const authenticatedLinks = document.getElementById("authenticated-links");
      const loginLink = document.getElementById("login-link");
      const logoutLink = document.getElementById("logout-link");
      if (data.authenticated) {
        if (authenticatedLinks) authenticatedLinks.style.display = "block";
        if (loginLink) loginLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "block";
      } else {
        if (authenticatedLinks) authenticatedLinks.style.display = "none";
        if (loginLink) loginLink.style.display = "block";
        if (logoutLink) logoutLink.style.display = "none";
      }
    })
    .catch((error) => console.error("Error checking auth status:", error));
}
// Snippet 8: Populate Floor Options
// Function to populate floor options from the server
function populateFloorOptions() {
  fetch("/api/floors")
    .then((response) => response.json())
    .then((data) => {
      const floorSelect = document.getElementById("floor-select");
      if (floorSelect) {
        floorSelect.innerHTML = ''; // Clear existing options
        data.forEach((floor) => {
          const option = document.createElement("option");
          option.value = floor.name;
          option.textContent = floor.name;
          floorSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching floor options:", error));
}
// Snippet 9: Load Unit Data and Handle Display
// Function to load unit data and handle the display of detailed information
function loadUnitData() {
  const unitNumberSelect = document.getElementById("unit-number");
  const floorField = document.getElementById("floor");
  const ownerNameField = document.getElementById("owner-name");
  const tenantNameField = document.getElementById("tenant-name");

  fetch("/api/units")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const unitData = data.reduce((acc, unit) => {
        acc[unit.unit_number] = {
          floor: unit.floor,
          owner: unit.owner,
          ownerPhone: unit.ownerPhone,
          tenant: unit.tenant,
          tenantPhone: unit.tenantPhone,
          lastPaymentMonth: unit.lastPaymentMonth,
          lastPaymentDate: unit.lastPaymentDate,
        };
        return acc;
      }, {});

      if (unitNumberSelect) {
        unitNumberSelect.addEventListener("change", function () {
          const selectedUnit = this.value;
          if (unitData[selectedUnit]) {
            floorField.textContent = unitData[selectedUnit].floor;
            ownerNameField.textContent = unitData[selectedUnit].owner;
            tenantNameField.textContent = unitData[selectedUnit].tenant || "";
            document.getElementById("owner-phone").textContent =
              unitData[selectedUnit].ownerPhone;
            document.getElementById("tenant-phone").textContent =
              unitData[selectedUnit].tenantPhone || "";
            document.getElementById("last-payment-month").textContent =
              unitData[selectedUnit].lastPaymentMonth;
            document.getElementById("last-payment-date").textContent =
              unitData[selectedUnit].lastPaymentDate;
            document.getElementById("unit-details").style.display = "block";
          } else {
            document.getElementById("unit-details").style.display = "none";
          }
        });
      }
    })
    .catch((error) => console.error("Error loading unit data:", error));
}
