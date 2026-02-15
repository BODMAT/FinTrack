import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";

import { Layout } from "./Layout";
import { PopUpPortal } from "../../portals/PopUp.portal";

const Dashboard = lazy(() =>
  import("../DashboardPage/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const Analitycs = lazy(() =>
  import("../AnalitycsPage/Analitycs").then((module) => ({
    default: module.Analitycs,
  })),
);
const Transactions = lazy(() =>
  import("../TransactionPage/Transactions").then((module) => ({
    default: module.Transactions,
  })),
);
const CustomMessage = lazy(() =>
  import("../Helpers").then((module) => ({ default: module.CustomMessage })),
);

export function App() {
  return (
    <BrowserRouter basename="/FinTrack/">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analitycs" element={<Analitycs />} />
          <Route path="transactions" element={<Transactions />} />
          <Route
            path="*"
            element={<CustomMessage message="404 page not found" />}
          />
        </Route>
      </Routes>

      {/* All PopUps in one portal */}
      <PopUpPortal />
    </BrowserRouter>
  );
}
