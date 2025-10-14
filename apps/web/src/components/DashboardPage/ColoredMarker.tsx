import L from "leaflet";

export function ColoredMarker(amount: string, type: "income" | "outcome", min: number, max: number) {
    const intensity = 50 + Math.round(((Number(amount) - min) / (max - min || 1)) * 50);

    const color = type === "income" ? `rgb(34,197,94, ${intensity / 100})` : `rgb(220,38,38, ${intensity / 100})`;

    return L.divIcon({
        className: 'flex items-center justify-center rounded-full border border-white shadow-lg',
        html: `<div style="
                background-color: ${color};
                width: 1.25rem; 
                height: 1.25rem;
                border-radius: 9999px;
            "></div>`,
        iconSize: [20, 20],
    });
}
