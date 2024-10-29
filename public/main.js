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
// Functions to handle filter changes and fetch data based on selected filters (year, month, unit).
function handleFilterChange() {
  const filter = document.querySelector('input[name="filter-option"]:checked').value;
  document.getElementById("year-select-container").style.display =
    filter === "year" || filter === "month" ? "block" : "none";
  document.getElementById("month-select-container").style.display =
    filter === "month" ? "block" : "none";
  document.getElementById("category-select-container").style.display =
    filter === "category" ? "block" : "none";

  if (filter === "category") {
    setInitialCategoryOptions(); // Ensure categories are fetched when category filter is selected
  } else if (filter === "unit") {
    populateUnitOptions();
  }

  document.getElementById("unit-select-container").style.display =
    filter === "unit" ? "block" : "none";
}

document.querySelectorAll('input[name="filter-option"]').forEach((elem) => {
  elem.addEventListener("change", handleFilterChange);
});

function setInitialYearOptions() {
  fetch("/api/years")
    .then((response) => response.json())
    .then((data) => {
      console.log("Years fetched from API:", data);
      const yearSelect = document.getElementById("year-select");
      if (yearSelect) {
        yearSelect.innerHTML = ""; // Clear existing options
        data.forEach((year) => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
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
      console.log("Months fetched from API:", data);
      const monthSelect = document.getElementById("month-select");
      if (monthSelect) {
        monthSelect.innerHTML = ""; // Clear existing options
        data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item;
          option.textContent = new Date(2024, item - 1).toLocaleString(
            "default",
            { month: "long" }
          ); // Convert month number to month name
          monthSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching months:", error));
}

// Add function to set initial category options
function setInitialCategoryOptions() {
  fetch("/api/categories")
    .then((response) => response.json())
    .then((data) => {
      const categorySelect = document.getElementById("category-select");
      if (categorySelect) {
        categorySelect.innerHTML = ""; // Clear existing options
        data.forEach((category) => {
          const option = document.createElement("option");
          option.value = category;
          option.textContent = category;
          categorySelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error fetching categories:", error));
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
