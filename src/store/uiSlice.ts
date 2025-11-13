import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../utils/storage";

interface UIState {
  theme: "light" | "dark";
}

const initialState: UIState = {
  theme: storage.getTheme(),
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      storage.setTheme(state.theme);
    },
    setTheme: (state, action: { payload: "light" | "dark" }) => {
      state.theme = action.payload;
      storage.setTheme(state.theme);
    },
  },
});

export const { toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
