/**
 * Shared venue map data — Points of Interest and Zone layouts.
 *
 * Centralised here to avoid duplication between the /map/:venueId and /pois
 * endpoints in navigation routes.
 */

/** Static map zone definitions for the venue SVG overlay. */
export const MAP_ZONES = [
  { id: "Z-ENTRY", name: "Main Entrance",    x: 35, y: 85, width: 30, height: 10, type: "transit",  color: "#3b82f6" },
  { id: "Z-North", name: "North Stand",      x: 10, y: 5,  width: 80, height: 20, type: "seating",  color: "#6366f1" },
  { id: "Z-South", name: "South Stand",      x: 10, y: 70, width: 80, height: 20, type: "seating",  color: "#6366f1" },
  { id: "Z-East",  name: "East Wing",        x: 75, y: 30, width: 20, height: 35, type: "standing", color: "#8b5cf6" },
  { id: "Z-West",  name: "West Wing",        x: 5,  y: 30, width: 20, height: 35, type: "standing", color: "#8b5cf6" },
  { id: "Z-MAIN",  name: "Main Arena Floor", x: 30, y: 30, width: 40, height: 35, type: "floor",    color: "#14b8a6" },
  { id: "Z-VIP",   name: "VIP Lounge",       x: 75, y: 5,  width: 20, height: 20, type: "vip",      color: "#f59e0b" },
  { id: "Z-FOOD",  name: "Food Court",       x: 5,  y: 5,  width: 20, height: 20, type: "amenity",  color: "#10b981" },
];

/** Points of Interest used by both map and POI list endpoints. */
export const POIS = [
  { id: "poi-1",  name: "Main Entrance",      type: "entrance", zone: "Z-ENTRY", x: 50, y: 90, accessible: true  },
  { id: "poi-2",  name: "Emergency Exit A",    type: "exit",     zone: "Z-North", x: 15, y: 10, accessible: true  },
  { id: "poi-3",  name: "Emergency Exit B",    type: "exit",     zone: "Z-South", x: 85, y: 75, accessible: true  },
  { id: "poi-4",  name: "Restrooms (Level 1)", type: "restroom", zone: "Z-West",  x: 12, y: 45, accessible: true  },
  { id: "poi-5",  name: "Restrooms (Level 2)", type: "restroom", zone: "Z-East",  x: 88, y: 45, accessible: false },
  { id: "poi-6",  name: "Food Court",          type: "food",     zone: "Z-FOOD",  x: 15, y: 12, accessible: true  },
  { id: "poi-7",  name: "Medical Station",     type: "medical",  zone: "Z-ENTRY", x: 30, y: 88, accessible: true  },
  { id: "poi-8",  name: "Info Desk",           type: "info",     zone: "Z-ENTRY", x: 70, y: 88, accessible: true  },
  { id: "poi-9",  name: "Main Stage",          type: "stage",    zone: "Z-MAIN",  x: 50, y: 47, accessible: false },
  { id: "poi-10", name: "VIP Lounge",          type: "entrance", zone: "Z-VIP",   x: 85, y: 12, accessible: true  },
  { id: "poi-11", name: "Parking Area",        type: "parking",  zone: "Z-ENTRY", x: 20, y: 95, accessible: true  },
];
