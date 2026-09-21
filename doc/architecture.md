
RideEase
A Ride-Hailing Web App with Real Road Routing & AI Chat Translation
System Architecture & Implementation Report

Field	Detail
Project type	Academic project (concept / working demo build)
Inspiration	Rapido-style ride-hailing UX
Core stack	Python 3 + Flask backend, HTML/CSS/JavaScript + Leaflet.js frontend
Key integrations	OSRM (road routing), Google Gemini API — gemini-3.5-flash (chat translation)
Report covers	Business problem, tech stack, architecture, data flow, implementation details, current hosting, proposed AWS cloud architecture, and scaling to 1M / 5M users

Prepared as part of an academic coursework submission. Sections 7-8 describe a proposed future-state cloud deployment; the current build runs as a local/single-instance demo.
 
Table of Contents

1. Business Problem and Target Users	3
2. Technology Stack	3
3. Current System Architecture	5
4. Data Flow Between Major Components	8
5. Current Hosting and Deployment Approach	10
6. Proposed Cloud Deployment Architecture (AWS)	11
7. Scalability Analysis: 1 Million and 5 Million Users	15
8. Implementation Details	17
9. Known Limitations and Future Scope	19
 
1. Business Problem and Target Users

1.1 Problem Statement
Commuters in Indian cities frequently rely on two-wheeler and auto-rickshaw ride-hailing for short, affordable trips. Two everyday frictions motivate this project: (1) riders and drivers often do not share a common language, which slows down coordination on pickup points and directions, and (2) riders want a clear, upfront sense of the road route and fare before committing to a trip, rather than a straight-line estimate that ignores real streets and turns. RideEase is an academic prototype that explores how a lightweight web application could address both problems: real road-based routing for trip planning and fare estimation, plus an AI-powered translation layer so rider and driver can chat comfortably in their own languages.
1.2 Target Users
●	Riders — commuters booking short intra-city trips who want a quick, accurate fare estimate based on an actual road route, and who may prefer to communicate in a regional language.
●	Drivers — represented in this prototype via a simulated driver engine (a vehicle marker placed along the route, preset Kannada reply phrases sent through the same translation pipeline), standing in for a real driver-side app in a future iteration.
●	Evaluators / instructors — the immediate audience for this academic build, interested in seeing a working demonstration of real-route mapping, transparent fare logic, and applied use of a generative-AI API in a practical UX flow.
1.3 Why This Matters (Scope of the Demo)
As an academic project, RideEase intentionally keeps scope narrow: it proves out the two hardest user-facing problems (real routing + cross-language chat) end-to-end, while explicitly stubbing out production concerns like payments, accounts, and emergency response, rather than leaving them half-built. This makes the limitation explicit rather than silently broken, and forms the basis for the proposed cloud architecture and future scope discussed later in this report.
1.4 Business Requirements
●	Accurate, upfront pricing — riders must see a fare based on real road distance before confirming a ride, not a straight-line estimate.
●	Cross-language communication — riders and drivers who do not share a language must be able to coordinate pickup details without a translator.
●	Trip transparency — the rider must be able to see the planned route, ETA, and driver/vehicle details once a ride is confirmed.
●	A visible safety mechanism — an SOS control must be reachable from the active-ride screen at all times, even if the underlying calling/SMS integration is a later milestone.
●	Low-cost demonstrability — the system must run end-to-end on free-tier or no-cost external services (OSRM, a free-tier Gemini key) so it can be evaluated without incurring billing.
●	A scaling path — the architecture must be able to grow from a single-instance demo to production traffic without a ground-up redesign.
2. Technology Stack

The current build uses a minimal, dependency-light stack appropriate for a single-developer academic project, while still integrating two real external APIs.
Layer	Technology	Purpose
Frontend	HTML / CSS / JavaScript	Structure, styling, interactivity
Frontend	Leaflet.js	Interactive map rendering, markers, route polyline
Backend	Python 3 + Flask	Web server and REST API (app.py)
Backend	python-dotenv	Loads API keys from a local .env file (GEMINI_API_KEY)
Backend	google-genai SDK	Calls the Gemini API for translation from the server side
External API	OSRM (Open Source Routing Machine)	Free road-routing engine, no API key required
External API	Google Gemini API (gemini-3.5-flash)	Language detection and translation

2.1 Why These Choices
●	Leaflet + OSRM — both are free and require no API key, making them ideal for an academic build; OSRM's public routing endpoint returns real driving routes (as GeoJSON) rather than straight-line distances.
●	Flask — a lightweight Python micro-framework, quick to stand up a handful of JSON API routes (fare estimate, translation, SOS stub) without the overhead of a full framework.
●	Gemini API — chosen for its strong multilingual translation quality and simple SDK interface; a single prompt asks it to both detect the source language and translate into the selected target language, avoiding a separate detection step.
●	python-dotenv — keeps the Gemini API key out of source control by loading it from a local .env file at process startup.
 
3. Current System Architecture

3.1 Overview
RideEase follows a simple two-tier web architecture: a Python Flask backend that serves the application and exposes a small set of JSON APIs, and a browser-based frontend (HTML, CSS, and vanilla JavaScript) that handles all user interaction, map rendering, and state management. Two external services are integrated for the features that need real-world data: OSRM for road routing and Google's Gemini API for AI-powered translation.
3.2 High-Level Component Table
Layer	Component	Responsibility
Frontend	Booking panel	Collects pickup/drop, displays fare, confirms ride
Frontend	Map panel (Leaflet.js)	Renders map, markers, route line, vehicle position
Frontend	Chat modal	Sends/receives messages, displays translations
Frontend	SOS modal	Placeholder UI for the emergency feature
Backend	Flask app (app.py)	Serves pages, exposes REST endpoints
Backend	/api/estimate-fare	Calculates fare from route distance/duration
Backend	/api/translate	Calls Gemini API, returns translated text
Backend	/api/sos	Stub endpoint for the future SOS flow
External	OSRM routing service	Returns real road-route geometry, distance, duration
External	Google Gemini API	Detects language and translates chat messages

 
Figure 3.1 — Current system architecture: browser client, Flask backend (with its three real endpoint names), and the two external APIs it calls. No auth or persistent storage exists yet.
3.3 Frontend
Delivered as static assets (templates/index.html, static/style.css, static/script.js — styled with an ivory-and-maroon theme) rendered by Flask's template engine and executed in the rider's browser. A single Leaflet map instance persists across both the booking and tracking views, avoiding the cost of re-initializing the map. The frontend owns three concerns: the booking panel (pickup/drop, fare display, ride confirmation), the map panel (markers, route polyline, vehicle position), and the chat modal (sending messages and rendering translations).
3.4 Backend / API
A single Flask application (app.py) exposes three JSON API routes consumed by the frontend's fetch() calls:
●	/api/estimate-fare — accepts route distance and duration, applies the fare formula, and returns fare and ETA as JSON.
●	/api/translate — accepts raw chat text and a target language code, calls the Gemini API server-side, and returns the translated text.
●	/api/sos — a stub endpoint for the future emergency-contact flow; currently returns/represents the “not yet configured” state shown in the UI.
The server is stateless between requests — nothing is written to disk.
3.5 Authentication
There is no authentication in the current build. This is a deliberate simplification for a single-session academic demo: any visitor can open the page and start a simulated ride immediately, with no login, signup, or identity check.
3.6 Database
None. All trip state (pickup/drop points, computed route, fare, chat history) lives only in browser memory (JavaScript variables/DOM) for the duration of the page session and in the Flask request/response cycle — nothing persists once the tab is closed or the server restarts.
3.7 Storage
The only 'storage' artifact is the local .env file holding the Gemini API key (GEMINI_API_KEY) on the developer's machine; it is excluded from version control and is not accessible to end users.
3.8 External Services
●	OSRM — called directly from the browser (no API key needed, no sensitive credentials to protect) to translate a pickup/drop pair into an actual road-network route: geometry, distance, and duration, returned as GeoJSON.
●	Google Gemini API — called by the backend (keeping the API key private, server-side only) to detect the language of a chat message and translate it into the selected target language.
3.9 Why This Architecture
●	Keeping the Gemini API key on the backend (rather than in frontend JavaScript) avoids exposing it publicly.
●	OSRM is called directly from the browser since it requires no API key and has no sensitive credentials to protect.
●	Fare calculation lives on the backend so the pricing logic is centralized and not editable by tampering with client-side code.
●	The SOS and payment flows are deliberately stubbed rather than half-built, so the limitation is explicit rather than silently broken.
 
4. Data Flow Between Major Components

Two request flows run independently within a single ride session — booking a ride, and chat translation — plus a set of simulated trip events layered on top once a ride is confirmed. All flows originate from and return to the browser; the Flask backend acts purely as a calculation and translation-proxy layer, without persisting anything between requests.
 
Figure 4.1 — Sequence of calls across the rider's browser, the frontend JS, the Flask backend, and the two external APIs, for each flow.
4.1 Request Flow — Booking a Ride
●	User's browser loads the page; JavaScript initializes a Leaflet map centered on their GPS location (via the browser Geolocation API), or a default city center as fallback.
●	User clicks a point on the map to set the drop location.
●	The frontend sends both coordinates to the public OSRM routing API directly from the browser, which returns the actual road path (as GeoJSON), distance, and estimated duration.
●	The frontend POSTs the distance and duration to the Flask backend's /api/estimate-fare endpoint.
●	The backend applies the fare formula (₹15 base + ₹12/km) and returns the fare and ETA as JSON.
●	The frontend updates the fare card and enables the “Confirm ride” button.
4.2 Request Flow — Chat Translation
●	User types a message and selects a target language from the dropdown.
●	The frontend POSTs the raw text and target language code to /api/translate.
●	The Flask backend builds a prompt instructing Gemini to detect the source language and translate into the target language, then calls the Gemini API server-side (keeping the API key private).
●	The translated text is returned as JSON and rendered beneath the original message bubble.
4.3 Simulated Trip Events
Once a ride is confirmed, a vehicle marker is placed along the returned route path at roughly 30% of the distance to simulate an in-progress ride. A timer automatically triggers a simulated route deviation a few seconds later, moving the marker off the planned route and showing a warning banner; a manual “Simulate deviation” button can also trigger this on demand during a demo. Clicking SOS opens a modal explaining that an emergency contact number must be configured first, rather than calling any backend route.
 
5. Current Hosting and Deployment Approach

The project currently runs as a local/single-instance deployment appropriate for an academic demo or classroom presentation rather than public production traffic.
●	Runtime — a single Flask development server process (python app.py), run either on the developer's laptop or a single low-cost VM for demo purposes.
●	Process model — one process, no worker pool, no process manager (e.g. gunicorn/uwsgi) or supervisor configured in this version.
●	Networking — served over plain HTTP on localhost (or a single exposed port); no HTTPS/TLS, reverse proxy, or CDN in front of it.
●	Scaling — none; the app assumes a small number of concurrent users (a classroom demo, not public traffic) and holds all trip state in the browser and in transient request scope.
●	Secrets — the Gemini API key is read from a local .env file (via python-dotenv) at process startup; it is never sent to the client and is excluded from version control (.gitignore).
●	Persistence — none; restarting the server or refreshing the page clears all in-progress trip/chat state, since there is no database.
This hosting approach is intentionally minimal and matches the project's scope as a functional concept demo. Section 6 proposes how this would evolve into a production-capable cloud deployment.
 
6. Proposed Cloud Deployment Architecture (AWS)

To move RideEase from an academic demo to a production-capable service, this section proposes a deployment on Amazon Web Services (AWS). The design keeps the same logical components (frontend, backend/API, external routing and translation calls) but adds the pieces the current build deliberately omits: authentication, a real database, caching, autoscaling compute, and observability.
 
Figure 6.1 — Proposed AWS architecture: CDN-fronted static frontend, an autoscaling containerized Flask API behind a load balancer, managed auth, cache, relational and NoSQL data stores, and async notification handling.
6.1 Frontend Delivery
●	Static frontend assets (HTML/CSS/JS, Leaflet bundle) are built and uploaded to an Amazon S3 bucket configured for static website hosting.
●	Amazon CloudFront serves as the CDN in front of S3, providing global edge caching, HTTPS termination (via AWS Certificate Manager), and basic protection via AWS WAF.
●	Route 53 handles DNS for the application's domain and can support blue/green or multi-region routing as traffic grows.
6.2 Backend / API Layer
●	The Flask application is containerized (Docker) and run on Amazon ECS with Fargate (or optionally EKS), removing the need to manage servers directly and enabling horizontal autoscaling of API instances across multiple Availability Zones.
●	An Application Load Balancer (ALB) distributes incoming requests across running tasks and performs health checks, replacing containers that fail.
●	Amazon API Gateway sits in front of the ALB/backend for the public REST surface (/api/estimate-fare, /api/translate, /api/sos), adding request throttling, validation, and a stable API contract.
●	Lightweight, stateless operations behind each of those three endpoints can additionally run as AWS Lambda functions for cost-efficient, event-driven scaling independent of the main container fleet.
6.3 Authentication
Amazon Cognito provides user sign-up/sign-in, issues JWT tokens for API calls, and can support MFA — replacing the current build's lack of accounts entirely, and enabling the future 'user accounts and ride history' feature from Section 8.
6.4 Database and Storage
●	Amazon RDS (PostgreSQL, Multi-AZ) stores relational data: user profiles, ride records, and ride history.
●	Amazon DynamoDB stores high-write, loosely structured data such as live chat messages and vehicle-marker/GPS pings, which benefit from DynamoDB's horizontal scalability without manual sharding.
●	Amazon ElastiCache (Redis) caches frequent reads (fare lookups, active trip state, rate-limiting counters) to reduce load on RDS/DynamoDB and speed up response times.
●	Amazon S3 stores durable objects such as trip receipts, logs, and (in future scope) driver verification documents.
6.5 External Services
●	OSRM continues to provide routing; at scale, RideEase would run its own OSRM instance(s) behind an internal load balancer (self-hosted, using OpenStreetMap extracts) rather than relying solely on the public endpoint, for reliability and rate-limit control.
●	Google Gemini API continues to provide chat translation (gemini-3.5-flash), called from the backend/Lambda layer with the API key secured in AWS Secrets Manager rather than a local .env file.
●	Amazon SNS / Pinpoint (paired with a provider such as Twilio) would deliver the real SOS SMS/voice alerts described in the Future Scope, once the emergency-contact flow is built.
6.6 Observability and Security
●	Amazon CloudWatch collects logs, metrics, and alarms across all services; AWS X-Ray provides distributed tracing across API Gateway, Lambda, and the containerized backend.
●	AWS Secrets Manager centrally stores and rotates the Gemini API key and database credentials, removing secrets from source control and local files entirely.
●	All public traffic terminates TLS at CloudFront/ALB; internal service-to-service traffic stays within a VPC with private subnets for the database and cache layers.
6.7 Cloud Platform Justification (AWS vs Azure vs GCP)
All three major providers could host RideEase; AWS was chosen for three practical reasons. First, ecosystem maturity for exactly this shape of workload: ECS Fargate, API Gateway, and Lambda together cover the containerized-API-plus-event-driven-function pattern RideEase needs (steady booking/fare traffic plus bursty translation and SOS calls) without stitching together less-integrated services. Second, DynamoDB is a strong fit for the two highest-write, least-relational data types in this system — live chat messages and vehicle-position pings — and has no directly equivalent, equally mature managed NoSQL option on the other two platforms at this consistency/latency profile. Third, cost predictability at student-project scale: S3 + CloudFront + Fargate's pay-per-use pricing keeps a low-traffic deployment inexpensive, while still scaling cleanly to the 1M/5M-user figures modeled in Section 7.
●	Azure would be a reasonable alternative — Azure App Service or AKS, Azure SQL, Cosmos DB, and Azure AD B2C map onto the same components — and could suit a team already standardized on Microsoft tooling.
●	Google Cloud is also viable, particularly Cloud Run and Firebase for a faster initial build; it was not chosen here mainly because DynamoDB's access patterns (single-digit-millisecond reads on partition key, no manual sharding) fit the chat/GPS-ping workload slightly better than Firestore's document model at the write volumes modeled for 5 million users.
6.8 Networking Components
●	VPC layout — a dedicated Virtual Private Cloud spans 2-3 Availability Zones, with public subnets holding only the ALB/NAT gateways and private subnets holding the Fargate tasks, RDS, DynamoDB endpoints, and ElastiCache — nothing stateful is directly internet-addressable.
●	Security Groups — act as stateful virtual firewalls scoped per tier (ALB, Fargate service, RDS, Redis), each only accepting traffic from the specific security group one layer above it, rather than from an IP range.
●	AWS WAF — attached to CloudFront/ALB to filter common web exploits (SQL injection, XSS) and rate-limit abusive clients before they reach the application layer.
●	NAT Gateway — lets private-subnet resources (Fargate tasks) reach the internet for outbound calls (OSRM, Gemini API) without being reachable from it.
●	VPC Endpoints — (Gateway endpoint for S3, Interface endpoints for Secrets Manager/DynamoDB) keep AWS-internal traffic off the public internet entirely, reducing both latency and exposure.
6.9 Security Components
●	IAM roles — each compute component (Fargate task, individual Lambda functions) runs under its own least-privilege IAM role scoped to only the resources it touches (e.g. the translation Lambda can read the Gemini secret but has no S3 or RDS permissions), rather than one broad shared role.
●	Encryption at rest — RDS, DynamoDB, and S3 all use default AWS-managed (or customer-managed KMS) encryption at rest, so stored ride records, chat logs, and receipts are encrypted on disk.
●	Encryption in transit — TLS 1.2+ terminates at CloudFront/ALB for all public traffic; internal service-to-service calls stay inside the VPC.
●	Multi-factor authentication — Cognito user pools support MFA (SMS or authenticator app) at sign-in, which would be enabled for rider/driver accounts once authentication is built out per the Future Scope.
●	Backup and disaster recovery — RDS uses automated daily snapshots plus point-in-time recovery (restorable to any point within the retention window); DynamoDB point-in-time recovery covers chat/GPS data; S3 objects (receipts, logs) replicate cross-region. Target recovery objectives for a system at this scale would be an RPO of a few minutes and an RTO under an hour for a single-AZ failure, achieved by the Multi-AZ RDS standby and multi-AZ Fargate/ALB deployment already in the design.
6.10 Cloud Service Mapping Table
The table below maps each business/system need to the specific AWS service that fulfills it, as required for the cloud-service-mapping deliverable.
Business Need	AWS Service	Purpose
Static frontend hosting	S3 + CloudFront	Serves HTML/CSS/JS globally with edge caching and HTTPS
Backend API compute	ECS Fargate	Runs the containerized Flask app without managing servers
Request distribution	Application Load Balancer	Distributes traffic across Fargate tasks, health checks
Public API surface	API Gateway	Throttling, validation, stable contract for /api routes
Event-driven functions	AWS Lambda	Bursty translation/SOS workloads scale independently
User authentication	Amazon Cognito	Sign-up/sign-in, JWT issuance, MFA support
Relational data	Amazon RDS (PostgreSQL)	User profiles, ride records, ride history
High-write chat/GPS data	Amazon DynamoDB	Live chat messages, vehicle-position pings
Hot-path caching	Amazon ElastiCache (Redis)	Active trip state, fare lookups, rate limiting
Object storage	Amazon S3	Trip receipts, logs, future driver documents
Secrets management	AWS Secrets Manager	Stores/rotates the Gemini API key and DB credentials
Monitoring	CloudWatch + X-Ray	Logs, metrics, alarms, distributed tracing
Table 6.1 — Business need to AWS service mapping for the proposed RideEase deployment.
 
7. Scalability Analysis: 1 Million and 5 Million Users

The proposed architecture is designed so that most components scale horizontally by adding capacity rather than requiring a redesign. The figure below summarizes how each tier evolves from the current demo, to roughly 1 million users, to roughly 5 million users.
 
Figure 7.1 — Scaling path across three stages, with the key infrastructure changes and estimated peak request volume at each stage.
7.1 Scaling to ~1 Million Users
●	Compute — ECS Fargate service scales from a handful of tasks to roughly 5-20 tasks based on CPU/memory and request-count-per-target autoscaling policies, spread across 2-3 Availability Zones behind the ALB.
●	Database — a single Multi-AZ RDS instance with one read replica handles relational reads/writes (user profiles, ride records); DynamoDB independently absorbs the higher write volume from chat and vehicle-position pings.
●	Caching & CDN — ElastiCache (Redis) caches hot reads (active trip state, recent fare calculations); CloudFront caches static assets and map tiles at the edge, cutting origin load and improving latency for geographically distributed riders.
●	Auth — Cognito user pools handle authentication without added backend load, since token verification is largely offloaded to managed infrastructure.
●	Estimated peak load — on the order of 5,000-8,000 requests/minute at typical usage patterns for a ride-hailing app of this size (bursty around commute hours), comfortably handled by the autoscaled Fargate + ALB tier.
7.2 Scaling to ~5 Million Users
●	Compute — the Fargate service scales further (roughly 50-150+ tasks during peaks), with autoscaling tuned on both CPU and ALB request-count targets; Lambda absorbs bursty, independent workloads (translation calls, SOS webhook processing) via SQS queues so spikes do not block the main /api path.
●	Database — RDS moves to a read-replica fleet, and relational data can be partitioned/sharded by city or region if a single primary becomes a write bottleneck; DynamoDB continues to scale near-linearly for chat and location data without manual intervention.
●	Routing engine — RideEase would run a dedicated, horizontally scaled OSRM cluster behind its own internal load balancer (rather than depending on the public OSRM endpoint), since routing requests grow proportionally with active riders.
●	Multi-region — an active-passive (or active-active) deployment across two AWS regions, with Route 53 latency-based routing and cross-region replication for RDS and DynamoDB, improves both latency for distant users and resilience against a single-region outage.
●	Estimated peak load — on the order of 25,000-40,000 requests/minute at peak, requiring the async/queue-based patterns above so that translation-API latency or SOS-notification delivery never blocks core booking and routing requests.
7.3 What Does Not Need to Change
Because the API tier is stateless (session/trip state lives in Redis/DynamoDB rather than in process memory), scaling the backend at either milestone is a matter of adjusting autoscaling targets rather than re-architecting the application. Similarly, because the frontend is fully static and CDN-delivered, frontend scaling requires no additional engineering work at either user count.
7.4 Cost Considerations
Costs below are rough monthly estimates (USD, on-demand pricing, ap-south-1 region) meant to show the shape of the cost curve rather than a precise bill — actual spend depends on traffic patterns, Reserved/Savings Plan discounts, and data-transfer volume.
Stage	Rough total / month	Key drivers
Demo / low traffic	~$40-70	Compute ~$15-30 (1-2 small Fargate tasks); DB ~$15-25 (db.t3.micro + on-demand DynamoDB); CDN/storage ~$5
~1M users	~$900-1,800	Compute ~$400-900 (5-20 autoscaled tasks); DB ~$300-600 (Multi-AZ RDS + 1 read replica); CDN/storage ~$80-150
~5M users	~$6,000-13,000	Compute ~$3,000-7,000 (50-150+ tasks at peak); DB ~$2,000-4,000 (replica fleet, higher DynamoDB throughput); CDN/storage ~$500-1,000
Table 7.1 — Estimated monthly AWS infrastructure cost by growth stage. The Gemini API and OSRM are billed/used separately: Gemini's free tier covers low-volume academic use, and a self-hosted OSRM cluster at the 5M-user stage would add roughly $200-500/month in EC2 costs not shown above, replacing the free public endpoint.
Performance optimization at each stage relies on the caching and CDN layers already in the architecture rather than added services: ElastiCache absorbs repeat fare/trip-state reads, CloudFront absorbs repeat static-asset and map-tile requests, and DynamoDB's on-demand or auto-scaled throughput mode avoids paying for idle capacity during off-peak hours.
8. Implementation Details

8.1 Project Structure
rideease/
├── app.py                 # Flask backend
├── .env                   # API keys (GEMINI_API_KEY)
├── templates/
│   └── index.html         # Main page
└── static/
    ├── style.css          # Styling (ivory + maroon theme)
    └── script.js          # Map, routing, chat, and UI logic
8.2 Map & Routing
●	A single Leaflet map instance persists across both the booking and tracking views, avoiding the cost of re-initializing the map.
●	Pickup is set via the browser Geolocation API; drop is set by clicking anywhere on the map.
●	The route is fetched from OSRM's public routing endpoint using the coordinates of both points, returned as a GeoJSON path which is drawn as a polyline — this shows the real road route rather than a straight line.
●	Once a ride is confirmed, a vehicle marker is placed along the returned route path (at roughly 30% of the distance) to simulate an in-progress ride.
8.3 Fare Calculation
●	Formula: fare = ₹15 base fare + ₹12 × distance in kilometers.
●	Distance and duration come from the real OSRM route, not a straight-line estimate, so the fare reflects actual road distance.
8.4 AI Translation Chat
●	Implemented using Google's Gemini API (model: gemini-3.5-flash) called from the Flask backend.
●	A single prompt asks Gemini to both detect the source language and translate into the selected target language, removing the need for a separate language-detection step.
●	The frontend displays the original message and the translated text together, so both parties can verify meaning wasn't lost.
●	A “Simulate driver reply” button sends preset Kannada phrases through the same pipeline to demonstrate two-way translation without a live second user.
8.5 Route Deviation Alert
●	A timer automatically triggers a simulated deviation a few seconds after a ride is confirmed, moving the vehicle marker off the planned route and showing a warning banner.
●	A manual “Simulate deviation” button is also available to trigger this on demand during a demo.
8.6 SOS Button
●	Present in the UI as required, but intentionally not functional yet.
●	Clicking it opens a modal explaining that an emergency contact number must be configured first — this is a conscious scope decision, not an oversight.
8.7 Payment
●	Cash-only for this version; UPI integration was scoped out since it requires a payment gateway integration beyond this project's timeline.
 
9. Known Limitations and Future Scope

9.1 Known Limitations
●	Fare is a flat per-km rate (₹15 base + ₹12/km) — no surge pricing or traffic-based adjustment.
●	SOS does not place a real call or send an SMS.
●	No user authentication, accounts, or ride history — the app is a single-session demo.
●	Driver replies in chat are simulated, not from a real second user or driver app.
●	No database or persistent storage of any kind; all state is lost when the browser tab is closed.
●	No HTTPS, load balancing, or redundancy in the current hosting setup.
9.2 Future Scope
●	Wire up SOS with a real emergency contact and Twilio-based (or Amazon SNS/Pinpoint) calling/SMS, as proposed in Section 6.
●	Add user authentication (e.g. Amazon Cognito) and persist ride history in a database (Amazon RDS).
●	Replace the simulated vehicle marker with real-time driver GPS tracking, streamed via WebSockets and stored in DynamoDB for low-latency reads.
●	Add UPI/payment gateway integration.
●	Introduce dynamic fare pricing informed by real-time demand/traffic signals, rather than the current flat per-km rate.
●	Move from a single public OSRM endpoint to a self-hosted, horizontally scaled OSRM cluster to support production-level routing volume.


End of report.

