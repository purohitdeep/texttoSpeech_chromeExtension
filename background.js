// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakSelectedText",
    title: "Speak selected text",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakSelectedText") {
    handleTextToSpeech(info.selectionText, tab);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "speak-selected-text") {
    // Get selected text from current tab
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText
    }).then(results => {
      const selectedText = results[0].result;
      if (selectedText) {
        handleTextToSpeech(selectedText, tab);
      }
    }).catch(error => {
      console.error("Error executing script: " + error);
    });
  }
});

// Function to get selected text
function getSelectedText() {
  return window.getSelection().toString();
}

// Handle text to speech conversion
function handleTextToSpeech(text, tab) {
  if (!text || text.trim() === "") {
    return;
  }
  
  // Get API key and voice settings from storage
  chrome.storage.sync.get(
    { 
      apiKey: "", 
      language: "en-US", 
      voice: "en-US-Standard-B",
      pitch: 1.0,
      rate: 1.0
    },
    (settings) => {
      if (!settings.apiKey) {
        // Notify content script to show error message
        notifyContentScript(tab.id, {
          action: "showError",
          message: "API key is not set. Please set it in the options page."
        });
        return;
      }
      
      // Call Google Cloud TTS API
      callGoogleTTS(text, settings, tab.id);
    }
  );
}

// Function to call Google Cloud TTS API
function callGoogleTTS(text, settings, tabId) {
  const apiUrl = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + settings.apiKey;
  
  const requestData = {
    input: {
      text: text
    },
    voice: {
      languageCode: settings.language,
      name: settings.voice
    },
    audioConfig: {
      audioEncoding: "LINEAR16", //MP3
      //pitch: parseFloat(settings.pitch),
      speakingRate: parseFloat(settings.rate)
    }
  };
  
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // FIX: Check if tab still exists before sending message
    chrome.tabs.get(tabId, function(tab) {
      if (chrome.runtime.lastError) {
        console.error("Tab no longer exists.");
        return;
      }
      
      // Send audio content to content script
      chrome.tabs.sendMessage(tabId, {
        action: "playAudio",
        audioContent: data.audioContent
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to content script: ", chrome.runtime.lastError);
          // Try injecting the content script if it's not available
          injectContentScript(tabId, {
            action: "playAudio",
            audioContent: data.audioContent
          });
        }
      });
    });
  })
  .catch(error => {
    console.error("Error calling Google TTS API: ", error);
    
    // FIX: Check if tab still exists before sending error message
    chrome.tabs.get(tabId, function(tab) {
      if (chrome.runtime.lastError) {
        console.error("Tab no longer exists.");
        return;
      }
      
      notifyContentScript(tabId, {
        action: "showError",
        message: "Error calling Google TTS API: " + error.message
      });
    });
  });
}

// Helper function to notify content script safely
function notifyContentScript(tabId, message) {
  // FIX: First check if we can send a message to this tab
  chrome.tabs.sendMessage(tabId, { action: "ping" })
    .then(response => {
      if (response && response.pong) {
        // Content script is ready, send the actual message
        chrome.tabs.sendMessage(tabId, message);
      } else {
        console.error("Content script not ready or did not respond correctly");
        // Inject content script if it's not ready
        injectContentScript(tabId, message);
      }
    })
    .catch(error => {
      console.error("Error checking content script: ", error);
      // Inject content script if there was an error
      injectContentScript(tabId, message);
    });
}

// Function to inject content script if it's not already there
function injectContentScript(tabId, messageToSend) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content.js"]
  }).then(() => {
    // Wait a moment for the script to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, messageToSend)
        .catch(err => console.error("Failed to send message after injection: ", err));
    }, 100);
  }).catch(error => {
    console.error("Error injecting content script: ", error);
  });
}