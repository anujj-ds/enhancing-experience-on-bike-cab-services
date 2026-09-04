/* =====================================================================
   RideEase — frontend logic
   Wires up: map + geolocation, OSRM road routing, fare estimate (backend),
   booking -> tracking flow, simulated vehicle + route-deviation alert,
   Gemini-powered chat translation, and the intentionally-stubbed
   SOS / nav placeholders.
   ===================================================================== */

(() => {
  "use strict";

  // ---------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------
  const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru fallback
  const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
  const DEVIATION_DELAY_MS = 9000;

  const PRESET_REPLIES = {
    kn: ["ನಾನು ದಾರಿಯಲ್ಲಿದ್ದೇನೆ, 2 ನಿಮಿಷ.", "ಸ್ವಲ್ಪ ಟ್ರಾಫಿಕ್ ಇದೆ, ಬರುತ್ತಿದ್ದೇನೆ.", "ನಾನು ಇಲ್ಲಿದ್ದೇನೆ."],
    hi: ["मैं रास्ते में हूँ, 2 मिनट।", "थोड़ा ट्रैफिक है, आ रहा हूँ।", "मैं यहाँ हूँ।"],
    ta: ["நான் வழியில் இருக்கிறேன், 2 நிமிடம்.", "கொஞ்சம் ட்ராஃபிக் இருக்கு, வருகிறேன்.", "நான் இங்கே இருக்கிறேன்."],
    te: ["నేను దారిలో ఉన్నాను, 2 నిమిషాలు.", "కొంచెం ట్రాఫిక్ ఉంది, వస్తున్నాను.", "నేను ఇక్కడ ఉన్నాను."],
    en: ["I'm on the way, 2 minutes.", "A bit of traffic, coming.", "I'm here."],
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  let map, pickupMarker, dropMarker, routeLine, vehicleMarker;
  let pickupLatLng = null;
  let dropLatLng = null;
  let routeLatLngs = [];
  let currentFare = null;
  let currentEta = null;
  let deviationTimer = null;
  let replyIndex = 0;

  // ---------------------------------------------------------------------
  // Small DOM helpers
  // ---------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  function showToast(msg, ms = 2600) {
    const toast = $("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), ms);
  }

  function setStatus(msg, isError = false) {
    const el = $("homeStatus");
    el.textContent = msg || "";
    el.classList.toggle("error", isError);
  }

  // ---------------------------------------------------------------------
  // Map init
  // ---------------------------------------------------------------------
  function initMap() {
    map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", onMapClick);
  }

  async function onMapClick(e) {
    dropLatLng = e.latlng;
    if (dropMarker) map.removeLayer(dropMarker);
    dropMarker = L.marker(dropLatLng, { title: "Drop" }).addTo(map);

    $("dropInput").value = "Locating address…";
    $("mapHint").style.display = "none";

    reverseGeocode(dropLatLng).then((label) => {
      $("dropInput").value = label;
    });

    if (pickupLatLng) {
      await fetchRouteAndFare();
    } else {
      setStatus("Set your pickup location too (tap the GPS icon).");
    }
  }

  // ---------------------------------------------------------------------
  // Geolocation + reverse geocoding
  // ---------------------------------------------------------------------
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation isn't supported in this browser.", true);
      return;
    }
    $("pickupInput").value = "Locating…";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        pickupLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        if (pickupMarker) map.removeLayer(pickupMarker);
        pickupMarker = L.marker(pickupLatLng, { title: "Pickup" }).addTo(map);
        map.setView(pickupLatLng, 15);

        const label = await reverseGeocode(pickupLatLng);
        $("pickupInput").value = label;
        setStatus("");

        if (dropLatLng) await fetchRouteAndFare();
      },
      (err) => {
        setStatus("Couldn't get your location — pick a pickup point manually isn't wired up yet.", true);
        $("pickupInput").value = "";
        console.warn("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function reverseGeocode(latlng) {
    try {
      const url = `${NOMINATIM_URL}?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=16`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("reverse geocode failed");
      const data = await res.json();
      const a = data.address || {};
      const short =
        a.road || a.suburb || a.neighbourhood || a.village || a.town || data.display_name;
      return short || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    } catch (e) {
      return `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    }
  }

  // ---------------------------------------------------------------------
  // Routing (OSRM) + fare (backend)
  // ---------------------------------------------------------------------
  async function fetchRouteAndFare() {
    if (!pickupLatLng || !dropLatLng) return;
    setStatus("Calculating route…");

    try {
      const url = `${OSRM_URL}/${pickupLatLng.lng},${pickupLatLng.lat};${dropLatLng.lng},${dropLatLng.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("OSRM request failed");
      const data = await res.json();

      if (!data.routes || !data.routes.length) throw new Error("No route found");
      const route = data.routes[0];

      routeLatLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(routeLatLngs, { color: "#912F40", weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

      const distanceKm = route.distance / 1000;
      const durationMin = route.duration / 60;

      const fareRes = await fetch("/api/estimate-fare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distance_km: distanceKm, duration_min: durationMin }),
      });
      const fareData = await fareRes.json();
      if (fareData.error) throw new Error(fareData.error);

      currentFare = fareData.fare;
      currentEta = fareData.eta_min;

      $("fareAmount").textContent = `₹${currentFare}`;
      $("etaText").textContent = `${currentEta} min away`;
      $("fareCard").style.display = "flex";

      const confirmBtn = $("confirmBtn");
      confirmBtn.disabled = false;
      confirmBtn.textContent = `Confirm ride · ₹${currentFare}`;
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Couldn't fetch a route right now — check your connection and try again.", true);
    }
  }

  // ---------------------------------------------------------------------
  // Booking -> tracking transition
  // ---------------------------------------------------------------------
  function confirmRide() {
    if (!routeLatLngs.length || currentFare == null) return;

    $("bookingCard").classList.add("hidden");
    $("tripCard").classList.remove("hidden");
    $("trackingFare").textContent = `₹${currentFare}`;
    $("trackingEta").textContent = `${currentEta} min away`;

    placeVehicleMarker(0.3);
    showToast("Ride confirmed — Ravi is on the way.");

    const devBtn = $("devDeviationBtn");
    if (isLocalDev()) devBtn.classList.remove("hidden");

    clearTimeout(deviationTimer);
    deviationTimer = setTimeout(simulateDeviation, DEVIATION_DELAY_MS);
  }

  function placeVehicleMarker(fraction) {
    if (!routeLatLngs.length) return;
    const idx = Math.min(
      routeLatLngs.length - 1,
      Math.floor(routeLatLngs.length * fraction)
    );
    const point = routeLatLngs[idx];
    if (vehicleMarker) map.removeLayer(vehicleMarker);
    vehicleMarker = L.circleMarker(point, {
      radius: 9,
      color: "#FFFFFA",
      weight: 2,
      fillColor: "#912F40",
      fillOpacity: 1,
    }).addTo(map);
  }

  function simulateDeviation() {
    if (!vehicleMarker) return;
    const { lat, lng } = vehicleMarker.getLatLng();
    // nudge the marker off the planned route
    const offLat = lat + (Math.random() > 0.5 ? 1 : -1) * 0.004;
    const offLng = lng + (Math.random() > 0.5 ? 1 : -1) * 0.004;
    vehicleMarker.setLatLng([offLat, offLng]);
    $("deviationBanner").classList.remove("hidden");
  }

  function isLocalDev() {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  function backToBooking() {
    $("tripCard").classList.add("hidden");
    $("bookingCard").classList.remove("hidden");
    $("deviationBanner").classList.add("hidden");
    $("devDeviationBtn").classList.add("hidden");
    clearTimeout(deviationTimer);

    if (vehicleMarker) { map.removeLayer(vehicleMarker); vehicleMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (pickupMarker) { map.removeLayer(pickupMarker); pickupMarker = null; }
    if (dropMarker) { map.removeLayer(dropMarker); dropMarker = null; }

    pickupLatLng = null;
    dropLatLng = null;
    routeLatLngs = [];
    currentFare = null;
    currentEta = null;

    $("pickupInput").value = "";
    $("dropInput").value = "";
    $("fareCard").style.display = "none";
    $("mapHint").style.display = "block";
    const confirmBtn = $("confirmBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Set pickup & drop to continue";
    setStatus("");
    map.setView(DEFAULT_CENTER, 13);
  }

  // ---------------------------------------------------------------------
  // Chat + translation
  // ---------------------------------------------------------------------
  function addBubble(text, translated, sent) {
    const log = $("chatLog");
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sent ? "sent" : "received"}`;

    const main = document.createElement("p");
    main.className = "main";
    main.textContent = text;
    bubble.appendChild(main);

    if (translated) {
      const t = document.createElement("p");
      t.className = "translated";
      t.textContent = translated;
      bubble.appendChild(t);
    }

    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  async function translate(text, targetLang) {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: targetLang }),
      });
      const data = await res.json();
      if (data.warning) showToast(data.warning, 4000);
      return data.translated || text;
    } catch (e) {
      console.error("Translate error:", e);
      return text;
    }
  }

  async function sendChatMessage() {
    const input = $("chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";

    const targetLang = $("langSelect").value;
    addBubble(text, "translating…", true);
    const bubbles = $("chatLog").querySelectorAll(".bubble.sent .translated");
    const lastTranslated = bubbles[bubbles.length - 1];

    const translated = await translate(text, targetLang);
    if (lastTranslated) lastTranslated.textContent = `→ ${translated}`;
  }

  async function simulateDriverReply() {
    const targetLang = $("langSelect").value;
    const phrases = PRESET_REPLIES[targetLang] || PRESET_REPLIES.en;
    const phrase = phrases[replyIndex % phrases.length];
    replyIndex++;

    addBubble(phrase, "translating…", false);
    const bubbles = $("chatLog").querySelectorAll(".bubble.received .translated");
    const lastTranslated = bubbles[bubbles.length - 1];

    const translated = await translate(phrase, "en");
    if (lastTranslated) lastTranslated.textContent = `→ ${translated}`;
  }

  // ---------------------------------------------------------------------
  // Modals + nav stubs
  // ---------------------------------------------------------------------
  function toggleModal(id, show) {
    $(id).classList.toggle("hidden", !show);
  }

  function wireStubs() {
    ["navHome", "navRides", "navSupport", "menuIcon", "profileIcon"].forEach((id) => {
      $(id).addEventListener("click", () =>
        showToast("This section isn't built yet in the demo.")
      );
    });
  }

  // ---------------------------------------------------------------------
  // Wire everything up
  // ---------------------------------------------------------------------
  function init() {
    initMap();
    wireStubs();

    $("gpsBtn").addEventListener("click", useCurrentLocation);
    $("confirmBtn").addEventListener("click", confirmRide);
    $("backFromTracking").addEventListener("click", backToBooking);

    $("sosOpenBtn").addEventListener("click", () => toggleModal("sosModal", true));
    $("sosCloseBtn").addEventListener("click", () => toggleModal("sosModal", false));

    $("chatOpenBtn").addEventListener("click", () => {
      toggleModal("chatModal", true);
      if (!$("chatLog").children.length) {
        addBubble("Hi! I'm on my way to the pickup point.", "→ (translated as you type)", false);
      }
    });
    $("chatCloseBtn").addEventListener("click", () => toggleModal("chatModal", false));
    $("sendChatBtn").addEventListener("click", sendChatMessage);
    $("chatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
    $("simulateReplyBtn").addEventListener("click", simulateDriverReply);

    $("closeDeviation").addEventListener("click", () =>
      $("deviationBanner").classList.add("hidden")
    );
    $("devDeviationBtn").addEventListener("click", simulateDeviation);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
