import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import { Dashboard } from "../DashboardPage/Dashboard";
import { Analitycs } from "../AnalitycsPage/Analitycs";
import { Transactions } from "../TransactionPage/Transactions";
import { PopUpPortal } from "../../portals/PopUp.portal";
import { CustomMessage } from "../Helpers";

export function App() {
  return (
    <BrowserRouter basename="/FinTrack/">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analitycs" element={<Analitycs />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="*" element={<CustomMessage message="404 page not found" />} />
        </Route>
      </Routes>

      {/* All PopUps in one portal */}
      <PopUpPortal />
    </BrowserRouter>
  );
}

