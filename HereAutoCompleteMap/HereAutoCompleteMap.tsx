import { Model } from "core/models";
// import { GoogleAPI, GoogleApiWrapper, Map, Marker } from 'google-maps-react';

import React, { Dispatch, SetStateAction } from "react";
import SearchBox from "./SearchBox";
import "./HereAutoCompleteMap.scss";
import { HereAutoCompleteMapService } from "./HereAutoCompleteMapService";
import { SuggestLocationInterface } from "./CustomSearchService";

export interface GoogleAutoCompleteMapProps<T> {
  defaultAddress?: string; // default value for autocomplate
  defaultZoom: number; // default zoom for map
  lat: number; // latitude
  lng: number; // longitude
  inputClassName?: string;
  inputMapClassName?: string;
  model: T;
  setModel: Dispatch<SetStateAction<T>>;
  isAddress: boolean;
  placeholder?: string;
  onSearchBoxChange?: (value: string) => void;
  onPlacesChanged?: (
    address: string,
    latitude: number,
    longitude: number
  ) => void;
  disabled?: boolean;
}

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
};

export const fullScreenButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 24,
  top: 10,
  zIndex: 99,
  borderRadius: 4,
  border: "none",
  padding: 10,
  backgroundColor: "#fff",
  width: 40,
  height: 40,
  boxShadow: "0em 0 0.4em 0 rgba(15, 22, 33, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export default function HereAutoCompleteMap<T extends Model>(
  props: GoogleAutoCompleteMapProps<T>
) {
  const {
    defaultAddress,

    lat,
    lng,
    inputClassName,
    placeholder,
    disabled,
    onPlacesChanged,
    onSearchBoxChange,
  } = props;

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapService = React.useRef<HereAutoCompleteMapService<T>>(null);
  const fullscreenButton = React.useRef<HTMLButtonElement>(null);
  const [hereMap, setHereMap] = React.useState<H.Map>();

  const toggleFullScreen = React.useCallback((fullscreen: HTMLDivElement) => {
    if (!document.fullscreenElement) {
      fullscreen.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  React.useEffect(() => {
    if (mapContainer.current) {
      mapService.current = new HereAutoCompleteMapService(mapContainer.current);
      if (fullscreenButton.current) {
        fullscreenButton.current.addEventListener("click", () =>
          toggleFullScreen(mapContainer.current)
        );
      }
    }
  }, [toggleFullScreen]);
  React.useEffect(() => {
    if (lat && lng) {
      mapService.current.map.setCenter({ lat, lng });
      mapService.current.marker.setGeometry({ lat, lng });
    }
  }, [lat, lng]);

  React.useEffect(() => {
    const { map } = mapService.current;

    setHereMap(map);
  }, []);

  const handlePlacesChanged = React.useCallback(
    (places: SuggestLocationInterface[]) => {
      if (places !== undefined) {
        // setPlaces(places);
        const { 0: place } = places;
        if (!place || !place.position) return;
        if (typeof onPlacesChanged === "function") {
          const address = place.title;
          const latitude = place.position[0];
          const longitude = place.position[1];
          onPlacesChanged(address, latitude, longitude);
          mapService.current.map.getViewModel().setLookAtData({
            position: { lat: latitude, lng: longitude },
            zoom: 18,
          });
        }
      }
    },
    [onPlacesChanged]
  );

  return (
    <div>
      <SearchBox
        onPlacesChanged={handlePlacesChanged}
        defaultAddress={defaultAddress}
        className={inputClassName}
        placeholder={placeholder}
        onSearchBoxChange={onSearchBoxChange}
        disabled={disabled}
        map={hereMap}
      />
      <div style={{ display: "block", width: "100%", height: "300px" }}>
        <div id="google-map" ref={mapContainer} style={containerStyle}>
          <button
            style={fullScreenButtonStyle}
            ref={fullscreenButton}
            title={"Enter full screen"}
          >
            <i
              className={`fa ${
                !document.fullscreenElement ? "fa-expand" : "fa-compress"
              }`}
              style={{ fontSize: 20 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
