/**
 * Google Maps dark style tuned to the app canvas (#0a0e16).
 *
 * Road names and key place labels ARE shown — riders want to read which
 * road the bus is on and recognise nearby landmarks, the same way they
 * would on Google Maps. We keep the restraint where it counts: POI marker
 * ICONS stay off (so the map isn't littered with coloured pins), but the
 * text labels for roads, transit and major places are visible in a muted
 * slate that sits quietly under the bright bus marker + route line.
 */
export const MAP_STYLE_DARK = [
  { elementType: "geometry", stylers: [{ color: "#0a0e16" }] },
  // Keep coloured POI/business marker icons off — they're the noisy part.
  // (Road shields and transit-station glyphs are re-enabled below.)
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
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
  // Show place NAMES (parks, schools, landmarks) but not their coloured
  // icons, so the map reads like a labelled street map without clutter.
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c8aa0" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0d1a14" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#111722" }],
  },
  // Road NAME labels on — this is the headline change riders asked for.
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9aa7bd" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#070a11" }],
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
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c2cde0" }],
  },
  // Transit stations visible (with their glyph) so riders can orient by
  // landmarks like rail/bus stations.
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a97ad" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#070a11" }],
  },
] as const;
