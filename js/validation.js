// validation.js
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

// Function to show error messages to the user and log errors to console
function showError(message) {
  const errorElement = document.getElementById("feedback-error");
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

// Function to show success messages
function showSuccess(message) {
  const successElement = document.getElementById("feedback-success");
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = "block";
    setTimeout(() => {
      successElement.style.display = "none";
    }, 5000);
  } else {
    console.warn("Success element not found.");
  }
}

export { validateResponse, showError, showSuccess };
