document.addEventListener("DOMContentLoaded", function () {
  // Open options page when options button is clicked
  document.getElementById("optionsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
