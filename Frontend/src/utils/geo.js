/*
=========================================
GEO HELPERS (keyless, deterministic)
=========================================
Orders store pickup/delivery as free text, not coordinates. For live map
tracking we map each address string to a STABLE point around Bengaluru so the
same address always lands on the same spot (no paid geocoding API needed).
A real deployment would swap coordsFor() for a geocoding call.
=========================================
*/

// Bengaluru city center.
const CITY = { latitude: 12.9716, longitude: 77.5946 };

function hashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic lat/lng for an address string, spread ~6km around the city. */
export function coordsFor(text, salt = 0) {
  const h = hashString(String(text) + ":" + salt);
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.07;
  const dLng = ((Math.floor(h / 1000) % 1000) / 1000 - 0.5) * 0.07;
  return { latitude: CITY.latitude + dLat, longitude: CITY.longitude + dLng };
}

/** Linear interpolation between two coordinates (t = 0..1). */
export function interpolate(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * k,
    longitude: a.longitude + (b.longitude - a.longitude) * k,
  };
}

/** How far along the pickup -> delivery route a status implies (0..1). */
export function statusProgress(status) {
  switch (status) {
    case "Assigned":
      return 0.12;
    case "Picked Up":
      return 0.4;
    case "Out For Delivery":
      return 0.78;
    case "Delivered":
      return 1;
    default:
      return 0.02; // Placed
  }
}

/** Bearing in degrees from point a to point b (for orienting the rider icon). */
export function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
