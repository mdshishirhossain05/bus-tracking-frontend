/**
 * Google Maps dark style tuned to the app canvas (#0a0e16). POIs/transit
 * labels are suppressed so the only saturated things on the map are the bus
 * marker and the route line — the restraint that reads as "high-end".
 */
export const MAP_STYLE_DARK = [
  { elementType: "geometry", stylers: [{ color: "#0a0e16" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0e16" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1a2230" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#111722" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#19212e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#222c3c" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#070a11" }],
  },
] as const;
