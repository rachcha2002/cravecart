declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';

  namespace Routing {
    interface RoutingControlOptions {
      waypoints: L.LatLng[];
      router?: any;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      fitSelectedRoutes?: boolean | 'smart';
      lineOptions?: L.PolylineOptions & { extendToWaypoints?: boolean; missingRouteTolerance?: number };
      plan?: any;
      createMarker?: (i: number, waypoint: any, n: number) => L.Marker | null;
    }

    class Control extends L.Control {
      constructor(options: RoutingControlOptions);
      getRouter(): any;
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): this;
      getPlan(): any;
      getRouter(): any;
      route(): void;
      on(event: string, fn: Function): this;
      remove(): this;
    }

    function control(options: RoutingControlOptions): Control;
  }

  export = Routing;
}
