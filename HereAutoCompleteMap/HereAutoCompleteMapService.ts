import { Model } from 'core/models';

import { Observable, Subject, Subscription } from 'rxjs';
export class HereAutoCompleteMapService<T extends Model> {
  map: H.Map; // map instance
  bounds: H.geo.Rect; // map boundary
  infoWindow: H.ui.InfoBubble; // map infoWindow
  markers: H.map.Marker[] = []; // markers array
  clusterProvider: H.clustering.Provider;
  addCluster$: Subject<boolean> = new Subject();
  subscriptions: Subscription[] = [];
  customPlaces?: T[] = [];
  ui?: H.ui.UI;
  behavior?: H.mapevents.Behavior;
  marker: H.map.Marker;
  customRenderInfoWindow?: (places: T) => string;

  constructor(mapContainer: HTMLElement) {
    if (mapContainer) {
      const platform = new window.H.service.Platform({
        apikey: process.env.REACT_APP_HERE_APIKEY, // test key
      });

      const defaultLayers = platform.createDefaultLayers();
      this.map = new window.H.Map(
        mapContainer,
        defaultLayers.vector.normal.map,
        {
          // styles: stylesMap,
          zoom: 16,
          center: {
            lat: 43.642567,
            lng: -79.387054,
          },
          pixelRatio: window.devicePixelRatio || 1,

          // disableDefaultUI: true,
        },
      );

      window.addEventListener('resize', () => this.map.getViewPort().resize());

      this.behavior = new window.H.mapevents.Behavior(
        new window.H.mapevents.MapEvents(this.map),
      );

      this.ui = window.H.ui.UI.createDefault(this.map, defaultLayers);

      this.bounds = new window.H.geo.Rect(27, 30, 50, 40);

      this.marker = new H.map.Marker(
        {
          lat: 43.642567,
          lng: -79.387054,
        },
        {
          icon: new H.map.Icon('/dms/assets/icons/red-dot.svg', {
            size: { w: 50, h: 50 },
            anchor: { x: 25, y: 25 },
            crossOrigin: true,
          }),
        },
      );

      this.map.addObject(this.marker);

      this.map.getViewModel().setLookAtData({
        position: {
          lat: 43.642567,
          lng: -79.387054,
        },
      });
    }
  } // initiate mapService with map instance

  unSubscribe = () => {
    this.subscriptions.forEach(item => item.unsubscribe());
  };

  setCluster = () => {
    this.addCluster$.next(true);
  }; // trigger addCluster

  _getCluster = () => {
    return this.addCluster$ as Observable<boolean>;
  };

  addCluster = (isSet: boolean) => {
    if (isSet) {
      this.startClustering();
    }
  };

  onMarkerClick = e => {
    // Get position of the "clicked" marker
    const position = e.target.getGeometry();
    // Get the data associated with that marker
    const data = e.target.getData();
    // Merge default template with the data and get HTML
    if (!data.isCluster) {
      const bubbleContent = this.customRenderInfoWindow(data);

      const bubble = new H.ui.InfoBubble(position, {
        content: bubbleContent,
      });
      this.ui.addBubble(bubble);

      // Move map's center to a clicked marker
    }
    this.map.setCenter(position, true);
  };

  startClustering = () => {
    // custom icon svg
    const clusterSvgTemplate =
      '<svg xmlns="http://www.w3.org/2000/svg" height="{size}" width="50" version="50"><circle cx="25px" cy="25px" r="{radius}" fill="{color}"/>' +
      '<text x="25" y="30" font-size="10pt" font-family="Montserrat" font-weight="bold" text-anchor="middle" fill="white">{text}</text>' +
      '</svg>';

    // First we need to create an array of DataPoint objects,
    // for the ClusterProvider
    const dataPoints = this.customPlaces.map(item => {
      return new window.H.clustering.DataPoint(
        item.latitude,
        item.longitude,
        null,
        item,
      );
    });

    const CUSTOM_THEME = {
      getClusterPresentation(cluster) {
        // custom icon depend on weight
        // var radius = (cluster.getWeight() * 5).toString();
        const label = cluster.getWeight().toString();

        let svgString = clusterSvgTemplate.replace('{text}', label);
        // svgString = svgString.replace('{radius}', radius);

        const weight = cluster.getWeight();

        // Set cluster size depending on the weight
        if (weight <= 6) {
          svgString = svgString.replace('{color}', '#00a2d3');
          svgString = svgString.replace('{radius}', '14');
        } else if (weight <= 1000) {
          svgString = svgString.replace('{color}', '#ff9b00');
          svgString = svgString.replace('{radius}', '19');
        } else {
          svgString = svgString.replace('{color}', '#ff6969');
          svgString = svgString.replace('{radius}', '25');
        }

        // Create a marker cluster with custom svg
        const clusterMarker = new H.map.Marker(cluster.getPosition(), {
          icon: new H.map.Icon(svgString, {
            size: { w: 40, h: 40 },
            anchor: { x: 20, y: 20 },
            crossOrigin: false,
          }),

          // Set min/max zoom with values from the cluster,
          // otherwise clusters will be shown at all zoom levels:
          min: cluster.getMinZoom(),
          max: cluster.getMaxZoom(),
        });

        return clusterMarker.setData({ isCluster: true });
      },
      getNoisePresentation(noisePoint) {
        // Get a reference to data object our noise points
        const data = noisePoint.getData();
        // Create a marker for the noisePoint
        const noiseMarker = new H.map.Marker(noisePoint.getPosition(), {
          // Use min zoom from a noise point
          // to show it correctly at certain zoom levels:
          min: noisePoint.getMinZoom(),
          icon: new H.map.Icon(data?.markerIcon, {
            size: { w: 30, h: 30 },
            anchor: { x: 15, y: 15 },
            crossOrigin: true,
          }),
        });
        // Link a data from the point to the marker
        // to make it accessible inside onMarkerClick
        noiseMarker.setData(data);

        return noiseMarker;
      },
    };

    // Create a clustering provider with custom options for clusterizing the input
    this.clusterProvider = new window.H.clustering.Provider(dataPoints, {
      clusteringOptions: {
        // Maximum radius of the neighbourhood
        eps: 32,
        // minimum weight of points required to form a cluster
        minWeight: 2,
      },
      theme: CUSTOM_THEME,
    });
    // open information bubble on tap marker
    this.clusterProvider.addEventListener('tap', this.onMarkerClick);

    // Create a layer tha will consume objects from our clustering provider
    const clusteringLayer = new window.H.map.layer.ObjectLayer(
      this.clusterProvider,
    );

    // To make objects from clustering provder visible,
    // we need to add our layer to the map
    this.map.addLayer(clusteringLayer);
  };

  clearClusters = () => {
    this.customPlaces
      .map(item => {
        return new window.H.clustering.DataPoint(item.latitude, item.longitude);
      })
      .forEach((item: H.clustering.DataPoint) => {
        this.clusterProvider.removeDataPoint(item);
      });

    this.markers = [];
  };

  setMarkersOnMap = (map: any) => {
    if (this.markers.length > 0) {
      for (const item of this.markers) {
        map.addObject(item);
      }
    }
  }; // clear all markers on map instance

  clearMarkers = () => {
    this.setMarkersOnMap(null);
    this.markers = []; // reset
  }; // Shows any markers currently in the array

  addMarkers = <T extends Model>(
    places: T[],
    renderInfoWindow: (place: T) => string,
  ) => {
    places.forEach(place => {
      const lat = place.latitude;
      const lng = place.longitude;

      if (typeof lat === 'number' && typeof lng === 'number') {
        // tslint:disable-next-line:no-unused-expression
        const marker = new window.H.map.Marker({ lat, lng });

        this.bounds.containsLatLng(lat, lng); // extends map bounds
        this.markers.push(marker); // add marker to markers array
        marker.addEventListener('tap', () => {
          this.infoWindow.setContent(renderInfoWindow(place));
          this.infoWindow.open();
        });
      }
    });
    // this.map.fitBounds(this.bounds); // fitbounds all markers
  }; // create markers from deriver places
}

// const clusterStyle = [
//   {
//     width: 30,
//     height: 30,
//     className: 'custom-clustericon-1',
//   },
//   {
//     width: 40,
//     height: 40,
//     className: 'custom-clustericon-2',
//   },
//   {
//     width: 50,
//     height: 50,
//     className: 'custom-clustericon-3',
//   },
// ];

// const stylesMap: any[] = [
//   {
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#f5f5f5',
//       },
//     ],
//   },
//   {
//     elementType: 'labels.icon',
//     stylers: [
//       {
//         visibility: 'off',
//       },
//     ],
//   },
//   {
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#616161',
//       },
//     ],
//   },
//   {
//     elementType: 'labels.text.stroke',
//     stylers: [
//       {
//         color: '#f5f5f5',
//       },
//     ],
//   },
//   {
//     featureType: 'administrative.land_parcel',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#bdbdbd',
//       },
//     ],
//   },
//   {
//     featureType: 'poi',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#eeeeee',
//       },
//     ],
//   },
//   {
//     featureType: 'poi',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#757575',
//       },
//     ],
//   },
//   {
//     featureType: 'poi.park',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#e5e5e5',
//       },
//     ],
//   },
//   {
//     featureType: 'poi.park',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#9e9e9e',
//       },
//     ],
//   },
//   {
//     featureType: 'road',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#ffffff',
//       },
//     ],
//   },
//   {
//     featureType: 'road.arterial',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#757575',
//       },
//     ],
//   },
//   {
//     featureType: 'road.highway',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#dadada',
//       },
//     ],
//   },
//   {
//     featureType: 'road.highway',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#616161',
//       },
//     ],
//   },
//   {
//     featureType: 'road.local',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#9e9e9e',
//       },
//     ],
//   },
//   {
//     featureType: 'transit.line',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#e5e5e5',
//       },
//     ],
//   },
//   {
//     featureType: 'transit.station',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#eeeeee',
//       },
//     ],
//   },
//   {
//     featureType: 'water',
//     elementType: 'geometry',
//     stylers: [
//       {
//         color: '#c9c9c9',
//       },
//     ],
//   },
//   {
//     featureType: 'water',
//     elementType: 'labels.text.fill',
//     stylers: [
//       {
//         color: '#9e9e9e',
//       },
//     ],
//   },
// ];
