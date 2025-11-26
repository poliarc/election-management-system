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
import { blockTeamApi } from "./api/blockTeamApi";
import { afterAssemblyApi } from "./api/afterAssemblyApi";
import { partyWiseLevelApi } from "./api/partyWiseLevelApi";
import { partyUserApi } from "./api/partyUserApi";
import { chatApi } from "../services/chatApi";

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
    [blockTeamApi.reducerPath]: blockTeamApi.reducer,
    [afterAssemblyApi.reducerPath]: afterAssemblyApi.reducer,
    [partyWiseLevelApi.reducerPath]: partyWiseLevelApi.reducer,
    [partyUserApi.reducerPath]: partyUserApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
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
      .concat(blockTeamApi.middleware)
      .concat(afterAssemblyApi.middleware)
      .concat(partyWiseLevelApi.middleware)
      .concat(partyUserApi.middleware)
      .concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
