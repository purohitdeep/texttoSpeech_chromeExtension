// Audio element for playing TTS
let audioElement = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    // Respond to ping to confirm content script is loaded
    sendResponse({ pong: true });
    return true;
  }
  else if (message.action === "playAudio") {
    playAudio(message.audioContent);
  }
  else if (message.action === "showError") {
    showErrorMessage(message.message);
  }
  return true; // Important to return true for async response
});

// Function to play audio
function playAudio(audioContent) {
  try {
    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    
    // Create new audio element
    audioElement = new Audio(
      `data:audio/mp3;base64,${audioContent}`
    );
    
    audioElement.play().catch(error => {
      console.error("Error playing audio:", error);
      showErrorMessage("Could not play audio: " + error.message);
    });
  } catch (error) {
    console.error("Error setting up audio:", error);
    showErrorMessage("Error playing audio: " + error.message);
  }
}

// Function to show error message
function showErrorMessage(message) {
  // Create notification element
  let notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f8d7da;
    color: #721c24;
    padding: 12px 20px;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-width: 400px;
  `;
  notification.textContent = message;
  
  // Create close button
  let closeBtn = document.createElement("button");
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #721c24;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    position: absolute;
    top: 5px;
    right: 5px;
  `;
  closeBtn.textContent = "×";
  closeBtn.onclick = () => document.body.removeChild(notification);
  notification.appendChild(closeBtn);
  
  // Add to document and set timeout to remove
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}