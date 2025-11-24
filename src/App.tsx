import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRedirect from "./routes/RoleRedirect";
import NotFound from "./pages/NotFound";
import PanelSelect from "./pages/PanelSelect";
import PanelAdminLayout from "./layouts/PanelAdminLayout";
import AdminLayout from "./layouts/AdminLayout";
import DistrictLayout from "./layouts/DistrictLayout";
import AssemblyLayout from "./layouts/AssemblyLayout";
import BlockLayout from "./layouts/BlockLayout";
import DistrictDashboard from "./pages/District/Dashboard";
import DistrictTeam from "./pages/District/DistrictTeam";
import DistrictAssembly from "./pages/District/assembly/Assembly";
import CreateAssembly from "./pages/District/assembly/CreateAssembly";
import AssignAssembly from "./pages/District/assembly/AssignAssembly";
import DistrictBlock from "./pages/District/block/Block";
import ViewDistrictBlockUsers from "./pages/District/block/ViewDistrictBlockUsers";
import DistrictMandal from "./pages/District/mandal/Mandal";
import DistrictBooth from "./pages/District/booth/Booth";
import DistrictPollingCenters from "./pages/District/pollingCenter/PollingCenters";
import DistrictKaryakarta from "./pages/District/karyakarta/Karyakarta";
import DistrictCampaigns from "./pages/District/campaign/Campaigns";
import DistrictInitiatives from "./pages/District/initiatives/Initiatives";
import { DistrictProfile } from "./pages/District/profile/Profile";
import AssemblyDashboard from "./pages/Assembly/Dashboard";
import AssemblyTeam from "./pages/Assembly/AssemblyTeam";
import BlockList from "./pages/Assembly/block/BlockList";
import CreateBlock from "./pages/Assembly/block/CreateBlock";
import AssignBlock from "./pages/Assembly/block/AssignBlock";
import ViewBlockUsers from "./pages/Assembly/block/ViewBlockUsers";
import AssemblyMandalPage from "./pages/Assembly/mandal/MandalPage";
import AssemblyPollingCenterPage from "./pages/Assembly/pollingCenter/PollingCenterPage";
import AssemblyBoothPage from "./pages/Assembly/booth/BoothPage";
import AssemblyKaryakartaPage from "./pages/Assembly/karyakarta/KaryakartaPage";
import { Profile } from "./pages/Assembly/Profile/Profile";
import BlockDashboard from "./pages/Block/Dashboard";
import BlockTeam from "./pages/Block/BlockTeam";
import MandalList from "./pages/Block/mandal/MandalList";
import CreateMandal from "./pages/Block/mandal/CreateMandal";
import AssignMandal from "./pages/Block/mandal/AssignMandal";
import ViewMandalUsers from "./pages/Block/mandal/ViewMandalUsers";
import { Profile as BlockProfile } from "./pages/Block/Profile/Profile";
import { RolePage } from "./pages/Admin/role";
import { UserPage } from "./pages/Admin/users/UserPage";

import AdminOverview from "./pages/Admin/Overview";
import StateLayout from "./layouts/StateLayout";
import StateOverview from "./pages/State/Dashboard";
import StateTeamListing from "./pages/State/state-team";
import StateBlockListing from "./pages/State/block";
import StateAssemblyListing from "./pages/State/assembly";
import StateDistrictsListing from "./pages/State/districts";
import CreateDistrict from "./pages/State/districts/CreateDistrict";
import AssignDistrict from "./pages/State/districts/AssignDistrict";
import StateMandalListing from "./pages/State/mandal";
import StateBoothListing from "./pages/State/booth";
import StateKaryakartaListing from "./pages/State/karyakarta";
import { PartyTypePage } from "./pages/Admin/partyType";
import { PartyMasterPage } from "./pages/Admin/partyMaster/PartyMasterPage";
import PartyLevelManagementPage from "./pages/Admin/partyWiseLevel/PartyLevelManagementPage";
import { StateProfile } from "./pages/State/profile";
import PartyAdminLayout from "./layouts/PartyAdminLayout";
import { PartyAdminDashboard } from "./pages/PartyAdmin/Dashboard";
import { PartyAdminLevels } from "./pages/PartyAdmin/Levels";
import { PartyAdminUsers } from "./pages/PartyAdmin/Users";
import { RolePage as PartyAdminRoles } from "./pages/PartyAdmin/role";
import LevelAdminLayout from "./layouts/LevelAdminLayout";
import { LevelAdminDashboardRouter } from "./pages/LevelAdmin/LevelAdminRouter";
import { UserManagementRouter } from "./pages/LevelAdmin/UserManagementRouter";
import { LevelDataManagement } from "./pages/LevelAdmin/afterAssemblyLevel";

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

          {/* Party Admin Routes */}
          <Route path="partyadmin/:partyId" element={<PartyAdminLayout />}>
            <Route index element={<PartyAdminDashboard />} />
            <Route path="dashboard" element={<PartyAdminDashboard />} />
            <Route path="levels" element={<PartyAdminLevels />} />
            <Route path="levels/:stateId" element={<PartyAdminLevels />} />
            <Route path="users" element={<PartyAdminUsers />} />
            <Route path="roles" element={<PartyAdminRoles />} />
          </Route>

          {/* Level Admin Routes */}
          <Route path="leveladmin/:levelId" element={<LevelAdminLayout />}>
            <Route index element={<LevelAdminDashboardRouter />} />
            <Route path="dashboard" element={<LevelAdminDashboardRouter />} />
            <Route path="levels" element={<LevelDataManagement />} />
            <Route path="users" element={<UserManagementRouter />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<UserPage />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="party-type" element={<PartyTypePage />} />
            <Route path="party-master" element={<PartyMasterPage />} />
            <Route
              path="party-wise-level"
              element={<PartyLevelManagementPage />}
            />
            <Route path="role" element={<RolePage />} />
            <Route path="users" element={<UserPage />} />
          </Route>
          <Route path="state" element={<StateLayout />}>
            <Route index element={<StateOverview />} />
            <Route path="dashboard" element={<StateOverview />} />
            <Route path="team" element={<StateTeamListing />} />
            <Route path="districts" element={<StateDistrictsListing />} />
            <Route path="districts/create" element={<CreateDistrict />} />
            <Route path="districts/assign" element={<AssignDistrict />} />
            <Route path="assembly" element={<StateAssemblyListing />} />
          </Route>
          <Route path="district" element={<DistrictLayout />}>
            <Route index element={<DistrictDashboard />} />
            <Route path="dashboard" element={<DistrictDashboard />} />
            <Route path="district-team" element={<DistrictTeam />} />
            <Route path="assembly" element={<DistrictAssembly />} />
            <Route path="assembly/create" element={<CreateAssembly />} />
            <Route path="assembly/assign" element={<AssignAssembly />} />
            <Route path="block" element={<DistrictBlock />} />
            <Route path="block/users" element={<ViewDistrictBlockUsers />} />
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
            <Route path="block" element={<BlockList />} />
            <Route path="block/create" element={<CreateBlock />} />
            <Route path="block/assign" element={<AssignBlock />} />
            <Route path="block/users" element={<ViewBlockUsers />} />
            <Route path="mandal" element={<AssemblyMandalPage />} />
            <Route
              path="polling-center"
              element={<AssemblyPollingCenterPage />}
            />
            <Route path="booth" element={<AssemblyBoothPage />} />
            <Route path="karyakarta" element={<AssemblyKaryakartaPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="block" element={<BlockLayout />}>
            <Route index element={<BlockDashboard />} />
            <Route path="dashboard" element={<BlockDashboard />} />
            <Route path="team" element={<BlockTeam />} />
            <Route path="mandal" element={<MandalList />} />
            <Route path="mandal/create" element={<CreateMandal />} />
            <Route path="mandal/assign" element={<AssignMandal />} />
            <Route path="mandal/users" element={<ViewMandalUsers />} />
            <Route path="profile" element={<BlockProfile />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Container for notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#EF4444",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}
