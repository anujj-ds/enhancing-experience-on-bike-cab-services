# RideEase — Validation & Test Cases

This document records the manual validation performed on RideEase's core features: what was tested, the steps to reproduce, and the expected vs. actual outcome. It's intended to demonstrate correctness for academic evaluation, since the project does not (yet) have an automated test suite.

---

## 1. Routing & Fare Estimation

| ID | Test case | Steps | Expected result | Status |
|---|---|---|---|---|
| R-01 | Basic route between two nearby points | Set pickup via GPS, click a drop point ~2-5 km away | Route polyline follows actual roads (not a straight line); fare card appears | ✅ Pass |
| R-02 | Fare formula correctness | Given `distance_km = 4.2` | `fare = round(15 + 4.2×12) = 65` | ✅ Pass |
| R-03 | No pickup set | Click only a drop point, no GPS/pickup | Status message: *"Set your pickup location too (tap the GPS icon)."* No fare requested | ✅ Pass |
| R-04 | OSRM request fails (offline/network cut) | Disable network, click a drop point after pickup is set | Status message: *"Couldn't fetch a route right now — check your connection and try again."* | ✅ Pass |
| R-05 | Missing `distance_km` in fare request | POST `{}` to `/api/estimate-fare` | `400` response, `{"error": "distance_km is required"}` | ✅ Pass |
| R-06 | `duration_min` omitted | POST `{"distance_km": 5}` (no duration) | ETA estimated as `distance_km × 1.5` instead of failing | ✅ Pass |
| R-07 | Confirm button state | Before route is set / after route is set | Disabled with "Set pickup & drop to continue" → enabled with "Confirm ride · ₹XX" | ✅ Pass |

---

## 2. Chat Translation

| ID | Test case | Steps | Expected result | Status |
|---|---|---|---|---|
| T-01 | English → Kannada translation | Open chat, type "Where are you?", target = Kannada | Translated bubble shows Kannada text under the original | ✅ Pass |
| T-02 | Language auto-detection | Type a message in Hindi, target = English | Gemini detects Hindi and translates to English correctly | ✅ Pass |
| T-03 | Missing `GEMINI_API_KEY` | Unset `.env`, send a chat message | Response returns original text unchanged + toast warning: *"GEMINI_API_KEY is not set in .env..."* | ✅ Pass |
| T-04 | Empty message | Click send with an empty input | No request sent (frontend guards on empty `trim()`) | ✅ Pass |
| T-05 | Simulated driver reply | Click "Simulate driver reply" with target = Kannada | A preset Kannada phrase appears as a received bubble, translated to English | ✅ Pass |
| T-06 | `/api/translate` with no text field | POST `{"target_lang": "kn"}` | `400` response, `{"error": "No text provided"}` | ✅ Pass |

---

## 3. Trip Simulation

| ID | Test case | Steps | Expected result | Status |
|---|---|---|---|---|
| S-01 | Ride confirmation | Click "Confirm ride" after a valid route/fare | Booking card hides, trip card shows with driver info, vehicle marker placed ~30% along the route | ✅ Pass |
| S-02 | Auto route-deviation alert | Wait ~9 seconds after confirming | Vehicle marker nudges off-route, deviation banner appears automatically | ✅ Pass |
| S-03 | Manual deviation trigger (dev mode) | On `localhost`, click "Simulate deviation" button | Same effect as S-02, triggered immediately | ✅ Pass |
| S-04 | Deviation banner dismiss | Click the × on the deviation banner | Banner hides; underlying trip state unaffected | ✅ Pass |
| S-05 | Back to booking | Click "Back to booking" from the trip card | Map resets, all markers/route cleared, inputs cleared, confirm button disabled again | ✅ Pass |

---

## 4. SOS (Stub Feature)

| ID | Test case | Steps | Expected result | Status |
|---|---|---|---|---|
| SOS-01 | Open SOS modal | Click the SOS button on the trip card | Modal opens explaining the feature is under development; input/button are disabled | ✅ Pass |
| SOS-02 | `/api/sos` endpoint | POST to `/api/sos` | Returns `{"status": "not_configured", "message": "SOS is under development..."}` | ✅ Pass |
| SOS-03 | Close SOS modal | Click × on the modal | Modal closes without side effects | ✅ Pass |

---

## 5. Navigation Stubs

| ID | Test case | Steps | Expected result | Status |
|---|---|---|---|---|
| N-01 | Unimplemented nav links | Click "Home", "My Rides", "Support", menu icon, or profile icon | Toast: *"This section isn't built yet in the demo."* — no navigation occurs, no error thrown | ✅ Pass |

---

## 6. Validation Method & Limitations

- **Method:** All cases above were validated **manually**, by running the app locally (`python app.py`) and exercising each flow in-browser, plus direct API calls (via browser devtools / curl) for the backend edge cases (missing fields, no API key).
- **No automated test suite yet.** This is a known gap — see `PROJECT_IMPLEMENTATION.md` Section 12 (Future Scope) for the plan to add one (e.g., `pytest` for backend routes, a lightweight JS test runner for frontend logic).
- **Environment tested:** Local Flask dev server on `127.0.0.1:5000`, Chrome desktop, with a live `GEMINI_API_KEY` for translation cases and the key temporarily unset to validate the fallback path (T-03).
- **Out of scope for this validation pass:** Load/performance testing (covered separately in `scalabilityanalysis.md`), and cross-browser/mobile testing.
