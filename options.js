// Available voices for each language
const voiceOptions = {
  "en-US": [
    { name: "en-US-Chirp3-HD-Leda", gender: "Female" }
  ],
  "en-GB": [
    { name: "en-GB-Chirp3-HD-Algieba", gender: "Male" }
  ],
  "sv-SE": [
    { name: "sv-SE-Standard-A", gender: "Female" },
    { name: "sv-SE-Wavenet-A", gender: "Female" },
    { name: "sv-SE-Wavenet-B", gender: "Female" },
    { name: "sv-SE-Wavenet-C", gender: "Male" }
  ]
};

// Function to populate voice dropdown based on selected language
function populateVoices(language) {
  const voiceSelect = document.getElementById("voice");
  voiceSelect.innerHTML = "";
  
  const voices = voiceOptions[language] || [];
  voices.forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.gender})`;
    voiceSelect.appendChild(option);
  });
}

// Load saved options when page loads
document.addEventListener("DOMContentLoaded", () => {
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
      
      // Populate voices for the saved language
      populateVoices(items.language);
      
      // Set the saved voice if it exists for this language
      const voiceSelect = document.getElementById("voice");
      if (Array.from(voiceSelect.options).some(option => option.value === items.voice)) {
        voiceSelect.value = items.voice;
      }
    }
  );
  
  // Add event listener for language selection change
  document.getElementById("language").addEventListener("change", function() {
    populateVoices(this.value);
  });
  
  // Add event listeners for range inputs
  document.getElementById("pitch").addEventListener("input", function() {
    document.getElementById("pitchValue").textContent = this.value;
  });
  
  document.getElementById("rate").addEventListener("input", function() {
    document.getElementById("rateValue").textContent = this.value;
  });
  
  // Add event listener for save button
  document.getElementById("save").addEventListener("click", saveOptions);
});

// Save options to Chrome storage
function saveOptions() {
  const apiKey = document.getElementById("apiKey").value;
  const language = document.getElementById("language").value;
  const voice = document.getElementById("voice").value;
  const pitch = document.getElementById("pitch").value;
  const rate = document.getElementById("rate").value;
  
  // Show status as saving
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
      // Check if there was an error
      if (chrome.runtime.lastError) {
        status.textContent = "Error saving options: " + chrome.runtime.lastError.message;
        status.className = "status error";
        return;
      }
      
      // Update status to show success
      status.textContent = "Options saved!";
      status.className = "status success";
      
      // Hide status after a short delay
      setTimeout(() => {
        status.style.display = "none";
      }, 3000);
    }
  );
}