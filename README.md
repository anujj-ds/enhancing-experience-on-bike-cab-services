<img width="1600" height="1600" alt="image" src="https://github.com/user-attachments/assets/a5c31230-83a7-4274-95ea-bd5b06389448" />


# RideEase

A ride-hailing web app concept (inspired by Rapido), built as an academic project. Riders can book a ride with a real pickup-to-drop map route, get a fare estimate, and chat with the driver using a live AI translation bot.

## Features

- **Real road routing** — pickup and drop are connected via an actual road route (not a straight line), using OpenStreetMap + OSRM.
- **AI translation chat** — powered by Google's Gemini API. Auto-detects the language you type in and translates both sides of the conversation (default: Kannada).
- **Fare estimation** — calculated from the real route distance (₹15 base + ₹12/km).
- **Route deviation alert** — simulates a notification if the driver goes off the planned route.
- **Cash-only payment** — no UPI integration in this version.
- **SOS button** — present in the UI but intentionally inactive; shows an "under development" message since it requires an emergency contact setup flow that hasn't been built yet.

## Tech stack

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js (map)
- **Backend:** Python, Flask
- **APIs:** OSRM (free routing, no key required), Google Gemini API (translation)

## Installation Guide

1. Install dependencies:
   ```
   pip install flask google-genai python-dotenv
   ```

2. Rename `.env.example` to `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no billing required.

3. Run the app:
   ```
   python app.py
   ```

4. Open `http://127.0.0.1:5000` in your browser.

## Project structure

```
rideease/
├── app.py              # Flask backend (fare calc, translation, SOS stub)
├── .env                # API keys (not committed)
├── templates/
│   └── index.html      # Main page
└── static/
    ├── style.css
    └── script.js        # Map, routing, chat, and SOS logic
```

## Known limitations

- Fare formula is a simple flat rate, not tied to real-time demand or traffic.
- SOS is UI-only; it does not place a real call or send an SMS yet.
- No user accounts, login, or ride history — this is a single-session demo.
- Driver responses in chat are simulated (preset sample messages), not from a real driver.

## Future scope

- Wire up SOS with a real emergency contact and Twilio-based calling/SMS.
- Add user authentication and a ride history database.
- Real-time driver GPS tracking instead of a simulated vehicle marker.
