export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface RoutePresentation {
  routeId: string;
  routeName: string;
  polyline: [number, number][];
  stops: RouteStop[];
}
