let voiceOptions = {};

function loadVoiceConfig() {
  return fetch(chrome.runtime.getURL('voices.json'))
    .then(response => response.json())
    .then(data => {
      voiceOptions = data;
      return voiceOptions;
    })
    .catch(error => {
      console.error('Error loading voice configuration:', error);
      return {};
    });
}

function populateVoices(language) {
  const voiceSelect = document.getElementById("voice");
  voiceSelect.innerHTML = "";
  
  const voices = voiceOptions[language] || [];
  voices.forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = voice.name + " (" + voice.gender + ")";
    voiceSelect.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadVoiceConfig().then(() => {
    chrome.storage.sync.get(
      { 
        apiKey: "", 
        language: "en-US", 
        voice: "en-US-Standard-B",
        pitch: 1.0,
        rate: 1.0
      },
      (items) => {
        document.getElementById("apiKey").value = items.apiKey;
        document.getElementById("language").value = items.language;
        document.getElementById("pitch").value = items.pitch;
        document.getElementById("pitchValue").textContent = items.pitch;
        document.getElementById("rate").value = items.rate;
        document.getElementById("rateValue").textContent = items.rate;

        populateVoices(items.language);
        
        const voiceSelect = document.getElementById("voice");
        if (Array.from(voiceSelect.options).some(option => option.value === items.voice)) {
          voiceSelect.value = items.voice;
        }
      }
    );
  });
  
  document.getElementById("language").addEventListener("change", function() {
    populateVoices(this.value);
  });

  document.getElementById("pitch").addEventListener("input", function() {
    document.getElementById("pitchValue").textContent = this.value;
  });
  
  document.getElementById("rate").addEventListener("input", function() {
    document.getElementById("rateValue").textContent = this.value;
  });
  
  document.getElementById("save").addEventListener("click", saveOptions);
});

function saveOptions() {
  const apiKey = document.getElementById("apiKey").value;
  const language = document.getElementById("language").value;
  const voice = document.getElementById("voice").value;
  const pitch = document.getElementById("pitch").value;
  const rate = document.getElementById("rate").value;
  
  const status = document.getElementById("status");
  status.textContent = "Saving...";
  status.style.display = "block";
  status.className = "status";
  
  chrome.storage.sync.set(
    {
      apiKey: apiKey,
      language: language,
      voice: voice,
      pitch: pitch,
      rate: rate
    },
    () => {
      if (chrome.runtime.lastError) {
        status.textContent = "Error saving options: " + chrome.runtime.lastError.message;
        status.className = "status error";
        return;
      }

      status.textContent = "Options saved!";
      status.className = "status success";
      
      setTimeout(() => {
        status.style.display = "none";
      }, 3000);
    }
  );
}