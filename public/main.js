// Snippet 1: Initial Setup and Event Listeners
// This snippet sets up the initial event listeners and calls functions to load the header/footer, fetch data, check authentication status, set the initial language, and populate year options.
console.log("main.js is loaded");
document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter(); // Load common header and footer
  const currentYear = new Date()..getFullYear();
  document.getElementById("currentyear").textContent = currentYear;
  fetchData(); // Fetch data from Node.js server
  checkAuth(); // Check authentication status
  setInitialLanguage(); // Set initial language based on user preference
  setInitialYearOptions(); // Populate year options

  document.getElementById("filter-option").addEventListener("change", handleFilterChange);
  document.getElementById("run-report-btn").addEventListener("click", fetchReportData);
});
// Snippet 2: Handle Filter Changes and Fetch Data
// This snippet defines functions to handle filter changes and fetch data based on the selected filters (year, month, unit, floor).
function handleFilterChange() {
  const filter = document.getElementById("filter-option").value;
  document.getElementById("year-select-container").style.display = filter === "year" || filter === "month" || filter === "unit" ? "block" : "none";
  document.getElementById("month-select-container").style.display = filter === "month" ? "block" : "none";
  document.getElementById("unit-select-container").style.display = filter === "unit" ? "block" : "none";
  document.getElementById("floor-select-container").style.display = filter === "floor" ? "block" : "none";

  if (filter === "unit") {
    populateUnitOptions();
  } else if (filter === "floor") {
    populateFloorOptions();
  }
}

function setInitialYearOptions() {
  const yearSelect = document.getElementById("year-select");
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 2020; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function populateUnitOptions() {
  fetch("/api/units")
    .then((response) => response.json())
    .then((data) => {
      const unitSelect = document.getElementById("unit-select");
      data.forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit.unit_number;
        option.textContent = unit.unit_number;
        unitSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching unit options:", error));
}

function populateFloorOptions() {
  fetch("/api/floors")
    .then((response) => response.json())
    .then((data) => {
      const floorSelect = document.getElementById("floor-select");
      data.forEach((floor) => {
        const option = document.createElement("option");
        option.value = floor.name;
        option.textContent = floor.name;
        floorSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching floor options:", error));
}
// Snippet 3: Fetch Report Data
// This snippet defines the function to fetch and display report data based on selected filters.
function fetchReportData() {
  const filter = document.getElementById("filter-option").value;
  const year = document.getElementById("year-select").value;
  const month = document.getElementById("month-select").value;
  const unit = document.getElementById("unit-select").value;
  const floor = document.getElementById("floor-select").value;
  let query = `/api/revenue-report?filter=${filter}&year=${year}`;
  if (filter === "month") query += `&month=${month}`;
  if (filter === "unit") query += `&unit=${unit}`;
  if (filter === "floor") query += `&floor=${floor}`;
  fetch(query)
    .then((response) => response.json())
    .then((data) => {
      // Populate the table with the fetched data
      const tbody = document.getElementById("report-table-body");
      tbody.innerHTML = "";
      data.forEach((record) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${record.unit_number}</td>
          <td>${record.floor}</td>
          <td>${record.owner_name}</td>
          <td>${record.tenant_name}</td>
          <td>${record.year}</td>
          <td>${record.month}</td>
          <td>${record.amount}</td>
          <td>${record.payment_date}</td>
          <td>${record.payment_method}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch((error) => console.error("Error fetching report data:", error));
}
// Snippet 4: Language Selection and Initial Language Setup
// This snippet defines functions to handle language selection and set the initial language based on user preferences.
function setLanguage(language) {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
  // Additional logic to load the corresponding language content
}

function setInitialLanguage() {
  const language = localStorage.getItem("language") || "en";
  setLanguage(language);
}
// Snippet 5: Fetching Initial Data and Budget Summary
// This snippet defines the function to fetch initial data for the budget summary and display it.
function fetchData() {
  fetch("/api/data") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      if (document.getElementById("available-balance")) {
        document.getElementById("available-balance").textContent = data.availableBalance;
        document.getElementById("total-revenue").textContent = data.totalRevenue;
        document.getElementById("total-expenses").textContent = data.totalExpenses;
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}
// Snippet 6: Load Header and Footer
// This snippet defines functions to load the header and footer, and initialize the menu after loading the header.
function loadHeaderFooter() {
  fetch("/header.html")
    .then(response => response.text())
    .then(html => {
      document.getElementById("header-placeholder").innerHTML = html;
      initializeMenu(); // Make sure to initialize menu after loading header
    })
    .catch(error => console.error("Error loading header:", error));
  
  fetch("/footer.html")
    .then(response => response.text())
    .then(html => {
      document.getElementById("footer-placeholder").innerHTML = html;
    })
    .catch(error => console.error("Error loading footer:", error));
}

function initializeMenu() {
  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  if (typeof M !== "undefined") {
    M.Dropdown.init(dropdowns);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter();
});

function loadContent() {
  const pathname = window.location.pathname;
  switch (pathname) {
    case "/index.html":
      // Load any specific index.html content if necessary
      break;
    case "/budget-summary.html":
      loadBudgetSummary();
      break;
    case "/expense-report.html":
      loadExpenseReport();
      break;
    case "/revenue-report.html":
      loadRevenueReport();
      break;
    case "/expense-input.html":
    case "/revenue-input.html":
      document.getElementById("input-form").addEventListener("submit", handleFormSubmit);
      loadUnitData(); // Load unit data
      break;
  }
}
// Snippet 7: Handle Form Submission and Budget Summary
// This snippet defines functions to handle form submissions and load the budget summary.
function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Array.from(formData.entries()).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
  saveData(data);
}

function loadBudgetSummary() {
  fetch("/api/data")
    .then((response) => response.json())
    .then((data) => {
      let totalRevenue = 12362; // Opening balance of 2024
      let totalExpenses = 0;
      data.values.forEach((row) => {
        const totalPaid = parseFloat(row[row.length - 3]); // Assuming 'Total Paid' is the third last column
        if (!isNaN(totalPaid)) totalRevenue += totalPaid;
      });
      const availableBalance = totalRevenue - totalExpenses;
      document.getElementById("available-balance").textContent = availableBalance.toFixed(2);
      document.getElementById("total-revenue").textContent = totalRevenue.toFixed(2);
      document.getElementById("total-expenses").textContent = totalExpenses.toFixed(2);
    })
    .catch((error) => {
      console.error("Error loading budget summary:", error);
    });
}
// Snippet 8: Load Expense and Revenue Reports
// This snippet defines functions to load and display expense and revenue reports.
function loadExpenseReport() {
  fetch("/api/expense-report")
    .then((response) => response.json())
    .then((data) => {
      let totalExpenses = 0;
      const tableBody = document.getElementById("expense-table-body");
      data.forEach((row) => {
        const rowElement = document.createElement("tr");
        rowElement.innerHTML = `
          <td>${row.category}</td>
          <td>${row.item}</td>
          <td>${row.price}</td>
          <td>${row.expense_date}</td>
          <td>${row.last_updated}</td>
        `;
        tableBody.appendChild(rowElement);
        totalExpenses += parseFloat(row.price);
      });
      document.getElementById("total-expenses").textContent = totalExpenses.toFixed(2);
    })
    .catch((error) => {
      console.error("Error loading expense report:", error);
    });
}

function loadRevenueReport() {
  fetch("/api/revenue-report")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("report-table-body");
      data.forEach((row) => {
        const rowElement = document.createElement("tr");
        rowElement.innerHTML = `
          <td>${row.unit_number}</td>
          <td>${row.floor}</td>
          <td>${row.owner_name}</td>
          <td>${row.tenant_name}</td>
          <td>${row.year}</td>
          <td>${row.month}</td>
          <td>${row.amount}</td>
          <td>${row.payment_date}</td>
          <td>${row.payment_method}</td>
        `;
        tableBody.appendChild(rowElement);
      });
    })
    .catch((error) => {
      console.error("Error loading revenue report:", error);
    });
}
