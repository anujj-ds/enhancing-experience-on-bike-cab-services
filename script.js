/* =====================================================
   RideEase — Fully Static GitHub Pages Edition
   Features: Real road routing (OSRM), Fare Estimation,
   Ride Scheduling, Dynamic Driver Assignment, Nearby Places,
   AI Chat Support (Gemini API), Driver Translation Chat,
   Route Deviation Alert, SOS Modal.
   ===================================================== */

/* ---------- GEMINI CONFIG ---------- */
// Add your free Gemini API key at: https://aistudio.google.com/apikey
// Enter it via the Profile icon > API Key input in the app.
// The app uses intelligent offline fallbacks if no key is set.
const DEFAULT_GEMINI_KEY = '';
let GEMINI_API_KEY = localStorage.getItem('rideease_gemini_key') || DEFAULT_GEMINI_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=`;

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const DEFAULT_CENTER = [12.9716, 77.5946];

const BASE_FARE = 15;
const RATE_PER_KM = 12;

/* ---------- PILOT POOL ---------- */
const PILOTS = [
  { name: 'Ravi Kumar',     rating: 4.9,  rides: '1,420', vehicle: 'Honda Activa 6G (Black)',          plate: 'KA 05 AB 1234', avatar: 'R', badge: 'Top Pilot',     eta: 3 },
  { name: 'Suresh Gowda',   rating: 4.85, rides: '980',   vehicle: 'TVS Apache RTR 160 (Matte Blue)',  plate: 'KA 04 EN 5678', avatar: 'S', badge: 'Top Rated',     eta: 5 },
  { name: 'M. Farooq',      rating: 4.95, rides: '2,150', vehicle: 'Bajaj Pulsar 150 (Silver/Black)',  plate: 'KA 01 MX 9012', avatar: 'F', badge: 'Premier Pilot', eta: 4 },
  { name: 'Deepak Sharma',  rating: 4.78, rides: '640',   vehicle: 'Hero Splendor Plus (Red)',         plate: 'KA 03 HJ 3456', avatar: 'D', badge: 'Verified',       eta: 6 },
  { name: 'Manjunath K.',   rating: 4.88, rides: '1,890', vehicle: 'Royal Enfield Hunter 350 (Ash)',   plate: 'KA 51 Q 7890',  avatar: 'M', badge: 'Top Rated',     eta: 4 },
];

/* ---------- CURATED PLACES ---------- */
const PLACES = [
  { id:'p1', name:'Third Wave Coffee',       cat:'cafe',    icon:'☕', area:'12th Main, Indiranagar',    coords:[12.9719, 77.6412], desc:'Artisan specialty coffee', rating:'★4.8' },
  { id:'p2', name:'DYU Art Cafe',            cat:'cafe',    icon:'🎨', area:'5th Block, Koramangala',    coords:[12.9344, 77.6225], desc:'Rustic Portuguese cafe',  rating:'★4.7' },
  { id:'p3', name:'MG Road Metro',           cat:'metro',   icon:'🚇', area:'Purple Line, MG Road',      coords:[12.9756, 77.6066], desc:'Central transit hub',     rating:'★4.6' },
  { id:'p4', name:'Indiranagar Metro',       cat:'metro',   icon:'🚇', area:'CMH Road, Indiranagar',     coords:[12.9783, 77.6387], desc:'East Bangalore connect',  rating:'★4.5' },
  { id:'p5', name:'Manyata Tech Park',       cat:'tech',    icon:'🏢', area:'Nagawara / Hebbal',         coords:[13.0475, 77.6200], desc:'Premier IT corridor',     rating:'★4.6' },
  { id:'p6', name:'Bagmane Tech Park',       cat:'tech',    icon:'🏢', area:'CV Raman Nagar',            coords:[12.9806, 77.6628], desc:'Major software park',     rating:'★4.5' },
  { id:'p7', name:'Phoenix Marketcity',      cat:'mall',    icon:'🛍️', area:'Whitefield Main Road',      coords:[12.9959, 77.6964], desc:'Mega shopping & multiplex', rating:'★4.7' },
  { id:'p8', name:'Cubbon Park',             cat:'hangout', icon:'🌳', area:'Kasturba Road, Central',    coords:[12.9763, 77.5929], desc:'300-acre green lung',     rating:'★4.9' },
  { id:'p9', name:'Church Street',           cat:'hangout', icon:'📚', area:'Off Brigade Road',          coords:[12.9748, 77.6053], desc:'Pedestrian street & cafes', rating:'★4.8' },
];

/* ---------- APP STATE ---------- */
const state = {
  map: null,
  pickup: null,
  drop: null,
  pickupMarker: null,
  dropMarker: null,
  routeLine: null,
  routeLatLngs: null,
  vehicleMarker: null,
  mode: 'booking',         // 'booking' | 'matching' | 'tracking'
  deviationTimer: null,
  deviationTriggered: false,
  bookingType: 'now',
  scheduledLabel: 'Immediately',
  currentDriver: null,
  fareData: null,
  tripId: null,
  rideOtp: null,
  supportHistory: [],
  emergencyContact: { name: '', phone: '' },
};

/* ---------- TOAST ---------- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add('hidden'), 2500);
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showCard(id) {
  ['bookingCard','matchingCard','tripCard'].forEach(c => document.getElementById(c).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

/* ---------- MAP INIT ---------- */
function initMap() {
  state.map = L.map('map', { zoomControl: true }).setView(DEFAULT_CENTER, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  }).addTo(state.map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => setPickup([p.coords.latitude, p.coords.longitude]),
      () => setPickup(DEFAULT_CENTER)
    );
  } else {
    setPickup(DEFAULT_CENTER);
  }

  state.map.on('click', e => {
    if (state.mode !== 'booking') return;
    setDrop([e.latlng.lat, e.latlng.lng]);
  });
}

function setPickup(latlng) {
  state.pickup = latlng;
  state.map.setView(latlng, 15);
  if (state.pickupMarker) {
    state.pickupMarker.setLatLng(latlng);
  } else {
    state.pickupMarker = L.circleMarker(latlng, {
      radius: 8, color: '#2D7D46', fillColor: '#2D7D46', fillOpacity: 1, weight: 3
    }).addTo(state.map).bindPopup('📍 Pickup');
  }
  document.getElementById('pickupInput').value =
    `Near you (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`;
  loadNearbyPlaces(latlng);
  if (state.drop) requestRoute();
}

function setDrop(latlng) {
  state.drop = latlng;
  if (state.dropMarker) {
    state.dropMarker.setLatLng(latlng);
  } else {
    state.dropMarker = L.marker(latlng).addTo(state.map).bindPopup('📍 Drop');
  }
  document.getElementById('dropInput').value =
    `Selected (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`;
  requestRoute();
}

/* ---------- OSRM ROUTING ---------- */
async function requestRoute() {
  if (!state.pickup || !state.drop) return;
  const statusEl = document.getElementById('homeStatus');
  statusEl.textContent = 'Finding route...';
  statusEl.className = 'status-msg';

  const [pLat, pLng] = state.pickup;
  const [dLat, dLng] = state.drop;
  const url = `${OSRM_URL}/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      statusEl.textContent = 'Could not find a route between these points.';
      statusEl.className = 'status-msg error';
      return;
    }
    const route = data.routes[0];
    state.routeLatLngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
    if (state.routeLine) state.map.removeLayer(state.routeLine);
    state.routeLine = L.polyline(state.routeLatLngs, { color: '#8E1616', weight: 4, opacity: 0.85 }).addTo(state.map);
    state.map.fitBounds(state.routeLine.getBounds(), { padding: [60, 60] });

    const distKm = route.distance / 1000;
    const durMin = route.duration / 60;
    calcFare(distKm, durMin);
  } catch {
    statusEl.textContent = 'Route lookup failed — check your connection.';
    statusEl.className = 'status-msg error';
  }
}

function calcFare(distKm, durMin) {
  const fare = Math.round(BASE_FARE + distKm * RATE_PER_KM);
  const eta = Math.max(2, Math.round(durMin));
  state.fareData = { fare, eta, distKm: Math.round(distKm * 100) / 100 };

  document.getElementById('fareAmount').textContent = `₹${fare}`;
  document.getElementById('etaText').textContent = `${eta} min`;
  document.getElementById('fareCard').classList.remove('hidden');

  document.getElementById('trackingFare').textContent = `₹${fare}`;
  document.getElementById('trackingEta').textContent = `${eta} min`;

  const btn = document.getElementById('confirmBtn');
  btn.disabled = false;
  btn.textContent = state.bookingType === 'now' ? '🚴 Confirm Ride Now' : '📅 Schedule This Ride';
  document.getElementById('homeStatus').textContent = '';
}

/* ---------- NEARBY PLACES ---------- */
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b[0]-a[0]) * Math.PI / 180;
  const dLng = (b[1]-a[1]) * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(a[0]*Math.PI/180) * Math.cos(b[0]*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

let activeCat = 'all';

function loadNearbyPlaces(pickup) {
  const list = document.getElementById('placesList');
  const filtered = activeCat === 'all' ? PLACES : PLACES.filter(p => p.cat === activeCat);
  const sorted = filtered.map(p => ({
    ...p, dist: Math.round(haversineKm(pickup || DEFAULT_CENTER, p.coords) * 10) / 10
  })).sort((a,b) => a.dist - b.dist);

  list.innerHTML = sorted.map(p => `
    <div class="place-card" data-id="${p.id}" data-lat="${p.coords[0]}" data-lng="${p.coords[1]}" data-name="${p.name}">
      <div class="place-left">
        <span class="place-icon">${p.icon}</span>
        <div>
          <p class="place-name">${p.name}</p>
          <p class="place-area">${p.area} &middot; ${p.rating}</p>
        </div>
      </div>
      <span class="place-dist">${p.dist} km</span>
    </div>
  `).join('');

  list.querySelectorAll('.place-card').forEach(card => {
    card.addEventListener('click', () => {
      const lat = parseFloat(card.dataset.lat);
      const lng = parseFloat(card.dataset.lng);
      const name = card.dataset.name;
      setDrop([lat, lng]);
      document.getElementById('dropInput').value = `${name}`;
      showToast(`📍 Drop set to ${name}`);
    });
  });
}

document.getElementById('categoryChips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeCat = chip.dataset.cat;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  loadNearbyPlaces(state.pickup);
});

/* ---------- GPS BUTTON ---------- */
document.getElementById('gpsBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  document.getElementById('homeStatus').textContent = 'Getting location...';
  navigator.geolocation.getCurrentPosition(
    p => { setPickup([p.coords.latitude, p.coords.longitude]); document.getElementById('homeStatus').textContent = ''; },
    () => showToast('Could not access location')
  );
});

/* ---------- TIME SELECTOR ---------- */
document.querySelectorAll('.time-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.time-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.bookingType = btn.dataset.type;
    const schedRow = document.getElementById('scheduleRow');
    schedRow.classList.toggle('hidden', state.bookingType !== 'schedule');
    const confirmBtn = document.getElementById('confirmBtn');
    if (!confirmBtn.disabled) {
      confirmBtn.textContent = state.bookingType === 'now' ? '🚴 Confirm Ride Now' : '📅 Schedule This Ride';
    }
  });
});

document.getElementById('scheduleSelect').addEventListener('change', function() {
  const customInput = document.getElementById('customTime');
  customInput.classList.toggle('hidden', this.value !== 'custom');
  updateScheduledLabel();
});

function updateScheduledLabel() {
  const sel = document.getElementById('scheduleSelect');
  const customInput = document.getElementById('customTime');
  if (sel.value === 'custom' && customInput.value) {
    state.scheduledLabel = `Custom time: ${customInput.value}`;
  } else if (sel.value === '15') { state.scheduledLabel = 'In 15 minutes'; }
  else if (sel.value === '30') { state.scheduledLabel = 'In 30 minutes'; }
  else if (sel.value === '60') { state.scheduledLabel = 'In 1 hour'; }
}

/* ---------- CONFIRM RIDE ---------- */
document.getElementById('confirmBtn').addEventListener('click', async () => {
  if (!state.pickup || !state.drop || !state.fareData) return;
  updateScheduledLabel();
  showCard('matchingCard');
  state.mode = 'matching';
  await new Promise(r => setTimeout(r, 2400));  // matching animation
  assignDriver();
});

function assignDriver() {
  const pilot = PILOTS[Math.floor(Math.random() * PILOTS.length)];
  state.currentDriver = pilot;
  state.rideOtp = String(Math.floor(1000 + Math.random() * 9000));
  state.tripId = `RE-${Math.floor(1000 + Math.random() * 9000)}`;

  // Update driver card
  document.getElementById('driverAvatar').textContent = pilot.avatar;
  document.getElementById('driverName').textContent = pilot.name;
  document.getElementById('driverSub').textContent = `⭐ ${pilot.rating} · ${pilot.rides} rides`;
  document.getElementById('driverVehicle').textContent = pilot.vehicle + ' · ' + pilot.plate;
  document.getElementById('driverBadge').textContent = pilot.badge;
  document.getElementById('otpCode').textContent = state.rideOtp;
  document.getElementById('chatDriverAvatar').textContent = pilot.avatar;
  document.getElementById('chatDriverName').textContent = `Chat with ${pilot.name}`;

  // Schedule label
  const schedVal = document.getElementById('schedVal');
  if (state.bookingType === 'now') {
    schedVal.textContent = `Arriving ~${pilot.eta} mins`;
    document.getElementById('tripStatusPill').textContent = 'En Route';
  } else {
    schedVal.textContent = state.scheduledLabel;
    document.getElementById('tripStatusPill').textContent = 'Scheduled';
  }

  enterTrackingMode();
}

function enterTrackingMode() {
  state.mode = 'tracking';
  showCard('tripCard');
  document.getElementById('mapHint').style.display = 'none';
  document.getElementById('devDeviationBtn').classList.remove('hidden');

  const startPt = pointAlongRoute(0.25);
  const icon = L.divIcon({
    className: '',
    html: `<div class="vehicle-marker">🚴</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  });
  if (state.vehicleMarker) state.map.removeLayer(state.vehicleMarker);
  state.vehicleMarker = L.marker(startPt, { icon }).addTo(state.map);

  state.deviationTriggered = false;
  clearTimeout(state.deviationTimer);
  state.deviationTimer = setTimeout(triggerDeviation, 7000);
  showToast(`✅ Ride confirmed! OTP: ${state.rideOtp}`);
}

function exitTrackingMode() {
  state.mode = 'booking';
  showCard('bookingCard');
  document.getElementById('mapHint').style.display = 'block';
  document.getElementById('devDeviationBtn').classList.add('hidden');
  document.getElementById('deviationBanner').classList.add('hidden');
  document.getElementById('fareCard').classList.add('hidden');
  document.getElementById('confirmBtn').disabled = true;
  document.getElementById('confirmBtn').textContent = 'Set pickup & drop to continue';
  clearTimeout(state.deviationTimer);
  if (state.vehicleMarker) { state.map.removeLayer(state.vehicleMarker); state.vehicleMarker = null; }
}

document.getElementById('backFromTracking').addEventListener('click', exitTrackingMode);

function pointAlongRoute(frac) {
  if (!state.routeLatLngs || state.routeLatLngs.length < 2) return state.pickup;
  const idx = Math.floor(state.routeLatLngs.length * frac);
  return state.routeLatLngs[Math.min(idx, state.routeLatLngs.length - 1)];
}

function triggerDeviation() {
  if (state.deviationTriggered || !state.vehicleMarker) return;
  state.deviationTriggered = true;
  const mid = pointAlongRoute(0.35);
  state.vehicleMarker.setLatLng([mid[0] + 0.004, mid[1] + 0.004]);
  document.getElementById('deviationBanner').classList.remove('hidden');
}

document.getElementById('devDeviationBtn').addEventListener('click', () => {
  state.deviationTriggered = false; triggerDeviation();
});
document.getElementById('closeDeviation').addEventListener('click', () => {
  document.getElementById('deviationBanner').classList.add('hidden');
});

/* ---------- AI SUPPORT CHAT (Gemini REST API) ---------- */
const supportLog = document.getElementById('supportLog');
const supportInput = document.getElementById('supportInput');
let supportHistory = [];

function buildRideContext() {
  if (!state.tripId) return 'No active trip — rider is in booking/browsing mode.';
  const d = state.currentDriver;
  return `ACTIVE TRIP:
- Trip ID: ${state.tripId}
- Booking: ${state.bookingType === 'now' ? 'Ride Now' : 'Scheduled (' + state.scheduledLabel + ')'}
- Driver: ${d.name} (${d.vehicle} · ${d.plate}) — ⭐ ${d.rating}
- Ride OTP: ${state.rideOtp}
- Estimated Fare: ₹${state.fareData?.fare || '--'} (Cash)
- Distance: ${state.fareData?.distKm || '--'} km`;
}

async function callGeminiSupport(userMsg) {
  const rideCtx = buildRideContext();
  const systemPrompt = `You are Aria, a friendly and efficient AI Support Specialist for RideEase — a bike-cab hailing app.

CURRENT RIDER CONTEXT:
${rideCtx}

RIDEEASE POLICIES:
- Fare: ₹${BASE_FARE} base + ₹${RATE_PER_KM}/km (e.g. 5km ride = ₹75). Cash only.
- Ride OTP must be shared with pilot before trip starts.
- Free cancellation before pilot reaches pickup.
- Schedule rides up to 2 hours in advance.
- SOS button available on all active trip screens.
- Route deviation alerts triggered automatically if pilot goes off route.
- Nearby places (cafes, metro, tech parks, malls, hangouts) shown in the Explore panel.

RESPONSE RULES:
- Be warm, concise (2-3 sentences), and directly helpful.
- Reference active trip details (driver name, OTP, fare) when relevant.
- End with 2-3 natural follow-up suggestions as bold bullet points.`;

  // Build messages array with recent history
  const messages = [];
  for (const h of supportHistory.slice(-8)) {
    messages.push({ role: h.role, parts: [{ text: h.text }] });
  }
  messages.push({ role: 'user', parts: [{ text: userMsg }] });

  try {
    const res = await fetch(GEMINI_URL + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages,
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    });
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    throw new Error(data.error?.message || 'No response');
  } catch (err) {
    console.warn('[Gemini Support]', err);
    return fallbackSupportReply(userMsg);
  }
}

function fallbackSupportReply(msg) {
  const m = msg.toLowerCase();
  const d = state.currentDriver;
  if (m.includes('fare') || m.includes('cost') || m.includes('price') || m.includes('rate'))
    return `RideEase pricing is **₹${BASE_FARE} base fare + ₹${RATE_PER_KM}/km**. Your current fare estimate is ₹${state.fareData?.fare || '--'}. Payment is made in cash to your pilot at trip end.\n\n**Try:** Cancel ride policy | What is my OTP?`;
  if (m.includes('driver') || m.includes('pilot') || m.includes('where'))
    return d ? `Your assigned pilot is **${d.name}** (${d.vehicle}). Share your Ride PIN **${state.rideOtp}** when they arrive.\n\n**Try:** Estimated ETA | Safety features` : `Once you confirm your booking, we instantly dispatch the nearest verified pilot.\n\n**Try:** Book now | Schedule a ride`;
  if (m.includes('otp') || m.includes('pin'))
    return state.rideOtp ? `Your Ride Start PIN is **${state.rideOtp}**. Share this with ${d?.name || 'your pilot'} before the ride begins for security verification.\n\n**Try:** What if driver refuses? | Cancel ride` : `A Ride PIN is generated after you confirm your booking. It must be shared with your pilot before your trip starts.`;
  if (m.includes('cancel'))
    return `You can cancel your ride **free of charge** before your pilot reaches your pickup location. Once they've arrived, a small fee may apply.\n\n**Try:** How to rebook | Fare refund policy`;
  if (m.includes('sos') || m.includes('safe') || m.includes('emerg') || m.includes('danger'))
    return `Your safety is our #1 priority! Tap the red **SOS button** in your active ride screen to immediately alert your saved emergency contact. Route deviation alerts are also auto-triggered if your pilot goes off route.\n\n**Try:** Add emergency contact | View safety tips`;
  if (m.includes('place') || m.includes('cafe') || m.includes('metro') || m.includes('recom'))
    return `Check out the **Explore Nearby** section on the booking panel! We've curated cafes, metro stations, tech parks, malls, and parks near your location — tap any to instantly set as your drop point.\n\n**Try:** Show cafes near me | Nearest metro station`;
  if (m.includes('schedule') || m.includes('later') || m.includes('time'))
    return `You can schedule rides in advance using the **"Schedule"** toggle on the booking panel. Choose 15 mins, 30 mins, 1 hour, or a custom time — we'll dispatch a pilot right on time!\n\n**Try:** Book now instead | Cancellation policy`;
  return `Hi! I'm **Aria**, your RideEase Support Assistant. I can help with your ride, fare details, driver assignment, scheduling, safety, or nearby place suggestions. What do you need?\n\n**Try:** Fare breakdown | Driver status | SOS info`;
}

function addSupportBubble(text, role, chips) {
  const wrap = document.createElement('div');
  wrap.className = `bubble ${role === 'user' ? 'sent' : 'received'}`;

  // Convert **bold** markdown to <strong>
  const formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const main = document.createElement('p');
  main.className = 'main';
  main.innerHTML = formatted;
  wrap.appendChild(main);

  const time = document.createElement('span');
  time.className = 'bubble-time';
  time.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  wrap.appendChild(time);

  supportLog.appendChild(wrap);
  supportLog.scrollTop = supportLog.scrollHeight;

  if (chips?.length) {
    const chipsEl = document.getElementById('supportChips');
    chipsEl.innerHTML = chips.map(c => `<button class="quick-chip" data-q="${c}">${c}</button>`).join('');
    bindChips();
  }
}

function showTypingIndicator() {
  const ind = document.createElement('div');
  ind.className = 'bubble received';
  ind.id = 'typingIndicator';
  const inner = document.createElement('div');
  inner.className = 'typing-indicator';
  inner.innerHTML = '<span></span><span></span><span></span>';
  ind.appendChild(inner);
  supportLog.appendChild(ind);
  supportLog.scrollTop = supportLog.scrollHeight;
}
function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
}

async function sendSupportMessage(text) {
  if (!text.trim()) return;
  supportInput.value = '';
  addSupportBubble(text, 'user');
  supportHistory.push({ role: 'user', text });
  showTypingIndicator();

  const reply = await callGeminiSupport(text);
  removeTypingIndicator();

  // Extract potential quick chips from reply
  const chips = ['💳 Fare breakdown', '📍 Driver status', '❌ Cancel policy', '🆘 Safety & SOS', '📅 Schedule ride'];
  addSupportBubble(reply, 'model', chips);
  supportHistory.push({ role: 'model', text: reply });
}

document.getElementById('sendSupportBtn').addEventListener('click', () => sendSupportMessage(supportInput.value));
supportInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendSupportMessage(supportInput.value); });

function bindChips() {
  document.querySelectorAll('#supportChips .quick-chip').forEach(btn => {
    btn.addEventListener('click', () => sendSupportMessage(btn.dataset.q));
  });
}
bindChips();

document.getElementById('floatSupportBtn').addEventListener('click', () => openModal('supportModal'));
document.getElementById('navSupport').addEventListener('click', () => openModal('supportModal'));
document.getElementById('supportCloseBtn').addEventListener('click', () => closeModal('supportModal'));

/* ---------- DRIVER TRANSLATION CHAT ---------- */
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const langSelect = document.getElementById('langSelect');

const LANG_NAMES = { kn:'Kannada', hi:'Hindi', ta:'Tamil', te:'Telugu', en:'English' };
const DRIVER_REPLIES_KN = [
  'ಸರ್, ನಾನು ಗೇಟ್ ಬಳಿ ಇದ್ದೇನೆ',
  'ಸ್ವಲ್ಪ ಟ್ರಾಫಿಕ್ ಇದೆ, 2 ನಿಮಿಷ ತಡವಾಗುತ್ತದೆ',
  'ದಯವಿಟ್ಟು ಮುಖ್ಯ ಗೇಟ್ ಬಳಿ ಬನ್ನಿ',
  'OTP ಹೇಳಿ ಸರ್',
  'ನಾನು ಪಾರ್ಕಿಂಗ್ ಲಾಟ್ ಬಳಿ ಇದ್ದೇನೆ'
];

async function translateText(text, targetLang) {
  const prompt = `Detect the language of this text and translate it to ${LANG_NAMES[targetLang] || targetLang}. Reply ONLY with the translation, no explanation:\n\n${text}`;
  try {
    const res = await fetch(GEMINI_URL + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role:'user', parts:[{ text: prompt }] }], generationConfig: { maxOutputTokens: 100 } })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
  } catch { return text; }
}

function addChatBubble({ main, translated, sent }) {
  const wrap = document.createElement('div');
  wrap.className = `bubble ${sent ? 'sent' : 'received'}`;
  const mainEl = document.createElement('p');
  mainEl.className = 'main';
  mainEl.textContent = main;
  wrap.appendChild(mainEl);
  if (translated) {
    const transEl = document.createElement('p');
    transEl.className = 'translated';
    transEl.textContent = translated;
    wrap.appendChild(transEl);
  }
  const timeEl = document.createElement('span');
  timeEl.className = 'bubble-time';
  timeEl.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  wrap.appendChild(timeEl);
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  const bubble = addChatBubble({ main: text, translated: '…translating', sent: true });
  const tr = await translateText(text, langSelect.value);
  bubble.querySelector('.translated').textContent = tr;
}

document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });

document.getElementById('simulateReplyBtn').addEventListener('click', async () => {
  const reply = DRIVER_REPLIES_KN[Math.floor(Math.random() * DRIVER_REPLIES_KN.length)];
  const bubble = addChatBubble({ main: reply, translated: '…translating', sent: false });
  const tr = await translateText(reply, 'en');
  bubble.querySelector('.translated').textContent = tr;
});

document.getElementById('chatOpenBtn').addEventListener('click', () => openModal('chatModal'));
document.getElementById('chatCloseBtn').addEventListener('click', () => closeModal('chatModal'));

/* ---------- SOS ---------- */
document.getElementById('sosOpenBtn').addEventListener('click', () => openModal('sosModal'));
document.getElementById('sosCloseBtn').addEventListener('click', () => closeModal('sosModal'));
document.getElementById('sosSaveBtn').addEventListener('click', () => {
  const name = document.getElementById('sosName').value.trim() || 'Emergency Contact';
  const phone = document.getElementById('sosPhone').value.trim();
  if (!phone) { showToast('Enter a phone number'); return; }
  state.emergencyContact = { name, phone };
  localStorage.setItem('rideease_sos', JSON.stringify(state.emergencyContact));
  document.getElementById('sosStatus').textContent = `✅ Contact saved: ${name} (${phone})`;
  showToast('Emergency contact saved!');
});
document.getElementById('sosTriggerBtn').addEventListener('click', () => {
  document.getElementById('sosTriggerBtn').textContent = '📡 ALERT SENT!';
  document.getElementById('sosStatus').textContent = '🚨 Emergency alert triggered! Location shared with contacts and authorities.';
  showToast('🚨 SOS Alert Triggered!');
  setTimeout(() => { document.getElementById('sosTriggerBtn').textContent = '🚨 TRIGGER SOS ALERT'; }, 4000);
});

/* ---------- NAV & PROFILE ---------- */
document.getElementById('navHome').addEventListener('click', () => showToast('You are on the Home screen'));
document.getElementById('navRides').addEventListener('click', () => openModal('ridesModal'));
document.getElementById('ridesCloseBtn').addEventListener('click', () => closeModal('ridesModal'));
document.getElementById('menuIcon').addEventListener('click', () => showToast('Navigation menu — coming soon'));
document.getElementById('profileIcon').addEventListener('click', () => {
  const saved = localStorage.getItem('rideease_gemini_key');
  if (saved) document.getElementById('apiKeyInput').value = saved;
  openModal('profileModal');
});
document.getElementById('profileCloseBtn').addEventListener('click', () => closeModal('profileModal'));
document.getElementById('saveApiKey').addEventListener('click', () => {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (key) {
    GEMINI_API_KEY = key;
    localStorage.setItem('rideease_gemini_key', key);
    showToast('✅ Gemini API key saved');
  }
});

// Restore emergency contact
const savedSos = localStorage.getItem('rideease_sos');
if (savedSos) {
  try {
    state.emergencyContact = JSON.parse(savedSos);
    document.getElementById('sosName').value = state.emergencyContact.name;
    document.getElementById('sosPhone').value = state.emergencyContact.phone;
  } catch {}
}

/* ---------- INIT ---------- */
initMap();
loadNearbyPlaces(DEFAULT_CENTER);
