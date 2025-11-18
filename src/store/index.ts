import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import passwordResetReducer from "./passwordResetSlice";
import partyReducer from "./partySlice";
import { profileApi } from "./api/profileApi";
import { partyTypeApi } from "./api/partyTypeApi"; // 👈 import partyTypeApi

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    passwordReset: passwordResetReducer,
    party: partyReducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [partyTypeApi.reducerPath]: partyTypeApi.reducer, // 👈 add partyType reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(profileApi.middleware)
      .concat(partyTypeApi.middleware), // 👈 add partyType middleware
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
