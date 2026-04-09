import { useState } from "react";
import type { Location } from "@fintrack/types";

const GEOLOCATION_ERROR_MESSAGES: Record<number, string> = {
  1: "Location access denied. Allow geolocation permissions and try again.",
  2: "Unable to determine your location. Check network/GPS and try again.",
  3: "Location request timed out. Try again.",
};

const getLocationErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    return GEOLOCATION_ERROR_MESSAGES[error.code] || "Failed to get location.";
  }

  return "Failed to get location.";
};

export const useCurrentLocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchLocation = (): Promise<Location> => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLoading(false);
        setError("Geolocation is not supported by this browser.");
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false);
          const location: Location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          resolve(location);
        },
        (error) => {
          setLoading(false);
          const message = getLocationErrorMessage(error);
          setError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  };

  return {
    fetchLocation,
    loadingLocation: loading,
    locationError: error,
    setLocationError: setError,
  };
};
