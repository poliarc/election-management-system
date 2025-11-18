import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import passwordResetReducer from "./passwordResetSlice";
import { profileApi } from "./api/profileApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    passwordReset: passwordResetReducer,
    [profileApi.reducerPath]: profileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(profileApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
