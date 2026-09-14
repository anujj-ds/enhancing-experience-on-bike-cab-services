# How Fare & Routing Actually Work

RideEase's core academic contribution is **real road-based routing and fare estimation** — the fare is calculated from an actual driving route, not a straight-line ("as the crow flies") distance between two points. This document walks through exactly how that pipeline works, with a worked example.

---

## 1. Why This Matters

Most simple ride-fare demos calculate distance using the Haversine formula (straight-line distance between two GPS coordinates). This is fast but inaccurate — it ignores:
- One-way streets, road curvature, and detours
- Physical barriers (rivers, railway lines, gated layouts)
- Actual drivable paths a vehicle would take

RideEase instead sends both coordinates to a real routing engine (**OSRM**) and gets back the actual road path, so the distance — and therefore the fare — reflects what a rider would really be charged.

---

## 2. The Pipeline, Step by Step

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐     ┌───────────────┐
│  1. User taps │ --> │ 2. Browser    │ --> │ 3. OSRM returns   │ --> │ 4. Frontend    │
│  pickup+drop  │     │ calls OSRM    │     │ real road route   │     │ sends distance │
│  on map        │     │ directly      │     │ (GeoJSON path,    │     │ to Flask       │
│                │     │ (client-side) │     │ distance, time)   │     │ backend        │
└──────────────┘     └───────────────┘     └──────────────────┘     └───────┬───────┘
                                                                              │
                                                                              ▼
┌──────────────┐     ┌───────────────────────────────────────────────────────┐
│ 6. Fare shown │ <-- │ 5. Backend applies formula:                          │
│ + Confirm btn │     │ fare = round(₹15 base + ₹12 × distance_km)            │
│ enabled       │     └───────────────────────────────────────────────────────┘
└──────────────┘
```

### Step-by-step detail

1. **Pickup & drop selection** — Pickup comes from the browser's Geolocation API (or a manual point); drop is set by clicking on the Leaflet map (`onMapClick` in `script.js`).
2. **Routing request** — The frontend calls the public OSRM demo server directly:
   ```
   GET https://router.project-osrm.org/route/v1/driving/{drop_lng},{drop_lat};{pickup_lng},{pickup_lat}?overview=full&geometries=geojson
   ```
   This happens **client-side**, so no backend round-trip is needed just to get the route.
3. **OSRM response** — Returns a GeoJSON `LineString` (the actual road-following path, rendered as the route polyline), plus `distance` (meters) and `duration` (seconds).
4. **Fare request** — The frontend POSTs the real `distance_km` and `duration_min` to the Flask backend at `/api/estimate-fare`.
5. **Fare calculation (server-side)** — The backend, not the browser, computes the fare — this keeps the pricing logic centralized and tamper-resistant (a user editing frontend JS can't fake a lower fare):
   ```python
   fare = round(BASE_FARE + distance_km * RATE_PER_KM)
   # BASE_FARE = 15, RATE_PER_KM = 12
   ```
6. **Display** — The fare card updates with the amount and ETA, and "Confirm ride" becomes clickable.

---

## 3. Worked Example

Say a rider sets **pickup at Home** and **drop at College**, and OSRM returns a route that isn't a straight line — it follows actual streets, including a couple of turns to avoid a one-way road.

| Value | Straight-line (Haversine) | Real road route (OSRM) |
|---|---|---|
| Distance | ~3.1 km | **4.2 km** |
| Fare (₹15 + ₹12/km) | ₹52 | **₹65** |
| ETA | — | **11 min** |

**Why the difference matters:** the straight-line estimate would under-quote the rider by ₹13 on this trip — the real route is ~35% longer because of road layout. At scale, this gap compounds and would produce systematically wrong (too-low) fares, which is exactly what OSRM-based routing avoids.

**Fare formula reference:**
```
fare (₹) = round(15 + distance_km × 12)

Example: distance_km = 4.2
fare = round(15 + 4.2 × 12)
     = round(15 + 50.4)
     = round(65.4)
     = ₹65
```

---

## 4. What Happens When Things Go Wrong

| Failure | Behavior |
|---|---|
| OSRM request fails / times out | Frontend catches the error, shows *"Couldn't fetch a route right now — check your connection and try again."* No fare is calculated. |
| No route exists between points | OSRM returns an empty `routes` array; frontend throws and shows the same error message. |
| `/api/estimate-fare` called with missing `distance_km` | Backend returns `400 { "error": "distance_km is required" }`. |
| `duration_min` omitted | Backend estimates ETA as `distance_km × 1.5` minutes rather than failing. |

---

## 5. Key Design Decisions

- **Routing happens client-side, fare calculation happens server-side.** This splits responsibilities: OSRM (a public, keyless service) handles the geometry-heavy routing work in the browser, while the backend — the only place a "confirmed" fare should be decided — owns the pricing formula.
- **OSRM's public demo server** (`router.project-osrm.org`) is used because it's free and requires no API key, which fits an academic demo. Per OSRM's usage policy, it's **not intended for production traffic** — Section 9 of `PROJECT_IMPLEMENTATION.md` proposes self-hosting an OSRM instance (e.g., on ECS/EC2) as part of the AWS production migration.
- **Flat-rate formula, not dynamic pricing.** The current fare formula doesn't account for demand, traffic, or time-of-day surge — this is called out explicitly in the Known Limitations section, and is a natural extension point for future work.
