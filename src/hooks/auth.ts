import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
import type { PayloadAction } from "@reduxjs/toolkit";

export const sendLink = createAsyncThunk<
  void,
  { name: string; email: string },
  { rejectValue: string }
>(
  "auth/sendLink",
  async ({ name, email }, { rejectWithValue }) => {
    try {
      const baseUrl =
        import.meta.env.VITE_BASE_URL || "https://blogappsite.vercel.app";

      const redirectUrl =
        `${baseUrl}/userregistration` +
        `?name=${encodeURIComponent(name)}` +
        `&email=${encodeURIComponent(email)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return rejectWithValue(error.message);
      }
    } catch {
      return rejectWithValue("Failed to send magic link.");
    }
  }
);


export interface User {
  userID?: string;
  name: string;
  email: string;
  image?: string | null;
  created_at?: string;
}

export const registerUser = createAsyncThunk(
  "user/AddUser",
  async (
    newUser: { name: string; email: string; image?: File | null },
    thunkAPI
  ) => {
    const { name, email, image } = newUser;

    if (!name || !email) {
      return thunkAPI.rejectWithValue("Name and email are required.");
    }

    const isValidEmail = (email: string) =>
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    if (!isValidEmail(email)) {
      return thunkAPI.rejectWithValue(
        "Only Gmail addresses in the format username@gmail.com are accepted"
      );
    }

    const { data: existingUsers, error: checkError } = await supabase
      .from("tbluser")
      .select("userID")
      .eq("email", email.trim().toLowerCase())
      .limit(1);

    if (checkError) return thunkAPI.rejectWithValue(checkError.message);
    if (existingUsers?.length)
      return thunkAPI.rejectWithValue("Email already exists.");

    let base64Image: string | null = null;
    if (image) {
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
    }

    const { data, error } = await supabase
      .from("tbluser")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        image: base64Image, // Base64 string
        create_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return thunkAPI.rejectWithValue(error.message);

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

interface AuthState {
  user: User | null;
  name: string;
  email: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  restoring: boolean;
}

const initialState: AuthState = {
  name: "",
  email: "",
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
      .addCase(sendLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendLink.fulfilled, (state) => {
        state.loading = false;
        state.success = "Check your email for confirmation";
      })
      .addCase(sendLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send confirmation";
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
        state.user = action.payload;
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