import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Blog {
  id: number;
  title: string;
  content: string;
  authorID: string;
  image: string;
  created_at?: string;
}

interface BlogState {
  blogs: Blog[];
  singleBlog: Blog | null;
  total: number;
  loading: boolean;
  loadingSingleBlog: boolean;
  error: string | null;
  currentPage: number;
  perPage: number;
  success: string | null;
}

const initialState: BlogState = {
  blogs: [],
  singleBlog: null,
  loadingSingleBlog: false,
  total: 0,
  loading: false,
  error: null,
  currentPage: 1,
  perPage: 9,
  success: null,
};

export const AddBlog = createAsyncThunk(
  "blog/AddBlog",
  async (newBlog: Omit<Blog, "id">, thunkAPI) => {
    if (!newBlog.title || !newBlog.content || !newBlog.image) {
      return thunkAPI.rejectWithValue("Please fill in all fields.");
    }

    const { data, error } = await supabase
      .from("tblBlog")
      .insert(newBlog)
      .select()
      .single();

    if (error) return thunkAPI.rejectWithValue(error.message);
    return data as Blog;
  }
);

export const fetchBlogsByAuthor = createAsyncThunk(
  "blog/fetchByAuthor",
  async (
    {
      authorID,
      page = 1,
      perPage = 9,
    }: { authorID: string; page?: number; perPage?: number },
    thunkAPI
  ) => {
    const from = (page - 1) * perPage;
    const to = page * perPage - 1;

    const { data, count, error } = await supabase
      .from("tblBlog")
      .select("id,title,image,content,authorID", { count: "estimated" })
      .eq("authorID", authorID)
      .order("id", { ascending: true })
      .range(from, to);

    if (error) return thunkAPI.rejectWithValue(error.message);

    return {
      data: data ?? [],
      total: count ?? 0,
    };
  }
);

export const updateBlog = createAsyncThunk(
  "blog/updateBlog",
  async (
    {
      id,
      title,
      content,
      image,
    }: { id: number; title: string; content: string; image: string },
    thunkAPI
  ) => {
    if (!title || !content || !image) {
      return thunkAPI.rejectWithValue("Please fill in all fields.");
    }
    const { data, error } = await supabase
      .from("tblBlog")
      .update({ title, content, image })
      .eq("id", id)
      .select()
      .single();

    if (error) return thunkAPI.rejectWithValue(error.message);

    return data as Blog;
  }
);

export const FetchSingleBlog = createAsyncThunk(
  "blog/fetchsingle-blog",
  async ({ id }: { id: number }, thunkAPI) => {
    try {
      const { data, error } = await supabase
        .from("tblBlog")
        .select("id,title,image,content,authorID")
        .eq("id", id)
        .single();

      if (error) return thunkAPI.rejectWithValue(error.message);

      return data as Blog;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteBlog = createAsyncThunk(
  "blog/deleteBlog",
  async (id: number, thunkAPI) => {
    const { error } = await supabase.from("tblBlog").delete().eq("id", id);

    if (error) return thunkAPI.rejectWithValue(error.message);

    return id;
  }
);

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearSingleBlog: (state) => {
      state.singleBlog = null;
    },
    resetBlogState: (state) => {
      state.singleBlog = null;
      state.loadingSingleBlog = false;
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(AddBlog.fulfilled, (state, action: PayloadAction<Blog>) => {
        state.loading = false;
        state.blogs.unshift(action.payload);
        state.success = "Blog Added Successfully";
      })
      .addCase(AddBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBlogsByAuthor.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlogsByAuthor.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchBlogsByAuthor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBlog.fulfilled, (state, action: PayloadAction<Blog>) => {
        state.loading = false;
        state.success = "Blog updated successfully!";
        const index = state.blogs.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.blogs[index] = action.payload;
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(FetchSingleBlog.pending, (state) => {
        state.loadingSingleBlog = true;
        state.error = null;
      })
      .addCase(FetchSingleBlog.fulfilled, (state, action) => {
        state.loadingSingleBlog = false;
        state.singleBlog = action.payload;
      })
      .addCase(FetchSingleBlog.rejected, (state, action) => {
        state.loadingSingleBlog = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBlog.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = state.blogs.filter((b) => b.id !== action.payload);
        state.success = "Blog deleted successfully!";
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetBlogState, clearError, clearSuccess, clearSingleBlog } =
  blogSlice.actions;
export default blogSlice.reducer;