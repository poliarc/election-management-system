import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import * as passwordResetApi from "../services/passwordResetApi";

export interface PasswordResetState {
  step: "entry" | "otp" | "reset" | "success";
  identifier: string;
  maskedIdentifier: string;
  resetToken: string | null;
  loading: boolean;
  error: string | null;
  resendCooldown: number;
}

const initialState: PasswordResetState = {
  step: "entry",
  identifier: "",
  maskedIdentifier: "",
  resetToken: null,
  loading: false,
  error: null,
  resendCooldown: 0,
};

export const sendOtp = createAsyncThunk(
  "passwordReset/sendOtp",
  async (identifier: string, { rejectWithValue }) => {
    try {
      const response = await passwordResetApi.sendOtp({ identifier });
      if (!response.success) {
        toast.error(response.message || "Failed to send OTP");
        return rejectWithValue(response.message);
      }
      toast.success(response.message || "OTP sent successfully");
      return {
        identifier,
        maskedIdentifier: response.data?.maskedIdentifier || identifier,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "passwordReset/verifyOtp",
  async (
    { identifier, otp }: { identifier: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await passwordResetApi.verifyOtp({ identifier, otp });
      if (!response.success) {
        toast.error(response.message || "Failed to verify OTP");
        return rejectWithValue(response.message);
      }
      toast.success(response.message || "OTP verified successfully");
      return {
        resetToken: response.data?.resetToken || null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const resendOtp = createAsyncThunk(
  "passwordReset/resendOtp",
  async (identifier: string, { rejectWithValue }) => {
    try {
      const response = await passwordResetApi.resendOtp({ identifier });
      if (!response.success) {
        toast.error(response.message || "Failed to resend OTP");
        return rejectWithValue(response.message);
      }
      toast.success(response.message || "OTP resent successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend OTP";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "passwordReset/resetPassword",
  async (
    {
      identifier,
      otp,
      newPassword,
      confirmPassword,
      resetToken,
    }: {
      identifier: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
      resetToken?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await passwordResetApi.resetPassword({
        identifier,
        otp,
        newPassword,
        confirmPassword,
        resetToken,
      });
      if (!response.success) {
        toast.error(response.message || "Failed to reset password");
        return rejectWithValue(response.message);
      }
      toast.success(response.message || "Password reset successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const passwordResetSlice = createSlice({
  name: "passwordReset",
  initialState,
  reducers: {
    resetState: () => initialState,
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    decrementCooldown: (state) => {
      if (state.resendCooldown > 0) {
        state.resendCooldown -= 1;
      }
    },
    setStep: (
      state,
      action: PayloadAction<"entry" | "otp" | "reset" | "success">
    ) => {
      state.step = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.identifier = action.payload.identifier;
        state.maskedIdentifier = action.payload.maskedIdentifier;
        state.step = "otp";
        state.resendCooldown = 30;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to send OTP";
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.resetToken = action.payload.resetToken;
        state.step = "reset";
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Invalid OTP";
      })
      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
        state.resendCooldown = 30;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to resend OTP";
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.step = "success";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to reset password";
      });
  },
});

export const { resetState, setError, decrementCooldown, setStep } =
  passwordResetSlice.actions;
export default passwordResetSlice.reducer;
