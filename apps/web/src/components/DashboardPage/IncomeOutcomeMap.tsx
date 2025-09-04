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
    const { transactions, getStats } = useUser();

    if (!transactions || !transactions.length) return null;

    const { minNegativeTransaction, maxNegativeTransaction } = getStats("all", "outcome") ?? {};
    const { minPositiveTransaction, maxPositiveTransaction } = getStats("all", "income") ?? {};

    const center: LatLngTuple = [51.505, -0.09];
    const markers = transactions.filter((item) => item.location);

    return (
        <section className="relative h-full border-1 border-[var(--color-fixed-text)] rounded-[10px] overflow-hidden transitioned">
            <MapContainer
                center={
                    markers.length
                        ? [markers[0].location!.latitude, markers[0].location!.longitude]
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
                    const isIncome: boolean = item.type === "INCOME";
                    return (
                        <Marker
                            key={index}
                            position={[item.location!.latitude, item.location!.longitude] as LatLngTuple}
                            icon={ColoredMarker(
                                item.amount,
                                isIncome ? "income" : "outcome",
                                isIncome ? (minPositiveTransaction ?? 0) : (minNegativeTransaction ?? 0),
                                isIncome ? (maxPositiveTransaction ?? 0) : (maxNegativeTransaction ?? 0)
                            )}
                        >
                            <Popup>
                                {item.title}: {isIncome ? "+" : "-"}{item.amount} $
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </section>
    );
}
