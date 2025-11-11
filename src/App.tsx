import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRedirect from "./routes/RoleRedirect";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import StateLayout from "./layouts/StateLayout";
import DistrictLayout from "./layouts/DistrictLayout";
import AssemblyLayout from "./layouts/AssemblyLayout";
import BlockLayout from "./layouts/BlockLayout";
import MandalLayout from "./layouts/MandalLayout";
import PollingCenterLayout from "./layouts/PollingCenterLayout";
import BoothLayout from "./layouts/BoothLayout";
import KaryakartaLayout from "./layouts/KaryakartaLayout";
import AdminOverview from "./pages/Admin/Overview";
import StateOverview from "./pages/State/Overview";
import DistrictOverview from "./pages/District/Overview";
import AssemblyOverview from "./pages/Assembly/Overview";
import BlockOverview from "./pages/Block/Overview";
import MandalOverview from "./pages/Mandal/Overview";
import PollingCenterOverview from "./pages/PollingCenter/Overview";
import BoothOverview from "./pages/Booth/Overview";
import KaryakartaOverview from "./pages/Karyakarta/Overview";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<RoleRedirect />} />

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
          </Route>
          <Route path="state" element={<StateLayout />}>
            <Route index element={<StateOverview />} />
            <Route path="overview" element={<StateOverview />} />
          </Route>
          <Route path="district" element={<DistrictLayout />}>
            <Route index element={<DistrictOverview />} />
            <Route path="overview" element={<DistrictOverview />} />
          </Route>
          <Route path="assembly" element={<AssemblyLayout />}>
            <Route index element={<AssemblyOverview />} />
            <Route path="overview" element={<AssemblyOverview />} />
          </Route>
          <Route path="block" element={<BlockLayout />}>
            <Route index element={<BlockOverview />} />
            <Route path="overview" element={<BlockOverview />} />
          </Route>
          <Route path="mandal" element={<MandalLayout />}>
            <Route index element={<MandalOverview />} />
            <Route path="overview" element={<MandalOverview />} />
          </Route>
          <Route path="polling-center" element={<PollingCenterLayout />}>
            <Route index element={<PollingCenterOverview />} />
            <Route path="overview" element={<PollingCenterOverview />} />
          </Route>
          <Route path="booth" element={<BoothLayout />}>
            <Route index element={<BoothOverview />} />
            <Route path="overview" element={<BoothOverview />} />
          </Route>
          <Route path="karyakarta" element={<KaryakartaLayout />}>
            <Route index element={<KaryakartaOverview />} />
            <Route path="overview" element={<KaryakartaOverview />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
