# Business Logic / Algorithm — RideEase

## Fare Estimation Algorithm

### Problem Being Solved
When a rider books a ride, RideEase needs to calculate a fair, predictable fare before the trip begins, based on the actual road distance between pickup and drop locations — not a straight-line ("as the crow flies") distance, which would under- or overestimate real travel cost. This gives riders transparency and lets the app simulate a real ride-hailing pricing model.

### Input
- Pickup coordinates (latitude, longitude) — selected by the rider on the map
- Drop coordinates (latitude, longitude) — selected by the rider on the map
- Real road route distance (in kilometers), retrieved from the OSRM routing API based on the above coordinates

### Processing Logic
1. Rider selects pickup and drop points on the Leaflet.js map.
2. Frontend sends both coordinate pairs to the OSRM API, which returns the actual road route (polyline) and its total distance.
3. The route distance (in km) is passed to the fare calculation logic.
4. Fare is computed using a flat base fee plus a per-kilometer rate:
   - Base fare: ₹15
   - Rate per km: ₹12
   - `Fare = Base Fare + (Rate per km × Distance in km)`
5. The result is rounded to a sensible display value (e.g., nearest rupee) and shown to the rider before confirming the ride.

### Output
- A single estimated fare amount (in ₹), displayed to the rider on the booking screen prior to confirming the trip.


