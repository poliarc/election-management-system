import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import passwordResetReducer from "./passwordResetSlice";
import partyReducer from "./partySlice";
import { profileApi } from "./api/profileApi";
import { partyTypeApi } from "./api/partyTypeApi";
import { roleApi } from "./api/roleApi";
import { userApi } from "./api/userApi";
import { assemblyApi } from "./api/assemblyApi";
import { blockApi } from "./api/blockApi";
import { stateMasterApi } from "./api/stateMasterApi";
import { registrationLinksApi } from "./api/registrationLinksApi";
import { blockTeamApi } from "./api/blockTeamApi";
import { afterAssemblyApi } from "./api/afterAssemblyApi";
import { partyWiseLevelApi } from "./api/partyWiseLevelApi";
import { partyUserApi } from "./api/partyUserApi";
import { votersApi } from "./api/votersApi";
import { chatApi } from "../services/chatApi";
import { myCampaignsApi } from "./api/myCampaignsApi";
import { vicReportsApi } from "./api/vicReportsApi";
import { resultAnalysisApi } from "./api/resultAnalysisApi";
import { visitorsApi } from "./api/visitorsApi";
import { modulesApi } from "./api/modulesApi";
import { supportersApi } from "./api/supportersApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    passwordReset: passwordResetReducer,
    party: partyReducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [partyTypeApi.reducerPath]: partyTypeApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [assemblyApi.reducerPath]: assemblyApi.reducer,
    [blockApi.reducerPath]: blockApi.reducer,
    [stateMasterApi.reducerPath]: stateMasterApi.reducer,
    [registrationLinksApi.reducerPath]: registrationLinksApi.reducer,
    [blockTeamApi.reducerPath]: blockTeamApi.reducer,
    [afterAssemblyApi.reducerPath]: afterAssemblyApi.reducer,
    [partyWiseLevelApi.reducerPath]: partyWiseLevelApi.reducer,
    [partyUserApi.reducerPath]: partyUserApi.reducer,
    [votersApi.reducerPath]: votersApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [myCampaignsApi.reducerPath]: myCampaignsApi.reducer,
    [vicReportsApi.reducerPath]: vicReportsApi.reducer,
    [resultAnalysisApi.reducerPath]: resultAnalysisApi.reducer,
    [visitorsApi.reducerPath]: visitorsApi.reducer,
    [modulesApi.reducerPath]: modulesApi.reducer,
    [supportersApi.reducerPath]: supportersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(profileApi.middleware)
      .concat(partyTypeApi.middleware)
      .concat(roleApi.middleware)
      .concat(userApi.middleware)
      .concat(assemblyApi.middleware)
      .concat(blockApi.middleware)
      .concat(stateMasterApi.middleware)
      .concat(registrationLinksApi.middleware)
      .concat(blockTeamApi.middleware)
      .concat(afterAssemblyApi.middleware)
      .concat(partyWiseLevelApi.middleware)
      .concat(partyUserApi.middleware)
      .concat(votersApi.middleware)
      .concat(chatApi.middleware)
      .concat(myCampaignsApi.middleware)
      .concat(vicReportsApi.middleware)
      .concat(resultAnalysisApi.middleware)
      .concat(visitorsApi.middleware)
      .concat(modulesApi.middleware)
      .concat(supportersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
