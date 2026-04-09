"use client";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { Location } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface MapPickerProps {
  value?: Location;
  onChange: (loc: Location) => void;
}

const defaultCenter: [number, number] = [50.4501, 30.5234];
const resolveAssetUrl = (asset: unknown): string =>
  typeof asset === "string"
    ? asset
    : asset && typeof asset === "object" && "src" in asset
      ? String((asset as { src: string }).src)
      : "";
const markerIconUrl =
  resolveAssetUrl(markerIcon) ||
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadowUrl =
  resolveAssetUrl(markerShadow) ||
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const defaultMarkerIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({
  onChange,
}: {
  onChange: MapPickerProps["onChange"];
}) {
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
  const { t } = useSafeTranslation();

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
          <Marker position={position} icon={defaultMarkerIcon}>
            <Popup>{t("transactions.selectedLocation")}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
