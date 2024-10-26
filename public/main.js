document.addEventListener("DOMContentLoaded", function () {
  loadHeaderFooter(); // Load common header and footer
  const currentYear = new Date().getFullYear();
  document.getElementById("currentyear").textContent = currentYear;
  fetchData(); // Fetch data from Node.js server
});

function fetchData() {
  fetch("/api/data") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      // Process and display the data on the page
      console.log(data);
      // Example: Populate budget summary
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

function loadHeaderFooter() {
  fetch("header.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("header-placeholder").innerHTML = html;
    });
  fetch("footer.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("footer-placeholder").innerHTML = html;
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
  fetch("/api/data") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      // Opening balance of 2024
      let totalRevenue = 12362;
      let totalExpenses = 0;
      data.values.forEach((row) => {
        const totalPaid = parseFloat(row[row.length - 3]); // Assuming 'Total Paid' is the third last column
        if (!isNaN(totalPaid)) totalRevenue += totalPaid;
      });
      const availableBalance = totalRevenue - totalExpenses;
      // Display the calculated totals
      document.getElementById("available-balance").textContent = availableBalance.toFixed(2);
      document.getElementById("total-revenue").textContent = totalRevenue.toFixed(2);
      document.getElementById("total-expenses").textContent = totalExpenses.toFixed(2);
    })
    .catch((error) => {
      console.error("Error loading budget summary:", error);
    });
}

function loadExpenseReport() {
  fetch("/api/expenses") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      // Calculate total expenses
      let totalExpenses = 0;
      const tableBody = document.getElementById("expense-table-body");
      data.values.forEach((row) => {
        const rowElement = document.createElement("tr");
        row.forEach((cell, index) => {
          const cellElement = document.createElement("td");
          cellElement.textContent = cell;
          rowElement.appendChild(cellElement);
          if (index === 2) {
            // Assuming 'Price' is the third column (index 2)
            const price = parseFloat(cell);
            if (!isNaN(price)) totalExpenses += price;
          }
        });
        tableBody.appendChild(rowElement);
      });
      // Display the total expenses
      document.getElementById("total-expenses").textContent = totalExpenses.toFixed(2);
    })
    .catch((error) => {
      console.error("Error loading expense report:", error);
    });
}
function loadRevenueReport() {
  fetch("/api/revenue") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("report-table-body");
      data.forEach((row) => { // Adjusted to match expected data structure
        const rowElement = document.createElement("tr");
        Object.values(row).forEach((cell) => { // Ensure correct iteration over row values
          const cellElement = document.createElement("td");
          cellElement.textContent = cell;
          rowElement.appendChild(cellElement);
        });
        tableBody.appendChild(rowElement);
      });
    })
    .catch((error) => {
      console.error("Error loading revenue report:", error);
    });
}

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
          lastPaymentDate: unit.lastPaymentDate
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
function loadCategories() {
  fetch("/api/categories") // Updated to use your new API endpoint
    .then((response) => response.json())
    .then((data) => {
      const categorySelect = document.getElementById("category");
      data.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error loading categories:", error);
    });
}

function saveData(data) {
  const pathname = window.location.pathname;
  let apiUrl;
  if (pathname === "/expense-input.html") {
    apiUrl = "/api/expenses"; // Updated to use your new API endpoint
  } else if (pathname === "/revenue-input.html") {
    apiUrl = "/api/revenue"; // Updated to use your new API endpoint
  }

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        alert("Data saved successfully!");
        document.getElementById("input-form").reset();
        document.getElementById("add-new-revenue").style.display = "block";
        document.getElementById("add-new-expense").style.display = "block";
      } else {
        alert("Failed to save data.");
      }
    })
    .catch((error) => {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    });
}

document.getElementById("add-new-revenue").addEventListener("click", function () {
  document.getElementById("input-form").reset();
  this.style.display = "none";
});

document.getElementById("add-new-expense").addEventListener("click", function () {
  document.getElementById("input-form").reset();
  this.style.display = "none";
});

function setupAuthListener() {
  // Logic for handling login state can be removed if not using Google Auth on the client side
}

function validateForm() {
  const inputFields = document.querySelectorAll('input[type="number"]');
  let isValid = true;

  inputFields.forEach(input => {
    if (input.value === "" || isNaN(input.value)) {
      input.style.border = '2px solid red';
      alert("Please enter valid numbers in all fields");
      isValid = false;
    } else {
      input.style.border = 'none';
    }
  });

  return isValid;
}

// Example: Call this function before form submission
document.querySelector('form').onsubmit = (e) => {
  if (!validateForm()) {
    e.preventDefault();
  }
};
