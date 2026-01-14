import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
import type { PayloadAction } from "@reduxjs/toolkit";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    { name, email }: { name: string; email: string },
    { rejectWithValue }
  ) => {
    if (!name || !email) return rejectWithValue("All fields required");

    const { data: existingUsers, error: fetchError } = await supabase
      .from("tbluser")
      .select("userID")
      .eq("email", email)
      .limit(1);

    if (fetchError) return rejectWithValue(fetchError.message);

    if (existingUsers && existingUsers.length > 0) {
      return rejectWithValue("This email is already registered.");
    }

    const { data, error } = await supabase
      .from("tbluser")
      .insert({
        name,
        email,
        create_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return rejectWithValue(error.message);

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/bloglist",
      },
    });

    return data;
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    if (!email) return rejectWithValue("Email is required");

    const { data: existingUser, error: fetchError } = await supabase
      .from("tbluser")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) return rejectWithValue(fetchError.message);

    if (!existingUser) {
      return rejectWithValue(
        "This email is not registered. Please register first."
      );
    }

    return existingUser;
  }
);

export interface User {
  userID: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  restoring: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  success: null,
  restoring: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
      supabase.auth.signOut();
    },
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = null;
    },
    setRestoring(state, action: PayloadAction<boolean>) {
      state.restoring = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.success = "Successfully registered!";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setRestoring, clearSuccess, setUser, logout, clearError } =
  authSlice.actions;
export default authSlice.reducer;
