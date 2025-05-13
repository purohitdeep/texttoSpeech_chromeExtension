// content.js

let audioEl = null;

// 1️⃣ Listen for messages from background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "ping") {
    sendResponse({ pong: true });
    return true;
  }
  if (msg.action === "playAudio") {
    playAudio(msg.audioContent);
    return true;
  }
  if (msg.action === "showError") {
    showError(msg.message);
    return true;
  }
  // otherwise ignore
  return false;
});

// 2️⃣ Your existing playAudio (decoded to Ogg/Opus)
async function playAudio(base64) {
  // tear down any old audio
  if (audioEl) {
    audioEl.pause();
    URL.revokeObjectURL(audioEl.src);
    audioEl.remove();
    audioEl = null;
  }

  // build a Blob from the WAV base64 that Google gives us
  const bin = atob(base64.replace(/\s+/g, ""));
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buf[i] = bin.charCodeAt(i);
  }
  const blob = new Blob([buf.buffer], { type: "audio/mp3" });
  const url  = URL.createObjectURL(blob);

  // play it
  audioEl = new Audio(url);
  audioEl.onerror = () => {
    console.error("[content] audio error:", audioEl.error);
    showError("Playback error: " + (audioEl.error?.message || "unknown"));
    URL.revokeObjectURL(url);
  };
  audioEl.onended = () => URL.revokeObjectURL(url);

  try {
    await audioEl.play();
  } catch (err) {
    console.error("[content] play() failed:", err);
    showError("Could not play audio: " + err.message);
    URL.revokeObjectURL(url);
  }
}

// Helper to write ASCII strings into DataView
function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// 3️⃣ A simple in-page error banner
function showError(message) {
  const n = document.createElement("div");
  Object.assign(n.style, {
    position: "fixed", top: "20px", right: "20px",
    background: "#f8d7da", color: "#721c24",
    padding: "12px 20px", border: "1px solid #f5c6cb",
    borderRadius: "4px", zIndex: 10000, maxWidth: "300px",
    fontFamily: "sans-serif"
  });
  n.textContent = message;
  const btn = document.createElement("button");
  Object.assign(btn.style, {
    position: "absolute", top: "4px", right: "8px",
    background: "none", border: "none",
    color: "#721c24", fontSize: "16px", cursor: "pointer"
  });
  btn.textContent = "×";
  btn.onclick = () => n.remove();
  n.appendChild(btn);
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 5000);
}