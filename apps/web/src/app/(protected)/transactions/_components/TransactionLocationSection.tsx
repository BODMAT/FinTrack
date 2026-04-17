import dynamic from "next/dynamic";
import type { Location } from "@fintrack/types";
import type { FormTransaction } from "@/types/transaction";

interface MapPickerProps {
  value: Location | undefined;
  onChange: (loc: Location) => void;
}

const MapPicker = dynamic<MapPickerProps>(
  () => import("./MapPicker").then((module) => module.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] w-full rounded-[10px] border border-(--color-fixed-text)" />
    ),
  },
);

interface TransactionLocationSectionProps {
  form: FormTransaction;
  loadingLocation: boolean;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onGetCurrentLocation: () => void;
  onMapChange: (loc: Location) => void;
}

export function TransactionLocationSection({
  form,
  loadingLocation,
  onLatitudeChange,
  onLongitudeChange,
  onGetCurrentLocation,
  onMapChange,
}: TransactionLocationSectionProps) {
  return (
    <section className="flex gap-[20px] items-center	">
      <div className="flex flex-col gap-[20px]">
        <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label
            htmlFor="locationLat"
            className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
          >
            Latitude:
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="locationLat"
            placeholder="23,456"
            min={-90}
            max={90}
            value={form.latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
          />
        </div>

        <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label
            htmlFor="locationLng"
            className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
          >
            Longitude:
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="locationLng"
            placeholder="23,456"
            min={-180}
            max={180}
            value={form.longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
          />
        </div>
        <button
          type="button"
          disabled={loadingLocation}
          onClick={onGetCurrentLocation}
          className="not-disabled:cursor-pointer bg-(--color-card) rounded-[10px] p-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) not-disabled:hover:scale-95 text-[16px] font-bold"
        >
          Get current location
        </button>
      </div>
      <div className="w-full h-full flex overflow-hidden">
        <MapPicker
          value={
            form.longitude && form.latitude
              ? {
                  latitude: +form.latitude,
                  longitude: +form.longitude,
                }
              : undefined
          }
          onChange={onMapChange}
        />
      </div>
    </section>
  );
}
