import React, { useMemo, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/*
=========================================
LiveMap — real street map with a live rider marker
=========================================
Renders an interactive OpenStreetMap (via Leaflet) inside a WebView. No API
key required. Shows a pickup marker, a delivery marker, the route between them,
and a rider marker that is moved in real time via injectJavaScript() whenever
the `rider` prop changes (fed by Socket.IO location events upstream).

To switch to Google Maps later: drop in `react-native-maps` with PROVIDER_GOOGLE
and an API key — the props (pickup/delivery/rider) stay the same.
=========================================
*/

function buildHtml(pickup, delivery, rider) {
  const start = rider || pickup;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8eef3; }
  .emoji { font-size: 26px; line-height: 26px; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.35); }
  .pin   { font-size: 24px; line-height: 24px; text-align: center; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var pickup   = [${pickup.latitude}, ${pickup.longitude}];
  var delivery = [${delivery.latitude}, ${delivery.longitude}];
  var rider    = [${start.latitude}, ${start.longitude}];

  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView(rider, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  function icon(html, cls) { return L.divIcon({ className: '', html: '<div class="' + (cls||'emoji') + '">' + html + '</div>', iconSize: [28,28], iconAnchor: [14,14] }); }

  L.marker(pickup,   { icon: icon('🏪','pin') }).addTo(map).bindPopup('Pickup');
  L.marker(delivery, { icon: icon('🏁','pin') }).addTo(map).bindPopup('Drop-off');
  L.polyline([pickup, delivery], { color: '#FF6B00', weight: 4, opacity: 0.65, dashArray: '8,8' }).addTo(map);

  var riderMarker = L.marker(rider, { icon: icon('🛵') }).addTo(map);

  try { map.fitBounds(L.latLngBounds([pickup, delivery, rider]).pad(0.35)); } catch (e) {}

  // Smoothly slide the rider marker to a new position.
  window.updateRider = function (lat, lng) {
    var to = L.latLng(lat, lng);
    riderMarker.setLatLng(to);
    map.panTo(to, { animate: true, duration: 0.5 });
  };
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage('map-ready');
</script>
</body>
</html>`;
}

export default function LiveMap({ pickup, delivery, rider, style }) {
  const ref = useRef(null);

  // Build the page once for a given pickup/delivery; rider moves via injection.
  const html = useMemo(
    () => buildHtml(pickup, delivery, rider),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pickup.latitude, pickup.longitude, delivery.latitude, delivery.longitude]
  );

  useEffect(() => {
    if (rider && ref.current) {
      ref.current.injectJavaScript(
        `window.updateRider && window.updateRider(${rider.latitude}, ${rider.longitude}); true;`
      );
    }
  }, [rider?.latitude, rider?.longitude]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  web: { flex: 1, backgroundColor: "transparent" },
});
