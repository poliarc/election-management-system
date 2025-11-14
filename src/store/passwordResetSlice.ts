import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
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
                return rejectWithValue(response.message);
            }
            return {
                identifier,
                maskedIdentifier: response.data?.maskedIdentifier || identifier,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to send OTP"
            );
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
                return rejectWithValue(response.message);
            }
            return {
                resetToken: response.data?.resetToken || null,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to verify OTP"
            );
        }
    }
);

export const resendOtp = createAsyncThunk(
    "passwordReset/resendOtp",
    async (identifier: string, { rejectWithValue }) => {
        try {
            const response = await passwordResetApi.resendOtp({ identifier });
            if (!response.success) {
                return rejectWithValue(response.message);
            }
            return true;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to resend OTP"
            );
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
                return rejectWithValue(response.message);
            }
            return true;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to reset password"
            );
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
