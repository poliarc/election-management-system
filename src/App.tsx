import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRedirect from "./routes/RoleRedirect";
import NotFound from "./pages/NotFound";
import PanelSelect from "./pages/PanelSelect";
import PanelAdminLayout from "./layouts/PanelAdminLayout";
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
import StateOverview from "./pages/State/Dashboard";
import StateTeamListing from "./pages/State/state-team";
import StateBlockListing from "./pages/State/block";
import DistrictDashboard from "./pages/District/Dashboard";
import DistrictTeam from "./pages/District/DistrictTeam";
import DistrictAssembly from "./pages/District/Assembly";
import DistrictBlock from "./pages/District/Block";
import DistrictMandal from "./pages/District/Mandal";
import DistrictBooth from "./pages/District/Booth";
import DistrictPollingCenters from "./pages/District/PollingCenters";
import DistrictKaryakarta from "./pages/District/Karyakarta";
import DistrictCampaigns from "./pages/District/Campaigns";
import DistrictInitiatives from "./pages/District/Initiatives";
import DistrictProfile from "./pages/District/Profile";
// import StateDistrictsListing from "./pages/State/districts";
import StateAssemblyListing from "./pages/State/assembly";
// import DistrictOverview from "./pages/District/Overview";
import StateDistrictsListing from "./pages/State/districts";
// import StateAssemblyListing from "./pages/State/assembly";
// import DistrictOverview from "./pages/District/Overview";
import AssemblyOverview from "./pages/Assembly/Overview";
import AssemblyDashboard from "./pages/Assembly/Dashboard";
import BlockOverview from "./pages/Block/Overview";
import AssemblyBlockPage from "./pages/Assembly/block/BlockPage";
import AssemblyMandalPage from "./pages/Assembly/mandal/MandalPage";
import AssemblyBoothPage from "./pages/Assembly/booth/BoothPage";
import AssemblyKaryakartaPage from "./pages/Assembly/karyakarta/KaryakartaPage";
import MandalOverview from "./pages/Mandal/Overview";
import PollingCenterOverview from "./pages/PollingCenter/Overview";
import BoothOverview from "./pages/Booth/Overview";
import KaryakartaOverview from "./pages/Karyakarta/Overview";
import StateMandalListing from "./pages/State/mandal";
import StateBoothListing from "./pages/State/booth";
import StateKaryakartaListing from "./pages/State/karyakarta";
import StateProfile from "./pages/State/profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<RoleRedirect />} />
          <Route path="panels" element={<PanelSelect />} />
          <Route path="admin/panel/:panelRole" element={<PanelAdminLayout />} />

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
          </Route>
          <Route path="state" element={<StateLayout />}>
            <Route index element={<StateOverview />} />
            <Route path="dashboard" element={<StateOverview />} />
            <Route path="team" element={<StateTeamListing />} />
            <Route path="districts" element={<StateDistrictsListing />} />
            <Route path="assembly" element={<StateAssemblyListing />} />
            <Route path="block" element={<StateBlockListing />} />
            <Route path="mandal" element={<StateMandalListing />} />
            <Route path="booth" element={<StateBoothListing />} />
            <Route path="karyakarta" element={<StateKaryakartaListing />} />
            <Route path="profile" element={<StateProfile />} />
          </Route>
          <Route path="district" element={<DistrictLayout />}>
            <Route index element={<DistrictDashboard />} />
            <Route path="dashboard" element={<DistrictDashboard />} />
            <Route path="district-team" element={<DistrictTeam />} />
            <Route path="assembly" element={<DistrictAssembly />} />
            <Route path="block" element={<DistrictBlock />} />
            <Route path="mandal" element={<DistrictMandal />} />
            <Route path="booth" element={<DistrictBooth />} />
            <Route
              path="polling-centers"
              element={<DistrictPollingCenters />}
            />
            <Route path="karyakarta" element={<DistrictKaryakarta />} />
            <Route path="campaigns" element={<DistrictCampaigns />} />
            <Route path="initiatives" element={<DistrictInitiatives />} />
            <Route path="profile" element={<DistrictProfile />} />
          </Route>
          <Route path="assembly" element={<AssemblyLayout />}>
            <Route index element={<AssemblyOverview />} />
            <Route path="overview" element={<AssemblyOverview />} />
            <Route path="dashboard" element={<AssemblyDashboard />} />
            <Route path="block" element={<AssemblyBlockPage />} />
            <Route path="block/overview" element={<AssemblyBlockPage />} />
            <Route path="mandal" element={<AssemblyMandalPage />} />
            <Route path="mandal/overview" element={<AssemblyMandalPage />} />
            <Route path="booth" element={<AssemblyBoothPage />} />
            <Route path="booth/overview" element={<AssemblyBoothPage />} />
            <Route path="karyakarta" element={<AssemblyKaryakartaPage />} />
            <Route
              path="karyakarta/overview"
              element={<AssemblyKaryakartaPage />}
            />
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
