import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SensorDetails from "@/pages/SensorDetails";
import SystemStatus from "@/pages/SystemStatus";
import { TelemetryProvider } from "@/hooks/useTelemetry";
import { SystemEventsProvider } from "@/hooks/useSystemEvents";
import { ROUTES } from "@/constants";

export default function App() {
  return (
    <TelemetryProvider>
      <SystemEventsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path={ROUTES.dashboard} element={<Dashboard />} />
              <Route path={ROUTES.sensorDetails} element={<SensorDetails />} />
              <Route path={ROUTES.status} element={<SystemStatus />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SystemEventsProvider>
    </TelemetryProvider>
  );
}
