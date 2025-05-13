// background.js

// 1️⃣ When the extension is installed, add a “Speak selected text” item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakSelectedText",
    title: "Speak selected text",
    contexts: ["selection"]
  });
});

// 2️⃣ Handle context‐menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakSelectedText") {
    speakText(info.selectionText, tab.id);
  }
});

// 3️⃣ Handle keyboard shortcut (Alt+T)
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "speak-selected-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    }).then(([{ result }]) => {
      speakText(result, tab.id);
    }).catch(err => {
      console.error("Failed to get selection:", err);
      chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        message: "Could not retrieve selected text."
      });
    });
  }
});

// 4️⃣ Main entry: validate & fetch TTS
function speakText(text, tabId) {
  if (!text?.trim()) return;

  chrome.storage.sync.get({
    apiKey: "",
    language: "en-US",
    voice: "en-US-Standard-B",
    pitch: 1.0,
    rate: 1.0
  }, opts => {
    if (!opts.apiKey) {
      chrome.tabs.sendMessage(tabId, {
        action: "showError",
        message: "API key missing—set it in options."
      });
      return;
    }

    fetchTTS(text, opts)
      .then(audioContent => {
        chrome.tabs.sendMessage(tabId, {
          action: "playAudio",
          audioContent
        });
      })
      .catch(err => {
        console.error("TTS error:", err);
        chrome.tabs.sendMessage(tabId, {
          action: "showError",
          message: "TTS API error: " + err.message
        });
      });
  });
}

// 5️⃣ Call Google Cloud TTS and return a Promise of base64‐audio
function fetchTTS(text, { apiKey, language, voice, pitch, rate }) {
  // Using string concatenation instead of template literals
  const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + encodeURIComponent(apiKey);
  
  const body = {
    input: { text },
    voice: { languageCode: language, name: voice },
    audioConfig: {
      audioEncoding: "MP3", // Using MP3 as we discussed before
      speakingRate: +rate
    }
  };

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  .then(async res => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || `HTTP \${res.status}`);
    }
    if (!data.audioContent) {
      throw new Error("No audio returned");
    }
    return data.audioContent;
  });
}
