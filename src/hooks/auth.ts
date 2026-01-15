import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface User {
  userID?: string;
  name: string;
  image?: string | null;
  created_at?: string;
}

export const registerUser = createAsyncThunk<
  any,
  { name: string; email: string; password: string; image?: File | null },
  { rejectValue: string }
>("auth/registerUser", async ({ name, email, password, image }, { rejectWithValue }) => {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName || !normalizedEmail || !password)
    return rejectWithValue("Name, email, and password are required");

  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(normalizedEmail)) {
    return rejectWithValue("Only Gmail addresses are accepted");
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (authError) return rejectWithValue(authError.message);
  if (!authData.user) return rejectWithValue("Failed to create account");

  let base64Image: string | null = null;
  if (image) {
    base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("tbluser")
    .insert({
      auth_id: authData.user.id,
      name: trimmedName,
      image: base64Image,
      create_timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) return rejectWithValue(profileError.message);

  return profile;
});


export const loginUser = createAsyncThunk<
  { authUser: any; profile: any },
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async ({ email, password }, { rejectWithValue }) => {
  if (!email || !password)
    return rejectWithValue("Email and password are required");

  const normalizedEmail = email.trim().toLowerCase();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError) return rejectWithValue(authError.message);
  if (!authData.user) return rejectWithValue("Invalid login credentials");

  const { data: profile, error: profileError } = await supabase
    .from("tbluser")
    .select("*")
    .eq("auth_id", authData.user.id)
    .maybeSingle();

  if (profileError) return rejectWithValue(profileError.message);
  if (!profile) return rejectWithValue("User profile not found");

  return { authUser: authData.user, profile };
});

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(logout());
    const { error } = await supabase.auth.signOut();
    if (error) return rejectWithValue(error.message);
  }
);

interface AuthState {
  user: User | null;
  name: string;
  authUser: any | null;
  email: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  restoring: boolean;
}

const initialState: AuthState = {
  name: "",
  email: "",
  authUser: null,
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
    setPending: (
      state,
      action: PayloadAction<{ name: string; email: string }>
    ) => {
      state.name = action.payload.name;
      state.email = action.payload.email;
      localStorage.setItem("pending_name", action.payload.name);
      localStorage.setItem("pending_email", action.payload.email);
    },
    clearPending: (state) => {
      state.name = "";
      state.email = "";
      localStorage.removeItem("pending_name");
      localStorage.removeItem("pending_email");
    },
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
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
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
        state.user = action.payload.profile;
        state.user = action.payload.authUser;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPending,
  clearPending,
  setRestoring,
  clearSuccess,
  setUser,
  logout,
  clearError,
} = authSlice.actions;
export default authSlice.reducer;
