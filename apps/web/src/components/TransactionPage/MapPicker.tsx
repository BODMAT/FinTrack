import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Location } from "@fintrack/types";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  value: Location | undefined;
  onChange: (loc: Location) => void;
}

const MapController = ({ value, onChange }: MapPickerProps) => {
  const map = useMap();

  useEffect(() => {
    if (value) {
      map.flyTo([value.latitude, value.longitude], map.getZoom());
    }
  }, [value, map]);

  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });

  return value ? <Marker position={[value.latitude, value.longitude]} /> : null;
};

export const MapPicker = ({ value, onChange }: MapPickerProps) => {
  return (
    <div
      style={{
        flex: "1 1 auto",
        width: "100%",
        minHeight: "200px",
        position: "relative",
      }}
    >
      <MapContainer
        center={value ? [value.latitude, value.longitude] : [0, 0]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
};
