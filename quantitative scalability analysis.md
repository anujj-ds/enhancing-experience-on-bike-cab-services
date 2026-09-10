# Quantitative Scalability Analysis — RideEase

RideEase is a ride-hailing web app (Flask backend, OSRM routing, Gemini AI translation chat).
This analysis estimates how the system would need to scale in terms of users, concurrent load,
and backend request volume if it grew beyond its current single-session academic demo.

---

## 1. User Growth Projection (25% growth per year, starting at 10,000 users)

**Formula:**
Users(n) = Initial Users × (1 + Growth Rate)^n

Where:
- Initial Users = 10,000
- Growth Rate = 25% = 0.25
- n = number of years

---

### Year 1
- **Values:** 10,000 × (1.25)^1
- **Calculation:** 10,000 × 1.25 = 12,500
- **Result:** 12,500 users
- **Interpretation:** In Year 1, RideEase would grow from a small pilot base to about 12,500
  registered users. At this stage, the Flask single-server setup and free OSRM API would
  still comfortably handle the load.

### Year 2
- **Values:** 10,000 × (1.25)^2
- **Calculation:** 10,000 × 1.5625 = 15,625
- **Result:** 15,625 users
- **Interpretation:** Moderate growth. The app would still work fine without needing a
  database upgrade, but user accounts/login (currently missing) would become necessary.

### Year 3
- **Values:** 10,000 × (1.25)^3
- **Calculation:** 10,000 × 1.953125 = 19,531.25
- **Result:** ≈ 19,531 users
- **Interpretation:** Approaching 20,000 users. Gemini API usage for chat translation would
  start seeing real cost/rate-limit pressure since it's currently a free-tier key.

### Year 4
- **Values:** 10,000 × (1.25)^4
- **Calculation:** 10,000 × 2.44140625 = 24,414.0625
- **Result:** ≈ 24,414 users
- **Interpretation:** At this size, a single Flask instance without a database would
  become a bottleneck. A proper backend (with ride history DB) would be needed.

### Year 5
- **Values:** 10,000 × (1.25)^5
- **Calculation:** 10,000 × 3.0517578125 = 30,517.578125
- **Result:** ≈ 30,518 users
- **Interpretation:** RideEase would have tripled its user base in 5 years. This scale
  would require moving from a demo-style app to a production architecture: load
  balancing, database-backed accounts, and a paid Gemini API tier.

---

## 2. Peak Concurrent Users (10% of registered users active at peak)

**Formula:**
Peak Concurrent Users = Registered Users × 10%

---

### 100,000 registered users
- **Values:** 100,000 × 0.10
- **Calculation:** 100,000 × 0.10 = 10,000
- **Result:** 10,000 concurrent users
- **Interpretation:** 10,000 people booking rides / using the live map + chat at once.
  This is roughly the load a small VPS running Flask + OSRM could still struggle with
  if not containerized or scaled horizontally.

### 500,000 registered users
- **Values:** 500,000 × 0.10
- **Calculation:** 500,000 × 0.10 = 50,000
- **Result:** 50,000 concurrent users
- **Interpretation:** At this level, the self-hosted OSRM routing engine and Gemini
  translation calls would need caching and rate management to avoid failures during
  peak hours (e.g., office rush).

### 1,000,000 registered users
- **Values:** 1,000,000 × 0.10
- **Calculation:** 1,000,000 × 0.10 = 100,000
- **Result:** 100,000 concurrent users
- **Interpretation:** This is enterprise-level traffic. RideEase's current single-file
  Flask app (app.py) and no-login design would need a full rewrite with
  microservices, load balancers, and a managed database.

### 5,000,000 registered users
- **Values:** 5,000,000 × 0.10
- **Calculation:** 5,000,000 × 0.10 = 500,000
- **Result:** 500,000 concurrent users
- **Interpretation:** Comparable to a large-scale ride-hailing platform (similar to
  Rapido's real traffic). The academic-project architecture would be completely
  insufficient; this would require distributed servers, a message queue for ride
  matching, and dedicated infrastructure for map routing and AI chat.

---

## 3. Requests Per Minute & Per Second (5 requests/min per active user)

**Formula:**
Requests per Minute (RPM) = Active Users × 5
Requests per Second (RPS) = RPM ÷ 60

---

### 10,000 active users
- **Values:** RPM = 10,000 × 5; RPS = RPM ÷ 60
- **Calculation:** RPM = 50,000 | RPS = 50,000 ÷ 60 = 833.33
- **Result:** 50,000 requests/minute → ≈ 833 requests/second
- **Interpretation:** This includes map updates, fare estimate calls, and chat
  translation requests. A single Flask dev server (as used in this project)
  cannot handle this — it would need a production WSGI server (e.g., Gunicorn).

### 50,000 active users
- **Values:** RPM = 50,000 × 5; RPS = RPM ÷ 60
- **Calculation:** RPM = 250,000 | RPS = 250,000 ÷ 60 = 4,166.67
- **Result:** 250,000 requests/minute → ≈ 4,167 requests/second
- **Interpretation:** The free OSRM public instance and Gemini free-tier API key
  would both hit rate limits well before this point. Self-hosted OSRM and a paid
  Gemini plan would be mandatory.

### 100,000 active users
- **Values:** RPM = 100,000 × 5; RPS = RPM ÷ 60
- **Calculation:** RPM = 500,000 | RPS = 500,000 ÷ 60 = 8,333.33
- **Result:** 500,000 requests/minute → ≈ 8,333 requests/second
- **Interpretation:** This request rate needs horizontal scaling — multiple backend
  instances behind a load balancer, plus caching of repeated route calculations
  to reduce OSRM load.

### 500,000 active users
- **Values:** RPM = 500,000 × 5; RPS = RPM ÷ 60
- **Calculation:** RPM = 2,500,000 | RPS = 2,500,000 ÷ 60 = 41,666.67
- **Result:** 2,500,000 requests/minute → ≈ 41,667 requests/second
- **Interpretation:** This is data-center scale traffic. RideEase in its current
  form (no login, no DB, single Flask file) is designed only as a proof-of-concept
  and would need a complete production redesign — separate services for routing,
  chat/translation, and fare calculation, each independently scalable.

---

## Summary

| Metric | Key Takeaway |
|---|---|
| User Growth | 10,000 → 30,518 users over 5 years at 25% annual growth |
| Peak Concurrency | 10% of registered users active at once — scales linearly with registrations |
| Request Load | 5 req/min/user means even moderate concurrency creates thousands of requests/second |

**Overall Interpretation:** RideEase is currently a single-session academic demo with
no database, no authentication, and free-tier APIs (OSRM public server, Gemini free key).
The calculations above show that even modest real-world growth (100,000+ users) would
demand a production-grade backend: a real database for ride history and accounts,
a paid/self-hosted routing engine, rate-limited and cached AI translation calls and
horizontal scaling via a proper WSGI server and load balancer.
