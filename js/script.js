const pages = document.querySelectorAll("[data-page]");
const pageLinks = document.querySelectorAll("[data-page-link]");
const navLinks = document.querySelectorAll(".nav-links a");
const menuToggle = document.querySelector(".menu-toggle");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const chatForm = document.querySelector("#chatForm");
const chatWindow = document.querySelector("#chatWindow");
const chatText = document.querySelector("#chatText");
const eta = document.querySelector("#eta");
const shareLive = document.querySelector("#shareLive");
const shareStatus = document.querySelector("#shareStatus");
const sosButton = document.querySelector("#sosButton");
const timer = document.querySelector("#timer");
const startRecord = document.querySelector("#startRecord");
const stopRecord = document.querySelector("#stopRecord");
const pickupInput = document.querySelector("#pickupInput");
const dropInput = document.querySelector("#dropInput");
const currentLocationBtn = document.querySelector("#currentLocationBtn");
const locationStatus = document.querySelector("#locationStatus");
const fareEstimate = document.querySelector("#fareEstimate");
const distanceEstimate = document.querySelector("#distanceEstimate");
const timeEstimate = document.querySelector("#timeEstimate");
const bookingMap = document.querySelector("#bookingMap");
const payNowBtn = document.querySelector("#payNowBtn");
const paymentSuccess = document.querySelector("#paymentSuccess");
const trackingMap = document.querySelector("#trackingMap");
const trackingDestination = document.querySelector("#trackingDestination");
const paymentFare = document.querySelector("#paymentFare");
const shareRideBtn = document.querySelector("#shareRideBtn");
const shareRideStatus = document.querySelector("#shareRideStatus");
const voiceMicBtn = document.querySelector("#voiceMicBtn");
const voiceStatus = document.querySelector("#voiceStatus");
const voiceTranscript = document.querySelector("#voiceTranscript");
const voiceDestination = document.querySelector("#voiceDestination");
const voiceConfirmBtn = document.querySelector("#voiceConfirmBtn");
const voiceChips = document.querySelectorAll(".voice-chip");
const paymentRadios = document.querySelectorAll('input[name="pay"]');
const paymentPanels = {
  upi: document.querySelector("#upiPanel"),
  card: document.querySelector("#cardPanel"),
  wallet: document.querySelector("#walletPanel"),
  cash: document.querySelector("#cashPanel")
};
const userMenu = document.querySelector("#userMenu");
const userChip = document.querySelector("#userChip");
const logoutBtn = document.querySelector("#logoutBtn");
const dashboardUserName = document.querySelector("#dashboardUserName");
const chatGreeting = document.querySelector("#chatGreeting");
const deviationPopup = document.querySelector("#deviationPopup");
const dismissDeviation = document.querySelector("#dismissDeviation");

let recordInterval = null;
let recordSeconds = 0;
let etaMinutes = 5;
let pickupCoords = { lat: 22.7196, lng: 75.8577 };
let currentFareText = "Rs 250";
let detectedVoiceDestination = "";
let deviationTimer = null;

function setUserName(name) {
  const cleanName = name.trim();
  if (!cleanName) return;

  localStorage.setItem("safeCabUserName", cleanName);
  userChip.textContent = cleanName;
  userMenu.classList.add("active");
  userChip.classList.add("active");
  dashboardUserName.textContent = cleanName;
  chatGreeting.innerHTML = `<span class="bot-avatar">AI</span>Hello ${cleanName}! How can I help you today?`;
}

function clearUserName() {
  localStorage.removeItem("safeCabUserName");
  userChip.textContent = "Guest";
  userMenu.classList.remove("active", "open");
  userChip.classList.remove("active");
  dashboardUserName.textContent = "Pooja";
  chatGreeting.innerHTML = `<span class="bot-avatar">AI</span>Hello! How can I help you today?`;
}

function nameFromEmail(email) {
  const localPart = email.split("@")[0] || "User";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const knownLocations = [
  { keys: ["indore"], lat: 22.7196, lng: 75.8577 },
  { keys: ["devi ahilya", "airport indore"], lat: 22.7271, lng: 75.8011 },
  { keys: ["mumbai", "bombay"], lat: 19.0760, lng: 72.8777 },
  { keys: ["delhi"], lat: 28.6139, lng: 77.2090 },
  { keys: ["bhopal"], lat: 23.2599, lng: 77.4126 },
  { keys: ["pune"], lat: 18.5204, lng: 73.8567 },
  { keys: ["bangalore", "bengaluru"], lat: 12.9716, lng: 77.5946 },
  { keys: ["hyderabad"], lat: 17.3850, lng: 78.4867 },
  { keys: ["ahmedabad"], lat: 23.0225, lng: 72.5714 },
  { keys: ["jaipur"], lat: 26.9124, lng: 75.7873 }
];

function openPage(pageName) {
  const selected = document.querySelector(`[data-page="${pageName}"]`);
  if (!selected) return;

  pages.forEach((page) => page.classList.toggle("active", page === selected));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.pageLink === pageName));
  document.body.classList.remove("menu-open");
  userMenu.classList.remove("open");
  clearTimeout(deviationTimer);
  deviationPopup.classList.remove("show");
  if (pageName === "dashboard") {
    deviationTimer = setTimeout(() => deviationPopup.classList.add("show"), 1600);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${pageName}`);
}

function findCoords(place) {
  const normalized = place.toLowerCase();
  const match = knownLocations.find((location) => location.keys.some((key) => normalized.includes(key)));
  return match ? { lat: match.lat, lng: match.lng } : null;
}

function distanceKm(from, to) {
  const earthRadius = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateGoogleMap() {
  const pickup = encodeURIComponent(pickupInput.value.trim() || "Current Location");
  const drop = encodeURIComponent(dropInput.value.trim() || "Devi Ahilya Bai Airport, Indore");
  bookingMap.src = `https://www.google.com/maps?output=embed&saddr=${pickup}&daddr=${drop}`;
  trackingMap.src = `https://www.google.com/maps?output=embed&saddr=${pickup}&daddr=${drop}`;
  trackingDestination.textContent = dropInput.value.trim() || "Selected destination";
}

function updateFare() {
  const dropCoords = findCoords(dropInput.value.trim());
  let km = 12.4;

  if (pickupCoords && dropCoords) {
    km = distanceKm(pickupCoords, dropCoords);
  } else if (dropInput.value.trim().length > 2) {
    km = Math.max(4.5, Math.min(28, dropInput.value.trim().length * 1.35));
  }

  const minutes = Math.max(12, Math.round(km * 2.1));
  const fare = Math.round(55 + km * 15 + minutes * 2);

  currentFareText = `Rs ${fare}`;
  fareEstimate.textContent = currentFareText;
  paymentFare.textContent = currentFareText;
  distanceEstimate.textContent = `${km.toFixed(1)} km`;
  timeEstimate.textContent = `${minutes} mins`;
  etaMinutes = Math.max(1, Math.min(10, Math.round(minutes / 5)));
  eta.textContent = `${etaMinutes} mins`;
  updateGoogleMap();
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openPage(link.dataset.pageLink);
  });
});

menuToggle.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

userChip.addEventListener("click", () => {
  userMenu.classList.toggle("open");
});

logoutBtn.addEventListener("click", () => {
  clearUserName();
  openPage("login");
});

dismissDeviation.addEventListener("click", () => {
  deviationPopup.classList.remove("show");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#userMenu")) {
    userMenu.classList.remove("open");
  }
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.toggle}`);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  });
});

function showPaymentPanel(method) {
  Object.entries(paymentPanels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === method);
  });
}

paymentRadios.forEach((radio) => {
  radio.addEventListener("change", () => showPaymentPanel(radio.value));
});

function setError(inputId, message) {
  const error = document.querySelector(`[data-error-for="${inputId}"]`);
  if (error) error.textContent = message;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const mobile = document.querySelector("#loginMobile");
  let valid = true;

  setError("loginMobile", "");

  if (!/^[+\d\s-]{10,16}$/.test(mobile.value.trim())) {
    setError("loginMobile", "Please enter a valid mobile number.");
    valid = false;
  }

  if (valid) {
    const digits = mobile.value.replace(/\D/g, "");
    setUserName(`User ${digits.slice(-4)}`);
    document.querySelector("#loginSuccess").textContent = "Login successful. Opening dashboard...";
    setTimeout(() => openPage("dashboard"), 700);
  }
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fullName = document.querySelector("#fullName");
  const email = document.querySelector("#signupEmail");
  const phone = document.querySelector("#phone");
  const password = document.querySelector("#signupPassword");
  const confirmPassword = document.querySelector("#confirmPassword");
  let valid = true;

  ["fullName", "signupEmail", "phone", "signupPassword", "confirmPassword"].forEach((id) => setError(id, ""));

  if (fullName.value.trim().length < 3) {
    setError("fullName", "Please enter your full name.");
    valid = false;
  }

  if (!validateEmail(email.value.trim())) {
    setError("signupEmail", "Please enter a valid email address.");
    valid = false;
  }

  if (!/^[+\d\s-]{10,16}$/.test(phone.value.trim())) {
    setError("phone", "Please enter a valid phone number.");
    valid = false;
  }

  if (password.value.length < 6) {
    setError("signupPassword", "Password must be at least 6 characters.");
    valid = false;
  }

  if (password.value !== confirmPassword.value) {
    setError("confirmPassword", "Passwords do not match.");
    valid = false;
  }

  if (valid) {
    setUserName(fullName.value);
    document.querySelector("#signupSuccess").textContent = `Account created successfully. Welcome, ${fullName.value.trim()}!`;
    setTimeout(() => openPage("dashboard"), 900);
  }
});

function addChatMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getBotReply(message) {
  const text = message.toLowerCase();
  if (text.includes("share") || text.includes("location")) return "Use Share Ride to select contacts and send your live route instantly.";
  if (text.includes("book") || text.includes("cab")) return "Go to Book Cab, confirm pickup and drop, then tap Book Now.";
  if (text.includes("sos") || text.includes("emergency")) return "Press the SOS button to alert contacts and Police Control Room 100.";
  if (text.includes("driver") || text.includes("safe")) return "The current driver has a 92% AI safety score and a 4.8 rating.";
  if (text.includes("pay") || text.includes("upi")) return "You can pay using UPI, card, wallet, or cash on the Payment page.";
  return "I can help with booking, live tracking, SOS, sharing your ride, payment, and women driver preference.";
}

function parseVoiceDestination(command) {
  const cleaned = command.trim().replace(/[.?!]/g, "");
  const patterns = [
    /(?:to|for|towards)\s+(.+)$/i,
    /(?:airport|mumbai|bhopal|delhi|pune|bangalore|bengaluru|hyderabad|ahmedabad|jaipur)/i
  ];
  const phraseMatch = cleaned.match(patterns[0]);

  if (phraseMatch && phraseMatch[1]) {
    return phraseMatch[1].replace(/^the\s+/i, "").trim();
  }

  const keywordMatch = cleaned.match(patterns[1]);
  if (!keywordMatch) return "";

  const keyword = keywordMatch[0].toLowerCase();
  if (keyword === "airport") return "Devi Ahilya Bai Airport, Indore";
  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

function applyVoiceCommand(command) {
  const destination = parseVoiceDestination(command);
  voiceTranscript.textContent = command;

  if (!destination) {
    voiceStatus.textContent = "Destination not detected";
    voiceDestination.textContent = "Try: Book cab to Airport";
    detectedVoiceDestination = "";
    return;
  }

  detectedVoiceDestination = destination;
  voiceStatus.textContent = "AI command understood";
  voiceDestination.textContent = destination;
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatText.value.trim();
  if (!message) return;

  addChatMessage(message, "user");
  chatText.value = "";
  setTimeout(() => addChatMessage(getBotReply(message), "bot"), 400);
});

setInterval(() => {
  etaMinutes = etaMinutes <= 1 ? 5 : etaMinutes - 1;
  eta.textContent = `${etaMinutes} mins`;
}, 4500);

shareLive.addEventListener("click", () => {
  shareStatus.textContent = "Live location shared with Dad and Best Friend.";
});

function getSelectedContacts() {
  return Array.from(document.querySelectorAll(".contacts label"))
    .filter((label) => label.querySelector("input").checked)
    .map((label) => ({
      name: label.querySelector("b").textContent.trim(),
      phone: label.querySelector("small").textContent.trim()
    }));
}

function notifyShare(message) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("SafeCab live location shared", { body: message });
    return;
  }

  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("SafeCab live location shared", { body: message });
      }
    });
  }
}

shareRideBtn.addEventListener("click", async () => {
  const selectedContacts = getSelectedContacts();

  if (!selectedContacts.length) {
    shareRideStatus.textContent = "Please select at least one trusted contact.";
    return;
  }

  const liveLink = `${location.origin}${location.pathname}#tracking`;
  const contactNames = selectedContacts.map((contact) => contact.name).join(", ");
  const shareText = `SafeCab live ride tracking link shared with ${contactNames}: ${liveLink}`;

  shareRideStatus.textContent = `Live link shared with ${contactNames}. Closing share page...`;
  notifyShare(shareText);

  if (navigator.share) {
    try {
      await navigator.share({
        title: "SafeCab Live Ride Tracking",
        text: shareText,
        url: liveLink
      });
    } catch {
      // User cancelled native share sheet; in-app sharing status still remains visible.
    }
  }

  setTimeout(() => {
    shareRideStatus.textContent = "";
    openPage("dashboard");
  }, 1000);
});

sosButton.addEventListener("click", () => {
  sosButton.textContent = "SENT";
  sosButton.classList.add("sent");
});

function updateTimer() {
  const minutes = String(Math.floor(recordSeconds / 60)).padStart(2, "0");
  const seconds = String(recordSeconds % 60).padStart(2, "0");
  timer.textContent = `${minutes}:${seconds}`;
}

startRecord.addEventListener("click", () => {
  if (recordInterval) return;
  recordInterval = setInterval(() => {
    recordSeconds += 1;
    updateTimer();
  }, 1000);
});

stopRecord.addEventListener("click", () => {
  clearInterval(recordInterval);
  recordInterval = null;
});

payNowBtn.addEventListener("click", () => {
  paymentSuccess.textContent = "Payment successful. Closing payment page...";
  payNowBtn.disabled = true;
  payNowBtn.textContent = "Paid";

  setTimeout(() => {
    paymentSuccess.textContent = "";
    payNowBtn.disabled = false;
    payNowBtn.textContent = "Pay Now";
    openPage("dashboard");
  }, 900);
});

voiceChips.forEach((chip) => {
  chip.addEventListener("click", () => applyVoiceCommand(chip.dataset.command));
});

voiceConfirmBtn.addEventListener("click", () => {
  if (!detectedVoiceDestination) {
    applyVoiceCommand("Book cab to Airport");
  }

  dropInput.value = detectedVoiceDestination || "Devi Ahilya Bai Airport, Indore";
  updateFare();
  voiceStatus.textContent = "Opening booking page...";

  setTimeout(() => openPage("booking"), 500);
});

voiceMicBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    applyVoiceCommand("Book cab to Airport");
    voiceStatus.textContent = "Demo command used";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceMicBtn.classList.add("listening");
  voiceStatus.textContent = "Listening...";
  voiceTranscript.textContent = "Speak now...";

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript;
    applyVoiceCommand(command);
  };

  recognition.onerror = () => {
    voiceStatus.textContent = "Voice not captured";
    voiceTranscript.textContent = "Mic permission allow karo ya sample command use karo.";
  };

  recognition.onend = () => {
    voiceMicBtn.classList.remove("listening");
  };

  recognition.start();
});

dropInput.addEventListener("input", updateFare);
pickupInput.addEventListener("input", () => {
  pickupCoords = findCoords(pickupInput.value.trim()) || pickupCoords;
  updateFare();
});

currentLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Is browser me automatic location supported nahi hai.";
    locationStatus.className = "location-status error";
    return;
  }

  locationStatus.textContent = "Location permission ka wait ho raha hai...";
  locationStatus.className = "location-status";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      pickupCoords = { lat: latitude, lng: longitude };
      pickupInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      locationStatus.textContent = "Current location pickup me set ho gayi. Address name ke liye reverse geocoding API chahiye.";
      locationStatus.className = "location-status success";
      updateFare();
    },
    () => {
      locationStatus.textContent = "Location permission deny hui. Browser/site settings me location allow karo.";
      locationStatus.className = "location-status error";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

const initialPage = location.hash.replace("#", "") || "splash";
const savedUserName = localStorage.getItem("safeCabUserName");
if (savedUserName) {
  setUserName(savedUserName);
}
openPage(initialPage);
updateFare();
showPaymentPanel(document.querySelector('input[name="pay"]:checked').value);
