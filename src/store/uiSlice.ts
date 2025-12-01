import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../utils/storage";

interface UIState {
  theme: "light" | "dark";
}

const initialState: UIState = {
  theme: "light", // Force light mode only
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      // Force light mode - do nothing on toggle
      state.theme = "light";
      storage.setTheme("light");
    },
    setTheme: (state, action: { payload: "light" | "dark" }) => {
      // Force light mode - ignore payload
      state.theme = "light";
      storage.setTheme("light");
    },
  },
});

export const { toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
