//expense.js

// expense.js
import { showLoadingSpinner, hideLoadingSpinner } from "./spinner.js";
import { validateResponse, showError, showSuccess } from "./validation.js";

// Function to clear form inputs
function clearForm() {
  const form = document.getElementById("input-form");
  if (form) {
    form.reset();
    console.log("Form cleared.");
  } else {
    console.warn("Form element not found.");
  }
}

// Function to add a new expense
function addExpense(event) {
  event.preventDefault();
  const category = document.getElementById("category").value;
  const item = document.getElementById("item").value;
  const amount = document.getElementById("amount").value;
  const paymentDay = document.getElementById("payment-day").value;

  showLoadingSpinner();
  fetch("/api/expense-input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, item, amount, payment_date: paymentDay }),
  })
    .then(validateResponse)
    .then((data) => {
      console.log("Expense added:", data);
      hideLoadingSpinner();
      showSuccess("Expense added successfully.");
      clearForm();
      loadExpenses();
    })
    .catch((error) => {
      console.error("Error adding expense:", error);
      showError("Failed to add expense.");
      hideLoadingSpinner();
    });
}
// Function to load expenses and display them in the table
function loadExpenses() {
  console.log("Loading expenses...");
  showLoadingSpinner();
  fetch("/api/expenses")
    .then(validateResponse)
    .then((expenses) => {
      const expenseList = document.getElementById("expense-list");
      if (expenseList) {
        expenseList.innerHTML = expenses
          .map((expense) => {
            return `
              <tr>
                <td>${expense.category}</td>
                <td>${expense.item}</td>
                <td>${expense.price}</td>
                <td>${expense.expense_date}</td>
                <td>
                  <button class="btn-small" onclick="editExpense(${expense.expense_id})">Edit</button>
                  <button class="btn-small red" onclick="deleteExpense(${expense.expense_id})">Delete</button>
                </td>
              </tr>
            `;
          })
          .join("");
        console.log("Expenses loaded and displayed.");
      } else {
        console.error("Expense list container not found.");
      }
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error loading expenses:", error);
      showError("Failed to load expenses.");
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

export { clearForm, addExpense, loadExpenses, editExpense, deleteExpense };
