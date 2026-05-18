import type { RoutePresentation } from "@/types/route";

export const ROUTE_PRESENTATIONS: RoutePresentation[] = [
  {
    routeId: "route-1",
    routeName: "Main Campus Loop",
    polyline: [
      [23.8103, 90.4125],
      [23.8122, 90.4154],
      [23.8151, 90.4188],
      [23.8184, 90.4201],
      [23.8212, 90.4169],
    ],
    stops: [
      {
        id: "stop-1",
        name: "Main Gate",
        latitude: 23.8103,
        longitude: 90.4125,
        order: 1,
      },
      {
        id: "stop-2",
        name: "Admin Building",
        latitude: 23.8122,
        longitude: 90.4154,
        order: 2,
      },
      {
        id: "stop-3",
        name: "Engineering Block",
        latitude: 23.8151,
        longitude: 90.4188,
        order: 3,
      },
      {
        id: "stop-4",
        name: "Library",
        latitude: 23.8184,
        longitude: 90.4201,
        order: 4,
      },
      {
        id: "stop-5",
        name: "Residence Hall",
        latitude: 23.8212,
        longitude: 90.4169,
        order: 5,
      },
    ],
  },
  {
    routeId: "route-2",
    routeName: "City Pickup Route",
    polyline: [
      [23.7808, 90.4072],
      [23.7865, 90.4104],
      [23.7943, 90.4148],
      [23.8021, 90.4186],
      [23.8103, 90.4125],
    ],
    stops: [
      {
        id: "city-stop-1",
        name: "City Point A",
        latitude: 23.7808,
        longitude: 90.4072,
        order: 1,
      },
      {
        id: "city-stop-2",
        name: "City Point B",
        latitude: 23.7865,
        longitude: 90.4104,
        order: 2,
      },
      {
        id: "city-stop-3",
        name: "City Point C",
        latitude: 23.7943,
        longitude: 90.4148,
        order: 3,
      },
      {
        id: "city-stop-4",
        name: "Campus Arrival",
        latitude: 23.8103,
        longitude: 90.4125,
        order: 4,
      },
    ],
  },
];
