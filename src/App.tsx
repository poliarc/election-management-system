import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRedirect from "./routes/RoleRedirect";
import NotFound from "./pages/NotFound";
import PanelSelect from "./pages/PanelSelect";
import PanelAdminLayout from "./layouts/PanelAdminLayout";
import AdminLayout from "./layouts/AdminLayout";
// import StateLayout from "./layouts/StateLayout";
import DistrictLayout from "./layouts/DistrictLayout";
import AssemblyLayout from "./layouts/AssemblyLayout";
// import AdminOverview from "./pages/Admin/Overview";
// import StateOverview from "./pages/State/Dashboard";
// import StateTeamListing from "./pages/State/state-team";
import DistrictDashboard from "./pages/District/Dashboard";
import DistrictTeam from "./pages/District/DistrictTeam";
import DistrictAssembly from "./pages/District/assembly/Assembly";
import DistrictBlock from "./pages/District/block/Block";
import DistrictMandal from "./pages/District/mandal/Mandal";
import DistrictBooth from "./pages/District/booth/Booth";
import DistrictPollingCenters from "./pages/District/pollingCenter/PollingCenters";
import DistrictKaryakarta from "./pages/District/karyakarta/Karyakarta";
import DistrictCampaigns from "./pages/District/campaign/Campaigns";
import DistrictInitiatives from "./pages/District/initiatives/Initiatives";
import {DistrictProfile} from "./pages/District/profile/Profile";
// import StateDistrictsListing from "./pages/State/districts";
// import StateAssemblyListing from "./pages/State/assembly";
// import DistrictOverview from "./pages/District/Overview";
// import StateDistrictsListing from "./pages/State/districts";
// import StateAssemblyListing from "./pages/State/assembly";
// import DistrictOverview from "./pages/District/Overview";
import AssemblyDashboard from "./pages/Assembly/Dashboard";
import AssemblyTeam from "./pages/Assembly/AssemblyTeam";
import AssemblyBlockPage from "./pages/Assembly/block/BlockPage";
import AssemblyMandalPage from "./pages/Assembly/mandal/MandalPage";
import AssemblyPollingCenterPage from "./pages/Assembly/pollingCenter/PollingCenterPage";
import AssemblyBoothPage from "./pages/Assembly/booth/BoothPage";
import AssemblyKaryakartaPage from "./pages/Assembly/karyakarta/KaryakartaPage";
import {Profile} from "./pages/Assembly/Profile/Profile";


import AdminOverview from "./pages/Admin/Overview";
import StateLayout from "./layouts/StateLayout";
import StateOverview from "./pages/State/Dashboard";
import StateTeamListing from "./pages/State/state-team";
import StateBlockListing from "./pages/State/block";
import StateAssemblyListing from "./pages/State/assembly";
import StateDistrictsListing from "./pages/State/districts";
import StateMandalListing from "./pages/State/mandal";
import StateBoothListing from "./pages/State/booth";
import StateKaryakartaListing from "./pages/State/karyakarta";
import { PartyTypePage } from "./pages/Admin/partyType";
import { PartyMasterPage } from "./pages/Admin/partyMaster/PartyMasterPage";
import  PartyLevelManagementPage  from "./pages/Admin/partyWiseLevel/PartyLevelManagementPage";
import {StateProfile} from "./pages/State/profile";

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
            <Route path="party-type" element={<PartyTypePage />} />
            <Route path="party-master" element={<PartyMasterPage />} />
            <Route path="party-wise-level" element={<PartyLevelManagementPage />} />
          </Route>
          <Route path="state" element={<StateLayout />}>
            <Route index element={<StateOverview />} />
            <Route path="dashboard" element={<StateOverview />} />
            <Route path="team" element={<StateTeamListing />} />
            <Route path="districts" element={<StateDistrictsListing />} />
            <Route path="assembly" element={<StateAssemblyListing />} />
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
          <Route path="assembly" element={<AssemblyLayout />}>
            <Route index element={<AssemblyDashboard />} />
            <Route path="dashboard" element={<AssemblyDashboard />} />
            <Route path="team" element={<AssemblyTeam />} />
            <Route path="block" element={<AssemblyBlockPage />} />
            <Route path="mandal" element={<AssemblyMandalPage />} />
            <Route
              path="polling-center"
              element={<AssemblyPollingCenterPage />}
            />
            <Route path="booth" element={<AssemblyBoothPage />} />
            <Route path="karyakarta" element={<AssemblyKaryakartaPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
