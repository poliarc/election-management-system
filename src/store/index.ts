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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(profileApi.middleware)
      .concat(partyTypeApi.middleware)
      .concat(roleApi.middleware)
      .concat(userApi.middleware)
      .concat(assemblyApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
