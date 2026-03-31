"use client";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Location } from "@fintrack/types";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface MapPickerProps {
  value?: Location;
  onChange: (loc: Location) => void;
}

const defaultCenter: [number, number] = [50.4501, 30.5234];

function MapClickHandler({ onChange }: { onChange: MapPickerProps["onChange"] }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  useEffect(() => {
    const icon = new L.Icon({
      iconUrl: markerIcon.src,
      shadowUrl: markerShadow.src,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = icon;
  }, []);

  const position: [number, number] | null = value
    ? [value.latitude, value.longitude]
    : null;

  return (
    <div className="h-[200px] w-full overflow-hidden rounded-[10px] border border-(--color-fixed-text)">
      <MapContainer
        center={position ?? defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        {position && (
          <Marker position={position}>
            <Popup>Selected location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
