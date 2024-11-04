// spinner.js

// Function to show a loading spinner during operations and log the event
function showLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = "block";
    console.log("Loading spinner displayed.");
  } else {
    console.warn("Loading spinner element not found.");
  }
}

// Function to hide the loading spinner and log the event
function hideLoadingSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = "none";
    console.log("Loading spinner hidden.");
  } else {
    console.warn("Loading spinner element not found.");
  }
}

export { showLoadingSpinner, hideLoadingSpinner };
