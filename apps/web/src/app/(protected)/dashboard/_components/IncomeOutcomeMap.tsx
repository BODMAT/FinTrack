import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import { useAuth } from "@/hooks/useAuth";
import { ColoredMarker } from "./ColoredMarker";
import { NoData } from "@/shared/ui/Helpers";
import { useTransactionsAll } from "@/hooks/useTransactions";
import { useSummary } from "@/hooks/useSummary";
import { useThemeStore } from "@/store/theme";
import { useCurrency } from "@/hooks/useCurrency";

interface DefaultIconWithInternal extends L.Icon.Default {
  _getIconUrl?: string;
}

delete (L.Icon.Default.prototype as DefaultIconWithInternal)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function IncomeOutcomeMap() {
  const { theme } = useThemeStore();
  const { user } = useAuth();
  const { data: transactions } = useTransactionsAll({ userId: user?.id });
  const { summary } = useSummary();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();

  if (!transactions || !transactions.data.length || !user || !summary)
    return <NoData />;

  const {
    minNegativeTransaction,
    maxNegativeTransaction,
    minPositiveTransaction,
    maxPositiveTransaction,
  } = summary.topTransaction;

  const center: LatLngTuple = [51.505, -0.09];
  const markers = transactions.data.filter((item) => item.location);
  const isDarkTheme = theme === "dark";
  const mapLayer = isDarkTheme
    ? {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      }
    : {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
      };

  return (
    <section className="neo-panel neo-panel-glow relative h-full overflow-hidden transitioned">
      <MapContainer
        center={
          markers.length
            ? [markers[0].location!.latitude, markers[0].location!.longitude]
            : center
        }
        zoom={9}
        style={{ height: "100%", minHeight: "470px", width: "100%" }}
      >
        <TileLayer url={mapLayer.url} attribution={mapLayer.attribution} />
        {markers.map((item, index) => {
          const isIncome: boolean = item.type === "INCOME";
          return (
            <Marker
              key={index}
              position={
                [
                  item.location!.latitude,
                  item.location!.longitude,
                ] as LatLngTuple
              }
              icon={ColoredMarker(
                convertAmount(
                  Number(item.amount),
                  item.currencyCode ?? "USD",
                  displayCurrency,
                ).toString(),
                isIncome ? "income" : "outcome",
                Number(
                  isIncome ? minPositiveTransaction : minNegativeTransaction,
                ) || 0,
                Number(
                  isIncome ? maxPositiveTransaction : maxNegativeTransaction,
                ) || 0,
              )}
            >
              <Popup>
                {item.title}: {isIncome ? "+" : "-"}
                {formatMoney(
                  convertAmount(
                    Number(item.amount),
                    item.currencyCode ?? "USD",
                    displayCurrency,
                  ),
                  displayCurrency,
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </section>
  );
}
