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
import BlockDashboard from "./pages/Block/Dashboard";
import BlockTeam from "./pages/Block/BlockTeam";
import MandalList from "./pages/Block/mandal/MandalList";
import CreateMandal from "./pages/Block/mandal/CreateMandal";
import DistrictDashboard from "./pages/District/Dashboard";
import DistrictTeam from "./pages/District/DistrictTeam";
import DistrictAssembly from "./pages/District/assembly/Assembly";
import CreateAssembly from "./pages/District/assembly/CreateAssembly";
import AssignAssembly from "./pages/District/assembly/AssignAssembly";
import DistrictBlock from "./pages/District/block/Block";
import ViewDistrictBlockUsers from "./pages/District/block/ViewDistrictBlockUsers";
import DistrictMandal from "./pages/District/mandal/Mandal";

import DistrictKaryakarta from "./pages/District/karyakarta/Karyakarta";
import DistrictInitiatives from "./pages/District/initiatives/Initiatives";
import { DistrictProfile } from "./pages/District/profile/Profile";
import AssemblyAssignedEvents from "./pages/Assembly/assigned-events/AssignedEvents";
import BlockAssignedEvents from "./pages/Block/assigned-events/AssignedEvents";
import AssemblyDashboard from "./pages/Assembly/Dashboard";
import AssemblyTeam from "./pages/Assembly/AssemblyTeam";
import AssemblyForm20 from "./pages/Assembly/Form20";
import BlockList from "./pages/Assembly/block/BlockList";
import CreateBlock from "./pages/Assembly/block/CreateBlock";
import AssignBlock from "./pages/Assembly/block/AssignBlock";
import ViewBlockUsers from "./pages/Assembly/block/ViewBlockUsers";
import AssemblyMandalPage from "./pages/Assembly/mandal/MandalPage";
import AssemblyPollingCenterPage from "./pages/Assembly/pollingCenter/PollingCenterPage";
import AssemblyBoothPage from "./pages/Assembly/booth/BoothPage";
import AssemblyKaryakartaPage from "./pages/Assembly/karyakarta/KaryakartaPage";
import { Profile } from "./pages/Assembly/Profile/Profile";
import { Profile as GeneralProfile } from "./pages/Profile/Profile";
import VoterListPage from "./pages/Assembly/voters/VoterListPage";
import VoterComparePage from "./pages/Assembly/voters/VoterComparePage";
import AlphabeticalListPage from "./pages/Assembly/voterReport/Alphabetical/AlphabeticalListPage";
import AgeWiseListPage from "./pages/Assembly/voterReport/AgeWise/AgeWiseListPage";
import FamilyReportPage from "./pages/Assembly/voterReport/Family/FamilyReportPage";
import FamilyHeadReportPage from "./pages/Assembly/voterReport/FamilyHead/FamilyHeadReportPage";
import DoubleNameReportPage from "./pages/Assembly/voterReport/DoubleName/DoubleNameReportPage";
import MarriedWomenReportPage from "./pages/Assembly/voterReport/MarriedWomen/MarriedWomenReportPage";
import SingleVoterReportPage from "./pages/Assembly/voterReport/SingleVoter/SingleVoterReportPage";
import AddressWiseListPage from "./pages/Assembly/voterReport/AddressWise/AddressWiseListPage";
import SurnameReportPage from "./pages/Assembly/voterReport/Surname/SurnameReportPage";
import CasteWiseReportPage from "./pages/Assembly/voterReport/CasteWise/CasteWiseReportPage";
import PartyWiseListPage from "./pages/Assembly/voterReport/PartyWise/PartyWiseListPage";
import DeadAliveListPage from "./pages/Assembly/voterReport/DeadAlive/DeadAliveListPage";
import BirthWiseListPage from "./pages/Assembly/voterReport/BirthWise/BirthWiseListPage";
import EducationWiseListPage from "./pages/Assembly/voterReport/EducationWise/EducationWiseListPage";
import HomeShiftedListPage from "./pages/Assembly/voterReport/HomeShifted/HomeShiftedListPage";
import OutsideLocationListPage from "./pages/Assembly/voterReport/OutsideLocation/OutsideLocationListPage";
import ProfessionWiseListPage from "./pages/Assembly/voterReport/ProfessionWise/ProfessionWiseListPage";
import ApproachListPage from "./pages/Assembly/voterReport/Approach/ApproachListPage";
import LabharthiListPage from "./pages/Assembly/voterReport/Labharthi/LabharthiListPage";
import SSRFormReportPage from "./pages/Assembly/voterReport/SSRForm";
import FamilyLabelsPage from "./pages/Assembly/voterReport/FamilyLabels/FamilyLabelsPage";
import AfterAssemblyPanelLayout from "./layouts/AfterAssemblyPanelLayout";
import {
  AfterAssemblyAssignedEvents,
  AfterAssemblyChildHierarchy,
  AfterAssemblyPanelDashboard,
  AfterAssemblyPanelTeam,
} from "./pages/AfterAssemblyPanel";
import AfterAssemblyAssignUser from "./pages/AfterAssemblyPanel/AssignUser";
import AfterAssemblyBooths from "./pages/AfterAssemblyPanel/Booths";
import AfterAssemblySearchVoter from "./pages/AfterAssemblyPanel/SearchVoter";
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
import StateBoothList from "./pages/State/booth/BoothList";
import StatePollingCenterList from "./pages/State/pollingCenter/PollingCenterList";
import DistrictBoothList from "./pages/District/booth/BoothList";
import DistrictPollingCenterList from "./pages/District/pollingCenter/PollingCenterList";
import StateKaryakartaListing from "./pages/State/karyakarta";
import DynamicLevelPage from "./pages/State/DynamicLevelPage";
import DistrictDynamicLevelPage from "./pages/District/DynamicLevelPage";
import { VisitorsPage } from "./pages/Assembly/visitors";
import AssemblyDynamicLevelPage from "./pages/Assembly/DynamicLevelPage";
import { CampaignsStatePage } from "./modules/campaigns/pages/CampaignsStatePage";
import { CampaignReportsPage } from "./modules/campaigns/pages/CampaignReportsPage";
import { PartyTypePage } from "./pages/Admin/partyType";
import { PartyMasterPage } from "./pages/Admin/partyMaster/PartyMasterPage";
import PartyLevelManagementPage from "./pages/Admin/partyWiseLevel/PartyLevelManagementPage";
import { StateProfile } from "./pages/State/profile";
import PartyAdminLayout from "./layouts/PartyAdminLayout";
import { PartyAdminDashboard } from "./pages/PartyAdmin/Dashboard";
import { PartyAdminLevels } from "./pages/PartyAdmin/Levels";
import { PartyAdminUsers } from "./pages/PartyAdmin/Users";
import { DynamicLinkGenerator } from "./pages/PartyAdmin/DynamicLinkGenerator";
import { RegistrationLinksManager } from "./pages/PartyAdmin/RegistrationLinksManager";
import { RolePage as PartyAdminRoles } from "./pages/PartyAdmin/role";
import { PublicRegistration } from "./pages/PublicRegistration";
import LevelAdminLayout from "./layouts/LevelAdminLayout";
import { LevelAdminDashboardRouter } from "./pages/LevelAdmin/LevelAdminRouter";
import { UserManagementRouter } from "./pages/LevelAdmin/UserManagementRouter";
import { AssemblyHierarchyManager } from "./pages/LevelAdmin/assemblyLevel";
import ChatPage from "./pages/Chat/ChatPage";
import SubLevelPanelLayout from "./layouts/SubLevelPanelLayout";
import {
  SubLevelPanelDashboard,
  SubLevelPanelTeam,
  SubLevelChildHierarchy,
  SubLevelAssignedEvents,
  SubLevelDeletedVoters,
} from "./pages/SubLevelPanel";
import SubLevelBooths from "./pages/SubLevelPanel/Booths";
import SubLevelSearchVoter from "./pages/SubLevelPanel/SearchVoter";
import SubLevelBoothVoters from "./pages/SubLevelPanel/BoothVoters";
import SubLevelAssignUser from "./pages/SubLevelPanel/AssignUser";
import SubLevelForm20 from "./pages/SubLevelPanel/Form20";
import {
  BoothManagementDashboard,
  AllAgentsPage,
  BoothInsideTeamPage,
  BoothOutsideTeamPage,
  PollingSupportTeamPage,
} from "./modules/assembly/booth-management/pages";
import {
  UserCommunication,
  VoterCommunication,
} from "./pages/Assembly/communication";
import {
  SendReport,
  MyReports,
  AssignedReports,
  UnderHierarchyReports,
  ReportDetails,
} from "./pages/VIC";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<PublicRegistration />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<RoleRedirect />} />
          <Route path="panels" element={<PanelSelect />} />
          <Route path="profile" element={<GeneralProfile />} />
          <Route path="admin/panel/:panelRole" element={<PanelAdminLayout />} />

          {/* Party Admin Routes */}
          <Route path="partyadmin/:partyId" element={<PartyAdminLayout />}>
            <Route index element={<PartyAdminDashboard />} />
            <Route path="dashboard" element={<PartyAdminDashboard />} />
            <Route path="levels" element={<PartyAdminLevels />} />
            <Route path="levels/:stateId" element={<PartyAdminLevels />} />
            <Route path="users" element={<PartyAdminUsers />} />
            <Route path="dynamic-links" element={<DynamicLinkGenerator />} />
            <Route path="registration-links" element={<RegistrationLinksManager />} />
            <Route path="roles" element={<PartyAdminRoles />} />
          </Route>

          {/* Level Admin Routes */}
          <Route path="leveladmin/:levelId" element={<LevelAdminLayout />}>
            <Route index element={<LevelAdminDashboardRouter />} />
            <Route path="dashboard" element={<LevelAdminDashboardRouter />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<VoterListPage />} />
            <Route path="users" element={<UserManagementRouter />} />
            <Route path="assign-users" element={<UserManagementRouter />} />
            <Route path="manage-booths" element={<UserManagementRouter />} />
            <Route path="create-user" element={<UserManagementRouter />} />
            <Route
              path="assembly-hierarchy"
              element={<AssemblyHierarchyManager />}
            />
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
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<VoterListPage />} />
            <Route path="team" element={<StateTeamListing />} />
            <Route path="districts" element={<StateDistrictsListing />} />
            <Route path="districts/create" element={<CreateDistrict />} />
            <Route path="districts/assign" element={<AssignDistrict />} />
            <Route path="assembly" element={<StateAssemblyListing />} />
            <Route path="block" element={<StateBlockListing />} />
            <Route path="mandal" element={<StateMandalListing />} />
            <Route path="polling-center" element={<StatePollingCenterList />} />
            <Route path="booth" element={<StateBoothList />} />
            <Route path="dynamic-level/:levelName" element={<DynamicLevelPage />} />
            <Route path="karyakarta" element={<StateKaryakartaListing />} />
            <Route path="campaigns" element={<CampaignsStatePage />} />
            <Route path="campaigns/reports" element={<CampaignReportsPage />} />
            <Route path="profile" element={<StateProfile />} />
          </Route>
          <Route path="district" element={<DistrictLayout />}>
            <Route index element={<DistrictDashboard />} />
            <Route path="dashboard" element={<DistrictDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<VoterListPage />} />
            <Route path="district-team" element={<DistrictTeam />} />
            <Route path="assembly" element={<DistrictAssembly />} />
            <Route path="assembly/create" element={<CreateAssembly />} />
            <Route path="assembly/assign" element={<AssignAssembly />} />
            <Route path="block" element={<DistrictBlock />} />
            <Route path="block/users" element={<ViewDistrictBlockUsers />} />
            <Route path="mandal" element={<DistrictMandal />} />
            <Route
              path="polling-center"
              element={<DistrictPollingCenterList />}
            />
            <Route path="booth" element={<DistrictBoothList />} />
            <Route path="dynamic-level/:levelName" element={<DistrictDynamicLevelPage />} />
            <Route path="karyakarta" element={<DistrictKaryakarta />} />
            <Route path="campaigns" element={<CampaignsStatePage />} />
            <Route path="campaigns/reports" element={<CampaignReportsPage />} />
            <Route path="initiatives" element={<DistrictInitiatives />} />
            <Route path="profile" element={<DistrictProfile />} />
          </Route>
          <Route path="assembly" element={<AssemblyLayout />}>
            <Route index element={<AssemblyDashboard />} />
            <Route path="dashboard" element={<AssemblyDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<VoterListPage />} />
            <Route path="compare-voters" element={<VoterComparePage />} />
            <Route
              path="voter-report/alphabetical"
              element={<AlphabeticalListPage />}
            />
            <Route path="voter-report/age-wise" element={<AgeWiseListPage />} />
            <Route path="voter-report/family" element={<FamilyReportPage />} />
            <Route
              path="voter-report/family-head"
              element={<FamilyHeadReportPage />}
            />
            <Route
              path="voter-report/double-name"
              element={<DoubleNameReportPage />}
            />
            <Route
              path="voter-report/married-women"
              element={<MarriedWomenReportPage />}
            />
            <Route
              path="voter-report/single-voter"
              element={<SingleVoterReportPage />}
            />
            <Route
              path="voter-report/address-wise"
              element={<AddressWiseListPage />}
            />
            <Route
              path="voter-report/surname"
              element={<SurnameReportPage />}
            />
            <Route
              path="voter-report/caste-wise"
              element={<CasteWiseReportPage />}
            />
            <Route
              path="voter-report/party-wise"
              element={<PartyWiseListPage />}
            />
            <Route
              path="voter-report/dead-alive"
              element={<DeadAliveListPage />}
            />
            <Route
              path="voter-report/birth-wise"
              element={<BirthWiseListPage />}
            />
            <Route
              path="voter-report/education-wise"
              element={<EducationWiseListPage />}
            />
            <Route
              path="voter-report/home-shifted"
              element={<HomeShiftedListPage />}
            />
            <Route
              path="voter-report/outside-location"
              element={<OutsideLocationListPage />}
            />
            <Route
              path="voter-report/profession-wise"
              element={<ProfessionWiseListPage />}
            />
            <Route
              path="voter-report/approach"
              element={<ApproachListPage />}
            />
            <Route
              path="voter-report/labharthi"
              element={<LabharthiListPage />}
            />
            <Route
              path="voter-report/ssr-form"
              element={<SSRFormReportPage />}
            />
            <Route
              path="voter-report/family-labels"
              element={<FamilyLabelsPage />}
            />
            <Route path="team" element={<AssemblyTeam />} />
            <Route path="visitors" element={<VisitorsPage />} />
            <Route path="form-20" element={<AssemblyForm20 />} />
            <Route path="block" element={<BlockList />} />
            <Route path="block/create" element={<CreateBlock />} />
            <Route path="block/assign" element={<AssignBlock />} />
            <Route path="block/users" element={<ViewBlockUsers />} />
            <Route path=":levelName/assign" element={<AssignBlock />} />
            <Route path="mandal" element={<AssemblyMandalPage />} />
            <Route
              path="polling-center"
              element={<AssemblyPollingCenterPage />}
            />
            <Route path="booth" element={<AssemblyBoothPage />} />
            <Route path="dynamic-level/:levelName" element={<AssemblyDynamicLevelPage />} />
            <Route path="karyakarta" element={<AssemblyKaryakartaPage />} />
            <Route path="campaigns" element={<CampaignsStatePage />} />
            <Route path="campaigns/reports" element={<CampaignReportsPage />} />
            <Route
              path="assigned-events"
              element={<AssemblyAssignedEvents />}
            />
            {/* Communication Routes */}
            <Route
              path="communication/user-communication"
              element={<UserCommunication />}
            />
            <Route
              path="communication/voter-communication"
              element={<VoterCommunication />}
            />
            {/* Booth Management Routes */}
            <Route
              path="booth-management/dashboard"
              element={<BoothManagementDashboard />}
            />
            <Route path="booth-management/agents" element={<AllAgentsPage />} />
            <Route
              path="booth-management/inside"
              element={<BoothInsideTeamPage />}
            />
            <Route
              path="booth-management/outside"
              element={<BoothOutsideTeamPage />}
            />
            <Route
              path="booth-management/polling-support"
              element={<PollingSupportTeamPage />}
            />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="block" element={<BlockLayout />}>
            <Route index element={<BlockDashboard />} />
            <Route path="dashboard" element={<BlockDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<VoterListPage />} />
            <Route path="team" element={<BlockTeam />} />
            <Route path="mandal" element={<MandalList />} />
            <Route path="mandal/create" element={<CreateMandal />} />
            <Route path="mandal/assign" element={<AssignMandal />} />
            <Route path="mandal/users" element={<ViewMandalUsers />} />
            <Route path="assigned-events" element={<BlockAssignedEvents />} />
            <Route path="profile" element={<BlockProfile />} />
          </Route>

          {/* After Assembly Panel Routes */}
          <Route
            path="afterassembly/:levelId"
            element={<AfterAssemblyPanelLayout />}
          >
            <Route index element={<AfterAssemblyPanelDashboard />} />
            <Route path="dashboard" element={<AfterAssemblyPanelDashboard />} />
            <Route path="team" element={<AfterAssemblyPanelTeam />} />
            <Route
              path="child-hierarchy"
              element={<AfterAssemblyChildHierarchy />}
            />
            <Route path="assign-user" element={<AfterAssemblyAssignUser />} />
            <Route path="booths" element={<AfterAssemblyBooths />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<AfterAssemblySearchVoter />} />
            <Route
              path="assigned-events"
              element={<AfterAssemblyAssignedEvents />}
            />
            {/* VIC Routes */}
            <Route path="vic/report-details/:id" element={<ReportDetails />} />
            <Route path="vic/send-report" element={<SendReport />} />
            <Route path="vic/my-reports" element={<MyReports />} />
            <Route path="vic/assigned-reports" element={<AssignedReports />} />
            <Route
              path="vic/under-hierarchy-reports"
              element={<UnderHierarchyReports />}
            />
          </Route>

          {/* Sub Level Panel Routes */}
          <Route path="sublevel/:levelId" element={<SubLevelPanelLayout />}>
            <Route index element={<SubLevelPanelDashboard />} />
            <Route path="dashboard" element={<SubLevelPanelDashboard />} />
            <Route path="team" element={<SubLevelPanelTeam />} />
            <Route
              path="child-hierarchy"
              element={<SubLevelChildHierarchy />}
            />
            <Route path="assign-user" element={<SubLevelAssignUser />} />
            <Route path="booths" element={<SubLevelBooths />} />
            <Route path="booth-voters" element={<SubLevelBoothVoters />} />
            <Route path="form-20" element={<SubLevelForm20 />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="search-voter" element={<SubLevelSearchVoter />} />
            <Route
              path="assigned-events"
              element={<SubLevelAssignedEvents />}
            />
            {/* VIC Routes */}
            <Route
              path="vic/deleted-voters"
              element={<SubLevelDeletedVoters />}
            />
            <Route path="vic/send-report" element={<SendReport />} />
            <Route path="vic/my-reports" element={<MyReports />} />
            <Route path="vic/assigned-reports" element={<AssignedReports />} />
            <Route
              path="vic/under-hierarchy-reports"
              element={<UnderHierarchyReports />}
            />
            <Route path="vic/report-details/:id" element={<ReportDetails />} />
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
