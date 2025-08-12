import ReactDOM from "react-dom";

export function FixedPanel({ children }: { children: React.ReactNode }) {
    return ReactDOM.createPortal(
        children,
        document.body
    );
}