# RideEase — Project Implementation

A ride-hailing web app concept (inspired by Rapido), built as an academic project. Riders book a ride with a real pickup-to-drop road route, get a live fare estimate, and chat with the driver through an AI translation bot.

---

## 1. Project Overview

| Field | Detail |
|---|---|
| Project type | Academic project (concept / working demo build) |
| Inspiration | Rapido-style ride-hailing UX |
| Core stack | Python 3 + Flask backend, HTML/CSS/JavaScript + Leaflet.js frontend |
| Key integrations | OSRM (road routing), Google Gemini API (chat translation) |
| Current deployment | Local / single-instance demo (not hosted) |

### 1.1 Problem Statement
Riders and drivers on short intra-city trips often don't share a common language, which slows down coordinating pickup points and directions. Riders also want an upfront, accurate fare based on a real road route rather than a straight-line estimate. RideEase addresses both: real road-based routing for trip planning and fare estimation, plus an AI-powered translation layer so rider and driver can chat comfortably in their own languages.

### 1.2 Target Users
- **Riders** — commuters booking short intra-city trips who want an accurate fare estimate and may prefer to chat in a regional language.
- **Drivers** — represented in this prototype by a simulated engine (a vehicle marker moving along the route, preset Kannada reply phrases sent through the translation pipeline).
- **Evaluators / instructors** — the audience for this academic build.

### 1.3 Core Features
- **Real road routing** — pickup and drop connected via an actual road route (not a straight line), using OpenStreetMap + OSRM.
- **AI translation chat** — powered by Google's Gemini API; auto-detects the language typed and translates both sides of the conversation (default target: Kannada).
- **Fare estimation** — calculated from real route distance (₹15 base + ₹12/km).
- **Route deviation alert** — simulates a notification if the driver goes off the planned route (auto-triggers ~9s after ride confirmation, or manually via a dev button).
- **Cash-only payment** — no UPI integration in this version.
- **SOS button** — present in the UI but intentionally inactive; shows an "under development" message since it requires an emergency-contact setup flow not yet built.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML / CSS / JavaScript | Structure, styling, interactivity |
| Frontend | Leaflet.js | Interactive map rendering, markers, route polyline |
| Backend | Python 3 + Flask | Web server and REST API (`app.py`) |
| Backend | python-dotenv | Loads `GEMINI_API_KEY` from a local `.env` file |
| Backend | google-genai SDK | Calls the Gemini API for translation, server-side |
| External API | OSRM | Free road-routing engine, no API key required |
| External API | Google Gemini API | Language detection and translation |

**Why these choices:**
- **Leaflet + OSRM** — free, no API key needed; OSRM returns real driving routes (GeoJSON), not straight-line distances.
- **Flask** — lightweight, quick to stand up a handful of JSON API routes.
- **Gemini API** — strong multilingual translation with a simple SDK; one prompt both detects source language and translates.
- **python-dotenv** — keeps the API key out of source control.

---

## 3. System Architecture

RideEase is a two-tier web app: a Flask backend serving pages and a small JSON API, and a browser-based frontend handling all UI, map rendering, and state. The server is **stateless** — nothing is written to disk between requests.

### 3.1 Component Table

| Layer | Component | Responsibility |
|---|---|---|
| Frontend | Booking panel | Collects pickup/drop, displays fare, confirms ride |
| Frontend | Map panel (Leaflet.js) | Renders map, markers, route line, vehicle position |
| Frontend | Chat modal | Sends/receives messages, displays translations |
| Frontend | SOS modal | Placeholder UI for the emergency feature |
| Backend | Flask app (`app.py`) | Serves pages, exposes REST endpoints |
| Backend | `/api/estimate-fare` | Calculates fare from route distance/duration |
| Backend | `/api/translate` | Calls Gemini API, returns translated text |
| Backend | `/api/sos` | Stub endpoint for the future SOS flow |
| External | OSRM routing service | Returns real road-route geometry, distance, duration |
| External | Google Gemini API | Detects language and translates chat messages |

### 3.2 Authentication & Data
There is **no authentication** and **no database** in the current build — a deliberate simplification for a single-session academic demo. All trip state (pickup/drop, route, fare, chat history) lives only in browser memory for the duration of the page session; nothing persists once the tab closes or the server restarts. The only stored artifact is the local `.env` file holding `GEMINI_API_KEY`.

---

## 4. Data Flow

### 4.1 Booking a Ride
1. Browser loads the page; JS initializes a Leaflet map centered on the user's GPS location (Geolocation API), or a default city center as fallback.
2. User clicks a point on the map to set the drop location.
3. Frontend sends both coordinates directly to the public **OSRM** routing API, which returns the road path (GeoJSON), distance, and estimated duration.
4. Frontend POSTs distance/duration to `/api/estimate-fare`.
5. Backend applies the fare formula (₹15 base + ₹12/km) and returns fare + ETA as JSON.
6. Frontend updates the fare card and enables "Confirm ride."

### 4.2 Chat Translation
1. User types a message and picks a target language.
2. Frontend POSTs text + target language code to `/api/translate`.
3. Backend builds a prompt instructing Gemini to detect the source language and translate into the target, then calls the Gemini API server-side (keeping the key private).
4. Translated text returns as JSON and renders beneath the original message bubble.

### 4.3 Simulated Trip Events
Once a ride is confirmed, a vehicle marker is placed ~30% of the way along the route. A timer triggers a simulated route deviation a few seconds later (marker nudges off-route, warning banner shows); a manual "Simulate deviation" button can also trigger this on demand. Clicking SOS opens a modal explaining an emergency contact must be configured first — it does not call any backend route.

---

## 5. Project Structure

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

---

## 6. API Reference

### `POST /api/estimate-fare`
**Request body:**
```json
{ "distance_km": 4.2, "duration_min": 11 }
```
**Response:**
```json
{ "fare": 65, "eta_min": 11, "distance_km": 4.2, "payment_method": "Cash" }
```
Fare formula: `fare = round(15 + distance_km * 12)`

### `POST /api/translate`
**Request body:**
```json
{ "text": "Where are you?", "target_lang": "kn" }
```
**Response:**
```json
{ "translated": "ನೀವು ಎಲ್ಲಿದ್ದೀರಿ?" }
```
If `GEMINI_API_KEY` isn't set, the endpoint returns the original text with a `warning` field instead of failing.

### `POST /api/sos`
**Response:**
```json
{ "status": "not_configured", "message": "SOS is under development. It needs an emergency contact number set up first." }
```

---

## 7. Setup & Installation

1. **Install dependencies:**
   ```bash
   pip install flask google-genai python-dotenv
   ```
2. **Configure the API key** — rename `.env.example` to `.env` and add:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no billing required.
3. **Run the app:**
   ```bash
   python app.py
   ```
4. Open `http://127.0.0.1:5000` in your browser.

---

## 8. Current Hosting & Deployment

The project runs as a **local/single-instance deployment**, appropriate for a classroom demo:
- One Flask development server process (`python app.py`), no worker pool, no process manager (gunicorn/uwsgi).
- Plain HTTP on localhost; no HTTPS, reverse proxy, or CDN.
- No scaling — assumes a small number of concurrent users.
- Secrets read from a local `.env` file at startup; excluded from version control.
- No persistence — refreshing the page or restarting the server clears all trip/chat state.

---

## 9. Proposed Cloud Architecture (AWS)

To move from demo to production, the design keeps the same logical components but adds authentication, a real database, caching, autoscaling compute, and observability.

| Business Need | AWS Service | Purpose |
|---|---|---|
| Static frontend hosting | S3 + CloudFront | Serves HTML/CSS/JS globally with edge caching + HTTPS |
| Backend API compute | ECS Fargate | Runs the containerized Flask app without managing servers |
| Request distribution | Application Load Balancer | Distributes traffic across Fargate tasks, health checks |
| Public API surface | API Gateway | Throttling, validation, stable contract for `/api` routes |
| Event-driven functions | AWS Lambda | Bursty translation/SOS workloads scale independently |
| User authentication | Amazon Cognito | Sign-up/sign-in, JWT issuance, MFA support |
| Relational data | Amazon RDS (PostgreSQL) | User profiles, ride records, ride history |
| High-write chat/GPS data | Amazon DynamoDB | Live chat messages, vehicle-position pings |
| Hot-path caching | Amazon ElastiCache (Redis) | Active trip state, fare lookups, rate limiting |
| Object storage | Amazon S3 | Trip receipts, logs, future driver documents |
| Secrets management | AWS Secrets Manager | Stores/rotates the Gemini API key and DB credentials |
| Monitoring | CloudWatch + X-Ray | Logs, metrics, alarms, distributed tracing |

**Cloud choice rationale (AWS vs Azure vs GCP):** ECS Fargate + API Gateway + Lambda cleanly covers the containerized-API-plus-event-driven-function pattern RideEase needs (steady booking/fare traffic plus bursty translation/SOS calls). DynamoDB is a strong fit for the highest-write, least-relational data (chat messages, GPS pings). Azure (App Service/AKS, Azure SQL, Cosmos DB, Azure AD B2C) and GCP (Cloud Run, Firestore) are both viable alternatives.

---

## 10. Scalability Plan: 1M and 5M Users

| Area | At ~1,000,000 users | At ~5,000,000 users |
|---|---|---|
| **Application** | Move to cloud host; run multiple Flask copies behind a load balancer (Gunicorn/Nginx); containerize with Docker; auto-scale with traffic | Split into microservices (Booking, Routing, Chat/Translation, Fare); offload heavy tasks to background workers (Celery + Redis/RabbitMQ); multi-region deployment |
| **Database** | Add managed PostgreSQL/MySQL with read replicas, indexes, and connection pooling | Partition/shard by region or user ID; separate DB per microservice; add NoSQL (MongoDB/DynamoDB) for chat & location data; automatic failover |
| **Storage** | Move to cloud object storage (S3/GCS/Blob), separate from app servers | Multi-region replication, storage tiering (cold storage for old data), CDN for static assets |
| **Network** | CDN for static files, HTTPS + HTTP/2, VPC for app/DB/cache | Multi-region servers, GeoDNS/global load balancing, dynamic bandwidth scaling |
| **Traffic management** | API rate limiting, API Gateway, request queueing for spikes | Traffic prioritization, circuit breakers for flaky external APIs, real-time auto-scaling |
| **Caching** | Redis for OSRM routes/fare calcs, cached common translations, browser/CDN caching | Distributed Redis cluster, edge caching, smart cache invalidation |
| **Load balancing** | Load balancer (Nginx/ALB) with health checks and round-robin/least-connections | Multi-level load balancing (region, server, service); sticky sessions only where needed (e.g. live chat) |
| **Security** | Real authentication (hashed passwords/OTP + JWT), enforced HTTPS, secrets manager, input validation | WAF, DDoS protection, role-based access control, regular security audits, SOS fully built with Twilio |
| **Monitoring** | Dashboards (Grafana/Prometheus), alerting, business metrics | Distributed tracing (Jaeger/OpenTelemetry), centralized logging (ELK), real-user monitoring |
| **Backup & recovery** | Automated daily DB backups, point-in-time recovery, tested restores | Multi-region backups, defined RPO/RTO, automatic regional failover |

**Estimated peak load:** ~5,000–8,000 req/min at 1M users; ~25,000–40,000 req/min at 5M users.

**What doesn't need to change:** Because the API tier becomes stateless (trip state lives in Redis/DynamoDB, not process memory) and the frontend is fully static/CDN-delivered, scaling at either milestone is a matter of adjusting autoscaling targets rather than re-architecting the app. The core product idea — real road routing, live translated chat, simple fare estimation — stays the same; only the infrastructure underneath grows.

**Rough monthly cost shape (USD, ap-south-1):**

| Stage | Rough total/month | Key drivers |
|---|---|---|
| Demo / low traffic | ~$40–70 | 1–2 small Fargate tasks; db.t3.micro + on-demand DynamoDB; small CDN/storage |
| ~1M users | ~$900–1,800 | 5–20 autoscaled tasks; Multi-AZ RDS + 1 read replica; CDN/storage |
| ~5M users | Higher, driven by | 50–150+ Fargate tasks at peak, read-replica fleet/sharding, multi-region deployment |

---

## 11. Known Limitations

- Fare formula is a simple flat rate, not tied to real-time demand or traffic.
- SOS is UI-only; it does not place a real call or send an SMS yet.
- No user accounts, login, or ride history — this is a single-session demo.
- Driver responses in chat are simulated (preset sample messages), not from a real driver.

## 12. Future Scope

- Wire up SOS with a real emergency contact and Twilio-based calling/SMS.
- Add user authentication and a ride history database.
- Real-time driver GPS tracking instead of a simulated vehicle marker.
- Execute the proposed AWS cloud migration (Section 9) as usage grows toward the 1M/5M user milestones (Section 10).
