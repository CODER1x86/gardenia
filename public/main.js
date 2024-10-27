//Snippet 1: Initial Setup and Event Listeners

console.log("main.js is loaded");
document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter(); // Load common header and footer
  const currentYear = new Date().getFullYear();
  document.getElementById("currentyear").textContent = currentYear;
  fetchData(); // Fetch data from Node.js server
  checkAuth(); // Check authentication status
  setInitialLanguage(); // Set initial language based on user preference
  setInitialYearOptions(); // Populate year options

  document.getElementById("filter-option").addEventListener("change", handleFilterChange);
  document.getElementById("run-report-btn").addEventListener("click", fetchReportData);
});

//Snippet 2: Handle Filter Changes and Fetch Data

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
  fetch("/api/units") // Updated to use your new API endpoint
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
  fetch("/api/floors") // Updated to use your new API endpoint
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

//Snippet 3: Fetch Report Data

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
    .then(response => response.json())
    .then(data => {
      // Populate the table with the fetched data
      const tbody = document.getElementById("report-table-body");
      tbody.innerHTML = "";
      data.forEach(record => {
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
    .catch(error => console.error("Error fetching report data:", error));
}

//Snippet 4: Language Selection and Initial Language Setup

// Language selection
function setLanguage(language) {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
  // Additional logic to load the corresponding language content
}

function setInitialLanguage() {
  const language = localStorage.getItem("language") || "en";
  setLanguage(language);
}

//Snippet 5: Fetching Initial Data and Budget Summary

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

//Snippet 6: Load Header and Footer

function loadHeaderFooter() {
  fetch("/public/header.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("header-placeholder").innerHTML = html;
    });
  fetch("/public/footer.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("footer-placeholder").innerHTML = html;
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });
}

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

//Snippet 7: Handle Form Submission and Budget Summary

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

//Snippet 8: Load Expense and Revenue Reports

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

//Snippet 9: Load Unit Data

function loadUnitData() {
  const unitNumberSelect = document.getElementById("unit-number");
  const floorField = document.getElementById("floor");
  const ownerNameField = document.getElementById("owner-name");
  const tenantNameField = document.getElementById("tenant-name");

  fetch("/api/units") // Updated to use your new API endpoint
    .then((response) => response.json())
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

      unitNumberSelect.addEventListener("change", function () {
        const selectedUnit = this.value;
        if (unitData[selectedUnit]) {
          floorField.textContent = unitData[selectedUnit].floor;
          ownerNameField.textContent = unitData[selectedUnit].owner;
          tenantNameField.textContent = unitData[selectedUnit].tenant || "";
          document.getElementById("owner-phone").textContent = unitData[selectedUnit].ownerPhone;
          document.getElementById("tenant-phone").textContent = unitData[selectedUnit].tenantPhone || "";
          document.getElementById("last-payment-month").textContent = unitData[selectedUnit].lastPaymentMonth;
          document.getElementById("last-payment-date").textContent = unitData[selectedUnit].lastPaymentDate;
          document.getElementById("unit-details").style.display = "block";
        } else {
          document.getElementById("unit-details").style.display = "none";
        }
      });
    })
    .catch((error) => {
      console.error("Error loading unit data:", error);
    });
}

//Snippet 10: Save Data and Dynamic Input Handling

function saveData(data) {
  const pathname = window.location.pathname;
  let apiUrl;
  if (pathname === "/expense-input.html") {
    apiUrl = "/api/expense-input"; // Updated to use your new API endpoint
  } else if (pathname === "/revenue-input.html") {
    apiUrl = "/api/revenue-input"; // Updated to use your new API endpoint
  }
  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        alert("Data saved successfully!");
        document.getElementById("input-form").reset();
      } else {
        alert("Failed to save data.");
      }
    })
    .catch((error) => {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    });
}

//Snippet 11: Authentication and Authorization

function checkAuth() {
  fetch("/api/check-auth")
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated) {
        document.getElementById("authenticated-links").style.display = "block";
        document.getElementById("login-link").style.display = "none";
        document.getElementById("logout-link").style.display = "block";
      } else {
        document.getElementById("authenticated-links").style.display = "none";
        document.getElementById("login-link").style.display = "block";
        document.getElementById("logout-link").style.display = "none";
      }
    })
    .catch((error) => console.error("Error checking auth status:", error));
}

document.getElementById("login-button").addEventListener("click", () => {
  console.log("Login button clicked");
  const username = prompt("Enter username:");
  const password = prompt("Enter password:");
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        checkAuth();
      } else {
        alert("Login failed!");
      }
    })
    .catch(error => console.error("Error during login:", error));
});

document.getElementById("logout-button").addEventListener("click", () => {
  fetch("/logout", { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        checkAuth();
      }
    })
    .catch((error) => console.error("Error during logout:", error));
});

checkAuth(); // Check auth status on page load
