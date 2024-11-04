//headerFooter.js

// headerFooter.js
function loadHeaderFooter() {
  loadTemplate("header-placeholder", "header.html");
  loadTemplate("footer-placeholder", "footer.html");
}

// Function to dynamically load HTML templates into a specified container
function loadTemplate(containerId, templatePath) {
  console.log(`Loading template from ${templatePath} into container ${containerId}`);
  showLoadingSpinner();
  fetch(templatePath)
    .then(response => response.text())
    .then((htmlContent) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = htmlContent;
        console.log(`Template loaded successfully into ${containerId}`);
      } else {
        console.error(`Container with ID ${containerId} not found.`);
      }
      hideLoadingSpinner();
    })
    .catch((error) => {
      console.error("Error loading template:", error);
      showError("Failed to load content.");
      hideLoadingSpinner();
    });
}

export { loadHeaderFooter, loadTemplate };
