document.addEventListener("DOMContentLoaded", function () {
    // Open options page when options button is clicked
    document.getElementById("optionsBtn").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    
    // Test voice when test button is clicked
    document.getElementById("testBtn").addEventListener("click", () => {
      const testText = "This is a test of the text to speech feature.";
      
      // Get current tab
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
          console.error("No active tab found");
          return;
        }
        
        const activeTab = tabs[0];
        // Call background script to handle text to speech
        chrome.runtime.sendMessage({
          action: "testVoice",
          text: testText,
          tabId: activeTab.id
        });
      });
    });
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "testComplete") {
      // Test is complete, could show a notification if needed
    }
    return true;
  });