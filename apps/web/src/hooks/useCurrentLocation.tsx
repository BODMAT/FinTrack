import { useState } from "react";
import type { Location } from "@fintrack/types";

export const useCurrentLocation = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fetchLocation = (): Promise<Location> => {
		setLoading(true);

		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				setLoading(false);
				setError("Geolocation is not supported by this browser.");
				reject(
					new Error("Geolocation is not supported by this browser."),
				);
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
					setError(error.message);
					reject(error);
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
