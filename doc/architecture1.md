# =====================================================================
# TITLE PAGE
# =====================================================================
for _ in range(6):
	doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("RideEase")
r.bold = True
r.font.size = Pt(40)
r.font.color.rgb = NAVY
p.paragraph_format.space_after = Pt(10)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("A Ride-Hailing Web App with Real Road Routing & AI Chat Translation")
r.font.size = Pt(15)
r.font.color.rgb = GREY
p.paragraph_format.space_after = Pt(6)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("System Architecture & Implementation Report")
r.font.size = Pt(15)
r.font.color.rgb = GREY
p.paragraph_format.space_after = Pt(24)

hr()
doc.add_paragraph().paragraph_format.space_after = Pt(10)

data_table(
	["Field", "Detail"],
	[
		["Project type", "Academic project (concept / working demo build)"],
		["Inspiration", "Rapido-style ride-hailing UX"],
		["Core stack", "Python 3 + Flask backend, HTML/CSS/JavaScript + Leaflet.js frontend"],
		["Key integrations", "OSRM (road routing), Google Gemini API - gemini-3.5-flash (chat translation)"],
		["Report covers", "Business problem, tech stack, architecture, data flow, implementation "
						   "details, current hosting, proposed AWS cloud architecture, and scaling to "
						   "1M / 5M users"],
	],
	[4.0, 11.0],
)

doc.add_paragraph().paragraph_format.space_after = Pt(20)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run(
	"Prepared as part of an academic coursework submission. Sections 6-7 describe a proposed "
	"future-state cloud deployment; the current build runs as a local/single-instance demo."
)
r.italic = True
r.font.size = Pt(9)
r.font.color.rgb = GREY

add_page_break()

# =====================================================================
# TABLE OF CONTENTS (manual, dot-leader)
# =====================================================================
h1("Table of Contents")
hr()

toc_entries = [
	("1. Business Problem and Target Users", "3"),
	("2. Technology Stack", "3"),
	("3. Current System Architecture", "5"),
	("4. Data Flow Between Major Components", "8"),
	("5. Current Hosting and Deployment Approach", "10"),
	("6. Proposed Cloud Deployment Architecture (AWS)", "11"),
	("7. Scalability Analysis: 1 Million and 5 Million Users", "13"),
	("8. Implementation Details", "15"),
	("9. Known Limitations and Future Scope", "17"),
]
for title, pg in toc_entries:
	p = doc.add_paragraph()
	p.paragraph_format.space_after = Pt(10)
	p.paragraph_format.tab_stops.add_tab_stop(Cm(17.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
	r = p.add_run(title)
	r.font.size = Pt(11)
	r.font.color.rgb = TEXT
	r2 = p.add_run(f"\t{pg}")
	r2.font.size = Pt(11)
	r2.font.color.rgb = TEXT
	pPr = p._p.get_or_add_pPr()
	pBdr = OxmlElement("w:pBdr")
	bottom = OxmlElement("w:bottom")
	bottom.set(qn("w:val"), "single")
	bottom.set(qn("w:sz"), "3")
	bottom.set(qn("w:space"), "4")
	bottom.set(qn("w:color"), "E5E7EB")
	pBdr.append(bottom)
	pPr.append(pBdr)

add_page_break()

# =====================================================================
# 1. BUSINESS PROBLEM
# =====================================================================
h1("1. Business Problem and Target Users")
hr()
h2("1.1 Problem Statement")
body(
	"Commuters in Indian cities frequently rely on two-wheeler and auto-rickshaw ride-hailing for "
	"short, affordable trips. Two everyday frictions motivate this project: (1) riders and drivers "
	"often do not share a common language, which slows down coordination on pickup points and "
	"directions, and (2) riders want a clear, upfront sense of the road route and fare before "
	"committing to a trip, rather than a straight-line estimate that ignores real streets and turns. "
	"RideEase is an academic prototype that explores how a lightweight web application could address "
	"both problems: real road-based routing for trip planning and fare estimation, plus an AI-powered "
	"translation layer so rider and driver can chat comfortably in their own languages."
)
h2("1.2 Target Users")
bullet_rich([("Riders", True), (" — commuters booking short intra-city trips who want a quick, "
			 "accurate fare estimate based on an actual road route, and who may prefer to "
			 "communicate in a regional language.", False)])
bullet_rich([("Drivers", True), (" — represented in this prototype via a simulated driver engine "
			 "(a vehicle marker placed along the route, preset Kannada reply phrases sent through "
			 "the same translation pipeline), standing in for a real driver-side app in a future "
			 "iteration.", False)])
bullet_rich([("Evaluators / instructors", True), (" — the immediate audience for this academic "
			 "build, interested in seeing a working demonstration of real-route mapping, "
			 "transparent fare logic, and applied use of a generative-AI API in a practical UX "
			 "flow.", False)])
h2("1.3 Why This Matters (Scope of the Demo)")
body(
	"As an academic project, RideEase intentionally keeps scope narrow: it proves out the two "
	"hardest user-facing problems (real routing + cross-language chat) end-to-end, while explicitly "
	"stubbing out production concerns like payments, accounts, and emergency response, rather than "
	"leaving them half-built. This makes the limitation explicit rather than silently broken, and "
	"forms the basis for the proposed cloud architecture and future scope discussed later in this "
	"report."
)

# =====================================================================
# 2. TECH STACK
# =====================================================================
h1("2. Technology Stack")
hr()
body("The current build uses a minimal, dependency-light stack appropriate for a single-developer "
	 "academic project, while still integrating two real external APIs.")
data_table(
	["Layer", "Technology", "Purpose"],
	[
		["Frontend", "HTML / CSS / JavaScript", "Structure, styling, interactivity"],
		["Frontend", "Leaflet.js", "Interactive map rendering, markers, route polyline"],
		["Backend", "Python 3 + Flask", "Web server and REST API (app.py)"],
		["Backend", "python-dotenv", "Loads API keys from a local .env file (GEMINI_API_KEY)"],
		["Backend", "google-genai SDK", "Calls the Gemini API for translation from the server side"],
		["External API", "OSRM (Open Source Routing Machine)", "Free road-routing engine, no API key required"],
		["External API", "Google Gemini API (gemini-3.5-flash)", "Language detection and translation"],
	],
	[3.0, 6.0, 6.0],
)
h2("2.1 Why These Choices")
bullet_rich([("Leaflet + OSRM", True), (" — both are free and require no API key, making them ideal "
			 "for an academic build; OSRM's public routing endpoint returns real driving routes (as "
			 "GeoJSON) rather than straight-line distances.", False)])
bullet_rich([("Flask", True), (" — a lightweight Python micro-framework, quick to stand up a handful "
			 "of JSON API routes (fare estimate, translation, SOS stub) without the overhead of a "
			 "full framework.", False)])
bullet_rich([("Gemini API", True), (" — chosen for its strong multilingual translation quality and "
			 "simple SDK interface; a single prompt asks it to both detect the source language and "
			 "translate into the selected target language, avoiding a separate detection step.", False)])
bullet_rich([("python-dotenv", True), (" — keeps the Gemini API key out of source control by loading "
			 "it from a local .env file (GEMINI_API_KEY) at process startup.", False)])

add_page_break()

# =====================================================================
# 3. CURRENT SYSTEM ARCHITECTURE
# =====================================================================
h1("3. Current System Architecture")
hr()
h2("3.1 Overview")
body(
	"RideEase follows a simple two-tier web architecture: a Python Flask backend that serves the "
	"application and exposes a small set of JSON APIs, and a browser-based frontend (HTML, CSS, and "
	"vanilla JavaScript) that handles all user interaction, map rendering, and state management. Two "
	"external services are integrated for the features that need real-world data: OSRM for road "
	"routing and Google's Gemini API for AI-powered translation."
)
h2("3.2 High-Level Component Table")
data_table(
	["Layer", "Component", "Responsibility"],
	[
		["Frontend", "Booking panel", "Collects pickup/drop, displays fare, confirms ride"],
		["Frontend", "Map panel (Leaflet.js)", "Renders map, markers, route line, vehicle position"],
		["Frontend", "Chat modal", "Sends/receives messages, displays translations"],
		["Frontend", "SOS modal", "Placeholder UI for the emergency feature"],
		["Backend", "Flask app (app.py)", "Serves pages, exposes REST endpoints"],
		["Backend", "/api/estimate-fare", "Calculates fare from route distance/duration"],
		["Backend", "/api/translate", "Calls Gemini API, returns translated text"],
		["Backend", "/api/sos", "Stub endpoint for the future SOS flow"],
		["External", "OSRM routing service", "Returns real road-route geometry, distance, duration"],
		["External", "Google Gemini API", "Detects language and translates chat messages"],
	],
	[2.0, 5.5, 7.5],
)
figure(os.path.join(BASE_DIR, "01_current_architecture.png"))
caption("Figure 3.1 — Current system architecture: browser client, Flask backend (with its three "
		"real endpoint names), and the two external APIs it calls. No auth or persistent storage "
		"exists yet.")
h2("3.3 Frontend")
body(
	"Delivered as static assets (templates/index.html, static/style.css, static/script.js — styled "
	"with an ivory-and-maroon theme) rendered by Flask's template engine and executed in the rider's "
	"browser. A single Leaflet map instance persists across both the booking and tracking views, "
	"avoiding the cost of re-initializing the map. The frontend owns three concerns: the booking "
	"panel (pickup/drop, fare display, ride confirmation), the map panel (markers, route polyline, "
	"vehicle position), and the chat modal (sending messages and rendering translations)."
)
h2("3.4 Backend / API")
body("A single Flask application (app.py) exposes three JSON API routes consumed by the frontend's "
	 "fetch() calls:")
bullet_rich([("/api/estimate-fare", False), (" — accepts route distance and duration, applies the "
			 "fare formula, and returns fare and ETA as JSON.", False)])
bullet_rich([("/api/translate", False), (" — accepts raw chat text and a target language code, "
			 "calls the Gemini API server-side, and returns the translated text.", False)])
bullet_rich([("/api/sos", False), (" — a stub endpoint for the future emergency-contact flow; "
			 "currently returns/represents the 'not yet configured' state shown in the UI.", False)])
body("The server is stateless between requests — nothing is written to disk.")
h2("3.5 Authentication")
body(
	"There is no authentication in the current build. This is a deliberate simplification for a "
	"single-session academic demo: any visitor can open the page and start a simulated ride "
	"immediately, with no login, signup, or identity check."
)
h2("3.6 Database")
body(
	"None. All trip state (pickup/drop points, computed route, fare, chat history) lives only in "
	"browser memory (JavaScript variables/DOM) for the duration of the page session and in the Flask "
	"request/response cycle — nothing persists once the tab is closed or the server restarts."
)
h2("3.7 Storage")
body(
	"The only 'storage' artifact is the local .env file holding the Gemini API key (GEMINI_API_KEY) "
	"on the developer's machine; it is excluded from version control and is not accessible to end "
	"users."
)
h2("3.8 External Services")
bullet_rich([("OSRM", True), (" — called directly from the browser (no API key needed, no sensitive "
			 "credentials to protect) to translate a pickup/drop pair into an actual road-network "
			 "route: geometry, distance, and duration, returned as GeoJSON.", False)])
bullet_rich([("Google Gemini API", True), (" — called by the backend (keeping the API key private, "
			 "server-side only) to detect the language of a chat message and translate it into the "
			 "selected target language.", False)])
h2("3.9 Why This Architecture")
bullet("Keeping the Gemini API key on the backend (rather than in frontend JavaScript) avoids "
	   "exposing it publicly.")
bullet("OSRM is called directly from the browser since it requires no API key and has no sensitive "
	   "credentials to protect.")
bullet("Fare calculation lives on the backend so the pricing logic is centralized and not editable "
	   "by tampering with client-side code.")
bullet("The SOS and payment flows are deliberately stubbed rather than half-built, so the "
	   "limitation is explicit rather than silently broken.")

add_page_break()

# =====================================================================
# 4. DATA FLOW
# =====================================================================
h1("4. Data Flow Between Major Components")
hr()
body(
	"Two request flows run independently within a single ride session — booking a ride, and chat "
	"translation — plus a set of simulated trip events layered on top once a ride is confirmed. All "
	"flows originate from and return to the browser; the Flask backend acts purely as a calculation "
	"and translation-proxy layer, without persisting anything between requests."
)
figure(os.path.join(BASE_DIR, "02_data_flow.png"))
caption("Figure 4.1 — Sequence of calls across the rider's browser, the frontend JS, the Flask "
		"backend, and the two external APIs, for each flow.")
h2("4.1 Request Flow — Booking a Ride")
bullet("User's browser loads the page; JavaScript initializes a Leaflet map centered on their GPS "
	   "location (via the browser Geolocation API), or a default city center as fallback.")
bullet("User clicks a point on the map to set the drop location.")
bullet("The frontend sends both coordinates to the public OSRM routing API directly from the "
	   "browser, which returns the actual road path (as GeoJSON), distance, and estimated duration.")
bullet("The frontend POSTs the distance and duration to the Flask backend's /api/estimate-fare "
	   "endpoint.")
bullet("The backend applies the fare formula (₹15 base fare + ₹12/km) and returns the fare and "
	   "ETA as JSON.")
bullet("The frontend updates the fare card and enables the 'Confirm ride' button.")
h2("4.2 Request Flow — Chat Translation")
bullet("User types a message and selects a target language from the dropdown.")
bullet("The frontend POSTs the raw text and target language code to /api/translate.")
bullet("The Flask backend builds a prompt instructing Gemini to detect the source language and "
	   "translate into the target language, then calls the Gemini API server-side (keeping the API "
	   "key private).")
bullet("The translated text is returned as JSON and rendered beneath the original message bubble.")
h2("4.3 Simulated Trip Events")
body(
	"Once a ride is confirmed, a vehicle marker is placed along the returned route path at roughly "
	"30% of the distance to simulate an in-progress ride. A timer automatically triggers a simulated "
	"route deviation a few seconds later, moving the marker off the planned route and showing a "
	"warning banner; a manual 'Simulate deviation' button can also trigger this on demand "
	"during a demo. Clicking SOS opens a modal explaining that an emergency contact number must be "
	"configured first, rather than calling any backend route."
)

add_page_break()

# =====================================================================
# 5. HOSTING
# =====================================================================
h1("5. Current Hosting and Deployment Approach")
hr()
body("The project currently runs as a local/single-instance deployment appropriate for an academic "
	 "demo or classroom presentation rather than public production traffic.")
bullet_rich([("Runtime", True), (" — a single Flask development server process (python app.py), run "
			 "either on the developer's laptop or a single low-cost VM for demo purposes.", False)])
bullet_rich([("Process model", True), (" — one process, no worker pool, no process manager (e.g. "
			 "gunicorn/uwsgi) or supervisor configured in this version.", False)])
bullet_rich([("Networking", True), (" — served over plain HTTP on localhost (or a single exposed "
			 "port); no HTTPS/TLS, reverse proxy, or CDN in front of it.", False)])
bullet_rich([("Scaling", True), (" — none; the app assumes a small number of concurrent users (a "
			 "classroom demo, not public traffic) and holds all trip state in the browser and in "
			 "transient request scope.", False)])
bullet_rich([("Secrets", True), (" — the Gemini API key is read from a local .env file (via "
			 "python-dotenv) at process startup; it is never sent to the client and is excluded "
			 "from version control (.gitignore).", False)])
bullet_rich([("Persistence", True), (" — none; restarting the server or refreshing the page clears "
			 "all in-progress trip/chat state, since there is no database.", False)])
body("This hosting approach is intentionally minimal and matches the project's scope as a "
	 "functional concept demo. Section 6 proposes how this would evolve into a production-capable "
	 "cloud deployment.")

add_page_break()

# =====================================================================
# 6. PROPOSED CLOUD ARCHITECTURE
# =====================================================================
h1("6. Proposed Cloud Deployment Architecture (AWS)")
hr()
body(
	"To move RideEase from an academic demo to a production-capable service, this section proposes "
	"a deployment on Amazon Web Services (AWS). The design keeps the same logical components "
	"(frontend, backend/API, external routing and translation calls) but adds the pieces the "
	"current build deliberately omits: authentication, a real database, caching, autoscaling "
	"compute, and observability."
)
figure(os.path.join(BASE_DIR, "03_aws_proposed_architecture.png"))
caption("Figure 6.1 — Proposed AWS architecture: CDN-fronted static frontend, an autoscaling "
		"containerized Flask API behind a load balancer, managed auth, cache, relational and NoSQL "
		"data stores, and async notification handling.")
h2("6.1 Frontend Delivery")
bullet_rich([("Static frontend assets (HTML/CSS/JS, Leaflet bundle) are built and uploaded to an ", False),
			 ("Amazon S3", True), (" bucket configured for static website hosting.", False)])
bullet_rich([("Amazon CloudFront", True), (" serves as the CDN in front of S3, providing global "
			 "edge caching, HTTPS termination (via ", False), ("AWS Certificate Manager", True),
			 ("), and basic protection via ", False), ("AWS WAF", True), (".", False)])
bullet_rich([("Route 53", True), (" handles DNS for the application's domain and can support "
			 "blue/green or multi-region routing as traffic grows.", False)])
h2("6.2 Backend / API Layer")
bullet_rich([("The Flask application is containerized (Docker) and run on ", False),
			 ("Amazon ECS with Fargate", True), (" (or optionally EKS), removing the need to manage "
			 "servers directly and enabling horizontal autoscaling of API instances across multiple "
			 "Availability Zones.", False)])
bullet_rich([("An ", False), ("Application Load Balancer (ALB)", True), (" distributes incoming "
			 "requests across running tasks and performs health checks, replacing containers that "
			 "fail.", False)])
bullet_rich([("Amazon API Gateway", True), (" sits in front of the ALB/backend for the public REST "
			 "surface (/api/estimate-fare, /api/translate, /api/sos), adding request throttling, "
			 "validation, and a stable API contract.", False)])
bullet_rich([("Lightweight, stateless operations behind each of those three endpoints can "
			 "additionally run as ", False), ("AWS Lambda", True), (" functions for cost-efficient, "
			 "event-driven scaling independent of the main container fleet.", False)])
h2("6.3 Authentication")
body(
	"Amazon Cognito provides user sign-up/sign-in, issues JWT tokens for API calls, and can support "
	"MFA — replacing the current build's lack of accounts entirely, and enabling the future 'user "
	"accounts and ride history' feature from Section 9."
)
h2("6.4 Database and Storage")
bullet_rich([("Amazon RDS (PostgreSQL, Multi-AZ)", True), (" stores relational data: user profiles, "
			 "ride records, and ride history.", False)])
bullet_rich([("Amazon DynamoDB", True), (" stores high-write, loosely structured data such as live "
			 "chat messages and vehicle-marker/GPS pings, which benefit from DynamoDB's horizontal "
			 "scalability without manual sharding.", False)])
bullet_rich([("Amazon ElastiCache (Redis)", True), (" caches frequent reads (fare lookups, active "
			 "trip state, rate-limiting counters) to reduce load on RDS/DynamoDB and speed up "
			 "response times.", False)])
bullet_rich([("Amazon S3", True), (" stores durable objects such as trip receipts, logs, and (in "
			 "future scope) driver verification documents.", False)])
h2("6.5 External Services")
bullet_rich([("OSRM", True), (" continues to provide routing; at scale, RideEase would run its own "
			 "OSRM instance(s) behind an internal load balancer (self-hosted, using OpenStreetMap "
			 "extracts) rather than relying solely on the public endpoint, for reliability and "
			 "rate-limit control.", False)])
bullet_rich([("Google Gemini API", True), (" continues to provide chat translation "
			 "(gemini-3.5-flash), called from the backend/Lambda layer with the API key secured in ",
			 False), ("AWS Secrets Manager", True), (" rather than a local .env file.", False)])
bullet_rich([("Amazon SNS / Pinpoint", True), (" (paired with a provider such as Twilio) would "
			 "deliver the real SOS SMS/voice alerts described in the Future Scope, once the "
			 "emergency-contact flow is built.", False)])
h2("6.6 Observability and Security")
bullet_rich([("Amazon CloudWatch", True), (" collects logs, metrics, and alarms across all "
			 "services; ", False), ("AWS X-Ray", True), (" provides distributed tracing across API "
			 "Gateway, Lambda, and the containerized backend.", False)])
bullet_rich([("AWS Secrets Manager", True), (" centrally stores and rotates the Gemini API key and "
			 "database credentials, removing secrets from source control and local files entirely.",
			 False)])
bullet("All public traffic terminates TLS at CloudFront/ALB; internal service-to-service traffic "
	   "stays within a VPC with private subnets for the database and cache layers.")

add_page_break()

# =====================================================================
# 7. SCALABILITY
# =====================================================================
h1("7. Scalability Analysis: 1 Million and 5 Million Users")
hr()
body(
	"The proposed architecture is designed so that most components scale horizontally by adding "
	"capacity rather than requiring a redesign. The figure below summarizes how each tier evolves "
	"from the current demo, to roughly 1 million users, to roughly 5 million users."
)
figure(os.path.join(BASE_DIR, "04_scaling_diagram.png"))
caption("Figure 7.1 — Scaling path across three stages, with the key infrastructure changes and "
		"estimated peak request volume at each stage.")
h2("7.1 Scaling to ~1 Million Users")
bullet_rich([("Compute", True), (" — ECS Fargate service scales from a handful of tasks to roughly "
			 "5-20 tasks based on CPU/memory and request-count-per-target autoscaling policies, "
			 "spread across 2-3 Availability Zones behind the ALB.", False)])
bullet_rich([("Database", True), (" — a single Multi-AZ RDS instance with one read replica handles "
			 "relational reads/writes (user profiles, ride records); DynamoDB independently absorbs "
			 "the higher write volume from chat and vehicle-position pings.", False)])
bullet_rich([("Caching & CDN", True), (" — ElastiCache (Redis) caches hot reads (active trip state, "
			 "recent fare calculations); CloudFront caches static assets and map tiles at the edge, "
			 "cutting origin load and improving latency for geographically distributed riders.", False)])
bullet_rich([("Auth", True), (" — Cognito user pools handle authentication without added backend "
			 "load, since token verification is largely offloaded to managed infrastructure.", False)])
bullet_rich([("Estimated peak load", True), (" — on the order of 5,000-8,000 requests/minute at "
			 "typical usage patterns for a ride-hailing app of this size (bursty around commute "
			 "hours), comfortably handled by the autoscaled Fargate + ALB tier.", False)])
h2("7.2 Scaling to ~5 Million Users")
bullet_rich([("Compute", True), (" — the Fargate service scales further (roughly 50-150+ tasks "
			 "during peaks), with autoscaling tuned on both CPU and ALB request-count targets; "
			 "Lambda absorbs bursty, independent workloads (translation calls, SOS webhook "
			 "processing) via SQS queues so spikes do not block the main /api path.", False)])
bullet_rich([("Database", True), (" — RDS moves to a read-replica fleet, and relational data can be "
			 "partitioned/sharded by city or region if a single primary becomes a write bottleneck; "
			 "DynamoDB continues to scale near-linearly for chat and location data without manual "
			 "intervention.", False)])
bullet_rich([("Routing engine", True), (" — RideEase would run a dedicated, horizontally scaled "
			 "OSRM cluster behind its own internal load balancer (rather than depending on the "
			 "public OSRM endpoint), since routing requests grow proportionally with active riders.",
			 False)])
bullet_rich([("Multi-region", True), (" — an active-passive (or active-active) deployment across "
			 "two AWS regions, with Route 53 latency-based routing and cross-region replication for "
			 "RDS and DynamoDB, improves both latency for distant users and resilience against a "
			 "single-region outage.", False)])
bullet_rich([("Estimated peak load", True), (" — on the order of 25,000-40,000 requests/minute at "
			 "peak, requiring the async/queue-based patterns above so that translation-API latency "
			 "or SOS-notification delivery never blocks core booking and routing requests.", False)])
h2("7.3 What Does Not Need to Change")
body(
	"Because the API tier is stateless (session/trip state lives in Redis/DynamoDB rather than in "
	"process memory), scaling the backend at either milestone is a matter of adjusting autoscaling "
	"targets rather than re-architecting the application. Similarly, because the frontend is fully "
	"static and CDN-delivered, frontend scaling requires no additional engineering work at either "
	"user count."
)

add_page_break()

# =====================================================================
# 8. IMPLEMENTATION DETAILS
# =====================================================================
h1("8. Implementation Details")
hr()
h2("8.1 Project Structure")
code_block([
	"rideease/",
	"├── app.py                 # Flask backend",
	"├── .env                   # API keys (GEMINI_API_KEY)",
	"├── templates/",
	"│   └── index.html         # Main page",
	"└── static/",
	"    ├── style.css          # Styling (ivory + maroon theme)",
	"    └── script.js          # Map, routing, chat, and UI logic",
])
h2("8.2 Map & Routing")
bullet("A single Leaflet map instance persists across both the booking and tracking views, "
	   "avoiding the cost of re-initializing the map.")
bullet("Pickup is set via the browser Geolocation API; drop is set by clicking anywhere on the map.")
bullet("The route is fetched from OSRM's public routing endpoint using the coordinates of both "
	   "points, returned as a GeoJSON path which is drawn as a polyline — this shows the real road "
	   "route rather than a straight line.")
bullet("Once a ride is confirmed, a vehicle marker is placed along the returned route path (at "
	   "roughly 30% of the distance) to simulate an in-progress ride.")
h2("8.3 Fare Calculation")
bullet("Formula: fare = ₹15 base fare + ₹12 × distance in kilometers.")
bullet("Distance and duration come from the real OSRM route, not a straight-line estimate, so the "
	   "fare reflects actual road distance.")
h2("8.4 AI Translation Chat")
bullet("Implemented using Google's Gemini API (model: gemini-3.5-flash) called from the Flask "
	   "backend.")
bullet("A single prompt asks Gemini to both detect the source language and translate into the "
	   "selected target language, removing the need for a separate language-detection step.")
bullet("The frontend displays the original message and the translated text together, so both "
	   "parties can verify meaning wasn't lost.")
bullet("A 'Simulate driver reply' button sends preset Kannada phrases through the same "
	   "pipeline to demonstrate two-way translation without a live second user.")
h2("8.5 Route Deviation Alert")
bullet("A timer automatically triggers a simulated deviation a few seconds after a ride is "
	   "confirmed, moving the vehicle marker off the planned route and showing a warning banner.")
bullet("A manual 'Simulate deviation' button is also available to trigger this on demand "
	   "during a demo.")
h2("8.6 SOS Button")
bullet("Present in the UI as required, but intentionally not functional yet.")
bullet("Clicking it opens a modal explaining that an emergency contact number must be configured "
	   "first — this is a conscious scope decision, not an oversight.")
h2("8.7 Payment")
bullet("Cash-only for this version; UPI integration was scoped out since it requires a payment "
	   "gateway integration beyond this project's timeline.")

add_page_break()

# =====================================================================
# 9. LIMITATIONS & FUTURE SCOPE
# =====================================================================
h1("9. Known Limitations and Future Scope")
hr()
h2("9.1 Known Limitations")
bullet("Fare is a flat per-km rate (₹15 base + ₹12/km) — no surge pricing or "
	   "traffic-based adjustment.")
bullet("SOS does not place a real call or send an SMS.")
bullet("No user authentication, accounts, or ride history — the app is a single-session demo.")
bullet("Driver replies in chat are simulated, not from a real second user or driver app.")
bullet("No database or persistent storage of any kind; all state is lost when the browser tab is "
	   "closed.")
bullet("No HTTPS, load balancing, or redundancy in the current hosting setup.")
h2("9.2 Future Scope")
bullet("Wire up SOS with a real emergency contact and Twilio-based (or Amazon SNS/Pinpoint) "
	   "calling/SMS, as proposed in Section 6.")
bullet("Add user authentication (e.g. Amazon Cognito) and persist ride history in a database "
	   "(Amazon RDS).")
bullet("Replace the simulated vehicle marker with real-time driver GPS tracking, streamed via "
	   "WebSockets and stored in DynamoDB for low-latency reads.")
bullet("Add UPI/payment gateway integration.")
bullet("Introduce dynamic fare pricing informed by real-time demand/traffic signals, rather than "
	   "the current flat per-km rate.")
bullet("Move from a single public OSRM endpoint to a self-hosted, horizontally scaled OSRM cluster "
	   "to support production-level routing volume.")

doc.add_paragraph().paragraph_format.space_before = Pt(16)
hr()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("End of report.")
r.italic = True
r.font.size = Pt(9)
r.font.color.rgb = GREY

# ---------------------------------------------------------------- header/footer --
add_header_footer()

doc.save(OUT_PATH)
print(f"Document created: {OUT_PATH}")

