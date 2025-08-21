import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import { useUser } from "../../hooks/useUser";
import { ColoredMarker } from "./ColoredMarker";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function IncomeOutcomeMap() {
    const { user, getStats } = useUser();
    if (!user.data || user.data.length === 0) return null;

    const { minNegativeTransaction, maxNegativeTransaction } = getStats("all", "outcome") ?? {};
    const { minPositiveTransaction, maxPositiveTransaction } = getStats("all", "income") ?? {};

    const center: LatLngTuple = [51.505, -0.09];
    const markers = user.data?.filter((item) => item.location) || [];

    return (
        <section className="relative h-full border-1 border-[var(--color-fixed-text)] rounded-[10px] overflow-hidden transitioned">
            <MapContainer
                center={
                    markers.length
                        ? [markers[0].location!.lat, markers[0].location!.lng]
                        : center
                }
                zoom={9}
                style={{ height: "100%", width: "100%", minHeight: "450px" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {markers.map((item, index) => {
                    return (
                        <Marker
                            key={index}
                            position={[item.location!.lat, item.location!.lng] as LatLngTuple}
                            icon={ColoredMarker(
                                item.amount,
                                item.isIncome ? "income" : "outcome",
                                item.isIncome ? (minPositiveTransaction ?? 0) : (minNegativeTransaction ?? 0),
                                item.isIncome ? (maxPositiveTransaction ?? 0) : (maxNegativeTransaction ?? 0)
                            )}
                        >
                            <Popup>
                                {item.title}: {item.isIncome ? "+" : "-"}{item.amount} $
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </section>
    );
}
