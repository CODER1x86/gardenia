//profile.js

// profile.js
import { showLoadingSpinner, hideLoadingSpinner } from "./spinner.js";
import { validateResponse, showError, showSuccess } from "./validation.js";

// Function to fetch user profile details
function fetchProfile() {
  console.log("Fetching profile details...");
  showLoadingSpinner();
  fetch("/api/profile")
    .then(validateResponse)
    .then((data) => {
      document.getElementById("first_name").value = data.first_name;
      document.getElementById("last_name").value = data.last_name;
      document.getElementById("birthdate").value = data.birthdate;
      document.getElementById("email").value = data.email;
      console.log("Profile details fetched successfully:", data);
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error loading profile data:", error);
      showError("Failed to load profile details.");
      hideLoadingSpinner();
    });
}
// Function to update user profile details
function updateProfile(event) {
  event.preventDefault();
  const first_name = document.getElementById("first_name").value;
  const last_name = document.getElementById("last_name").value;
  const birthdate = document.getElementById("birthdate").value;
  const email = document.getElementById("email").value;

  console.log("Updating profile details...", {
    first_name,
    last_name,
    birthdate,
    email,
  });
  showLoadingSpinner();
  fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name, last_name, birthdate, email }),
  })
    .then(validateResponse)
    .then((data) => {
      showSuccess("Profile updated successfully.");
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      showError("Failed to update profile.");
      hideLoadingSpinner();
    });
}

export { fetchProfile, updateProfile };
