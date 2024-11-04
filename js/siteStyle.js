// siteStyle.js

// Function to initialize site style color
function initializeSiteStyle() {
  const storedColor = localStorage.getItem("primaryColor") || "#1a73e8";
  const colorElement = document.getElementById("color");
  if (colorElement) {
    colorElement.value = storedColor;
    updateColor();
  } else {
    console.warn("Color element not found.");
  }
}

// Function to update site style color
function updateColor() {
  const color = document.getElementById("color").value;
  document.documentElement.style.setProperty("--primary-color", color);
  localStorage.setItem("primaryColor", color);
}

export { initializeSiteStyle, updateColor };
