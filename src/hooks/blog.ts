import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface BlogComment {
  commentID: string;
  blogID: string;
  userID: string;
  content: string;
  created_at?: string;
  userName: string;
  userAvatar?: string;
  imagePath?: string;
}

export interface BlogImage {
  imageID?: string;
  blogID?: string;
  imagePath: string;
  altText: string;
  sortOrder: number;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  authorID: string;
  authorName?: string;
  authorAvatar?: string;
  images?: BlogImage[];
  comments?: BlogComment[];
  created_at?: string;
}

interface BlogState {
  blogs: Blog[];
  singleBlog: Blog | null;
  total: number;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: BlogState = {
  blogs: [],
  singleBlog: null,
  total: 0,
  loading: false,
  error: null,
  success: null,
};

function formatDateTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// ADD BLOG
export const AddBlog = createAsyncThunk<
  Blog,
  { title: string; content: string; userID: string; images?: BlogImage[] },
  { rejectValue: string }
>("blog/AddBlog", async (newBlog, thunkAPI) => {
  try {
    if (!newBlog.title || !newBlog.content) {
      return thunkAPI.rejectWithValue("Please fill in all fields.");
    }
    const { data: blogData, error: blogError } = await supabase
      .from("tblblog")
      .insert({
        title: newBlog.title,
        content: newBlog.content,
        userID: newBlog.userID,
        created_at: formatDateTime(new Date()),
      })
      .select("blogID, title, content, userID, created_at")
      .single();

    if (blogError || !blogData) {
      return thunkAPI.rejectWithValue(
        blogError?.message ?? "Failed to insert blog",
      );
    }

    const blog: Blog = {
      id: blogData.blogID,
      title: blogData.title,
      content: blogData.content,
      authorID: blogData.userID,
      created_at: blogData.created_at,
      images: [],
      comments: [],
    };

    if (newBlog.images && newBlog.images.length > 0) {
      const imagesToInsert = newBlog.images.map((img, index) => ({
        blogID: blogData.blogID,
        imagePath: img.imagePath,
        altText: img.altText,
        sortOrder: index,
      }));

      const { error: imageError } = await supabase
        .from("tblimage")
        .insert(imagesToInsert);
      if (imageError) return thunkAPI.rejectWithValue(imageError.message);

      blog.images = imagesToInsert;
    }

    return blog;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const UpdateBlog = createAsyncThunk<
  Blog,
  {
    blogID: string;
    title: string;
    content: string;
    newImages?: File[];
    removedImageIDs?: string[];
  },
  { rejectValue: string }
>(
  "blog/UpdateBlog",
  async ({ blogID, title, content, newImages, removedImageIDs }, thunkAPI) => {
    try {
      const { error: updateError } = await supabase
        .from("tblblog")
        .update({ title, content })
        .eq("blogID", blogID);

      if (updateError) return thunkAPI.rejectWithValue(updateError.message);

      if (removedImageIDs && removedImageIDs.length > 0) {
        const { error: deleteError } = await supabase
          .from("tblimage")
          .delete()
          .in("imageID", removedImageIDs);

        if (deleteError) return thunkAPI.rejectWithValue(deleteError.message);
      }

      let insertedImages: BlogImage[] = [];

      if (newImages && newImages.length > 0) {
        const uploadPromises = newImages.map(
          (file, index) =>
            new Promise<BlogImage>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  imageID: crypto.randomUUID(),
                  blogID,
                  imagePath: reader.result as string,
                  altText: file.name,
                  sortOrder: index,
                });
              };
              reader.onerror = () => reject("Failed to read file");
              reader.readAsDataURL(file);
            }),
        );

        insertedImages = await Promise.all(uploadPromises);

        const { error: insertError } = await supabase
          .from("tblimage")
          .insert(insertedImages.map(({ imageID, ...dbFields }) => dbFields));

        if (insertError) return thunkAPI.rejectWithValue(insertError.message);
      }

      return {
        id: blogID,
        title,
        content,
        authorID: "",
        images: insertedImages,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

// DELETE BLOG
export const DeleteBlog = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("blog/DeleteBlog", async (blogID, thunkAPI) => {
  try {
    const { error: commentError } = await supabase
      .from("tblcomment")
      .delete()
      .eq("blogID", blogID);

    if (commentError) return thunkAPI.rejectWithValue(commentError.message);

    const { error: imageError } = await supabase
      .from("tblimage")
      .delete()
      .eq("blogID", blogID);

    if (imageError) return thunkAPI.rejectWithValue(imageError.message);

    const { error: blogError } = await supabase
      .from("tblblog")
      .delete()
      .eq("blogID", blogID);

    if (blogError) return thunkAPI.rejectWithValue(blogError.message);

    return blogID;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

// FETCH ALL BLOGS
export const fetchAllBlogs = createAsyncThunk<
  { data: Blog[]; total: number },
  { page?: number; perPage?: number },
  { rejectValue: string }
>("blog/fetchAllBlogs", async ({ page = 1, perPage = 10 }, thunkAPI) => {
  try {
    const from = (page - 1) * perPage;
    const to = page * perPage - 1;

    const {
      data: blogsData,
      count,
      error: blogError,
    } = await supabase
      .from("tblblog")
      .select("*", { count: "estimated" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (blogError) return thunkAPI.rejectWithValue(blogError.message);

    const blogsWithRelations: Blog[] = await Promise.all(
      (blogsData ?? []).map(async (b: any) => {
        const { data: imagesData } = await supabase
          .from("tblimage")
          .select("*")
          .eq("blogID", b.blogID)
          .order("sortOrder", { ascending: true });

        const { data: commentsData } = await supabase
          .from("vw_comment_with_user")
          .select("*")
          .eq("blogID", b.blogID)
          .order("created_at", { ascending: true });

        const formattedComments: BlogComment[] =
          commentsData?.map((c: any) => ({
            commentID: c.commentID,
            blogID: c.blogID,
            userID: c.userID,
            content: c.content,
            created_at: c.created_at,
            userName: c.userName ?? "User",
            userAvatar: c.userAvatar ?? undefined,
            imagePath: c.imagePath ?? undefined,
          })) ?? [];

        const { data: authorData } = await supabase
          .from("tbluser")
          .select("name, image")
          .eq("userID", b.userID)
          .single();

        return {
          id: b.blogID,
          title: b.title,
          content: b.content,
          authorID: b.userID,
          authorName: authorData?.name ?? "User",
          authorAvatar: authorData?.image ?? undefined,
          created_at: b.created_at,
          images: imagesData ?? [],
          comments: formattedComments,
        };
      }),
    );

    return { data: blogsWithRelations, total: count ?? 0 };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

// ADD COMMENT
export const addComment = createAsyncThunk<
  BlogComment,
  { blogID: string; userID: string; content: string; file?: File },
  { rejectValue: string }
>("blog/addComment", async ({ blogID, userID, content, file }, thunkAPI) => {
  try {
    if (!content && !file)
      return thunkAPI.rejectWithValue("Comment cannot be empty");

    let uploadedImagePath: string | null = null;

    if (file) {
      uploadedImagePath = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;

            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas not supported");

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

            if (compressedBase64.length > 900_000) {
              return reject("Please choose a smaller image.");
            }
            resolve(compressedBase64);
          };

          img.onerror = () => reject("Image load failed");
        };

        reader.onerror = () => reject("File reading failed");
      });
    }

    const { data: insertedData, error: insertError } = await supabase
      .from("tblcomment")
      .insert({
        blogID,
        userID,
        content,
        imagePath: uploadedImagePath,
      })
      .select("commentID");

    if (insertError || !insertedData || insertedData.length === 0)
      return thunkAPI.rejectWithValue(
        insertError?.message ?? "Failed to add comment",
      );

    const insertedCommentID = insertedData[0].commentID;
    if (!insertedCommentID)
      return thunkAPI.rejectWithValue("Invalid comment ID after insert");

    const { data, error } = await supabase
      .from("vw_comment_with_user")
      .select("*")
      .eq("commentID", insertedCommentID)
      .single();

    if (error || !data)
      return thunkAPI.rejectWithValue(
        error?.message ?? "Failed to fetch comment",
      );

    return {
      commentID: data.commentID,
      blogID: data.blogID,
      userID: data.userID,
      content: data.content,
      created_at: data.created_at ?? undefined,
      userName: data.userName ?? "User",
      userAvatar: data.userAvatar ?? undefined,
      imagePath: data.imagePath ?? undefined,
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});


//Delete Comment
export const deleteComment = createAsyncThunk<
  { commentID: string; blogID: string },
  { commentID: string; userID: string; blogID: string },
  { rejectValue: string }
>(
  "blog/deleteComment",
  async ({ commentID, userID, blogID }, thunkAPI) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("tblcomment")
        .select("*")
        .eq("commentID", commentID)
        .single();
      if (fetchErr) {
        console.error("Fetch error:", fetchErr);
        return thunkAPI.rejectWithValue(fetchErr.message);
      }
      if (!existing) {
        return thunkAPI.rejectWithValue("Comment not found");
      }

      if (existing.userID !== userID) {
        return thunkAPI.rejectWithValue("Unauthorized delete");
      }

      const { data, error } = await supabase
        .from("tblcomment")
        .delete()
        .eq("commentID", commentID)
        .select();

      console.log("Delete result:", data);

      if (error) {
        console.error("Delete error:", error);
        return thunkAPI.rejectWithValue(error.message);
      }

      if (!data || data.length === 0) {
        return thunkAPI.rejectWithValue("Delete blocked (likely RLS policy)");
      }

      return { commentID, blogID };
    } catch (err: any) {
      console.error("Thunk crash:", err);
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


//Edit Comment
export const editComment = createAsyncThunk<
  BlogComment,
  { commentID: string; userID: string; content: string; file?: File; removeImage?: boolean },
  { rejectValue: string }
>("blog/editComment", async ({ commentID, userID, content, file, removeImage }, thunkAPI) => {
  try {
    let uploadedImagePath: string | null | undefined = undefined;

    if (file) {
      uploadedImagePath = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;

            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas not supported");

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

            if (compressedBase64.length > 900_000)
              return reject("Please choose a smaller image.");

            resolve(compressedBase64);
          };

          img.onerror = () => reject("Image load failed");
        };

        reader.onerror = () => reject("File reading failed");
      });
    }

    if (removeImage) uploadedImagePath = null;

    const updatePayload: any = { content };

    if (uploadedImagePath !== undefined) {
      updatePayload.imagePath = uploadedImagePath;
    }

    const { error: updateError } = await supabase
      .from("tblcomment")
      .update(updatePayload)
      .eq("commentID", commentID)
      .eq("userID", userID);

    if (updateError)
      return thunkAPI.rejectWithValue(updateError.message);

    const { data, error } = await supabase
      .from("vw_comment_with_user")
      .select("*")
      .eq("commentID", commentID)
      .single();

    if (error || !data)
      return thunkAPI.rejectWithValue(error?.message ?? "Failed to fetch comment");

    return {
      commentID: data.commentID,
      blogID: data.blogID,
      userID: data.userID,
      content: data.content,
      created_at: data.created_at ?? undefined,
      userName: data.userName ?? "User",
      userAvatar: data.userAvatar ?? undefined,
      imagePath: data.imagePath ?? undefined,
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});


// FETCH SINGLE BLOG
export const fetchSingleBlog = createAsyncThunk<
  Blog,
  string,
  { rejectValue: string }
>("blog/fetchSingleBlog", async (blogID, thunkAPI) => {
  try {
    const { data: b, error: blogError } = await supabase
      .from("tblblog")
      .select("*")
      .eq("blogID", blogID)
      .single();

    if (blogError || !b)
      return thunkAPI.rejectWithValue(blogError?.message ?? "Blog not found");

    const { data: imagesData } = await supabase
      .from("tblimage")
      .select("*")
      .eq("blogID", blogID)
      .order("sortOrder", { ascending: true });

    const { data: commentsData } = await supabase
      .from("vw_comment_with_user")
      .select("*")
      .eq("blogID", blogID)
      .order("created_at", { ascending: true });

    const formattedComments: BlogComment[] =
      commentsData?.map((c: any) => ({
        commentID: c.commentID,
        blogID: c.blogID,
        userID: c.userID,
        content: c.content,
        created_at: c.created_at,
        userName: c.userName ?? "User",
        userAvatar: c.userAvatar ?? undefined,
        imagePath: c.imagePath ?? undefined,
      })) ?? [];

    const { data: authorData } = await supabase
      .from("tbluser")
      .select("name, image")
      .eq("userID", b.userID)
      .single();

    return {
      id: b.blogID,
      title: b.title,
      content: b.content,
      authorID: b.userID,
      authorName: authorData?.name ?? "User",
      authorAvatar: authorData?.image ?? undefined,
      created_at: b.created_at,
      images: imagesData ?? [],
      comments: formattedComments,
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
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
      .addCase(fetchAllBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllBlogs.fulfilled,
        (state, action: PayloadAction<{ data: Blog[]; total: number }>) => {
          state.loading = false;
          state.blogs = action.payload.data;
          state.total = action.payload.total;
        },
      )
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(
        addComment.fulfilled,
        (state, action: PayloadAction<BlogComment>) => {
          const comment = action.payload;
          const blog = state.blogs.find((b) => b.id === comment.blogID);
          if (blog) {
            blog.comments = [...(blog.comments ?? []), comment];
          }
        },
      )
      .addCase(fetchSingleBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.singleBlog = null;
      })
      .addCase(
        fetchSingleBlog.fulfilled,
        (state, action: PayloadAction<Blog>) => {
          state.loading = false;
          state.singleBlog = action.payload;
        },
      )
      .addCase(fetchSingleBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleBlog = null;
      })
      .addCase(UpdateBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(UpdateBlog.fulfilled, (state, action: PayloadAction<Blog>) => {
        state.loading = false;
        const updated = action.payload;

        const index = state.blogs.findIndex((b) => b.id === updated.id);
        if (index !== -1) {
          state.blogs[index] = {
            ...state.blogs[index],
            ...updated,
          };
        }
        if (state.singleBlog?.id === updated.id) {
          state.singleBlog = {
            ...state.singleBlog,
            ...updated,
          };
        }
        state.success = "Blog updated successfully";
      })
      .addCase(UpdateBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(DeleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter((blog) => blog.id !== action.payload);
        state.success = "Blog deleted successfully!";
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { blogID, commentID } = action.payload;

        const blog = state.blogs.find(b => b.id === blogID);

        if (blog?.comments) {
          blog.comments = blog.comments.filter(c => c.commentID !== commentID);
        }
      })
      .addCase(editComment.fulfilled, (state, action: PayloadAction<BlogComment>) => {
        const updated = action.payload;

        if (state.singleBlog?.comments) {
          const index = state.singleBlog.comments.findIndex(c => c.commentID === updated.commentID);
          if (index !== -1) {
            state.singleBlog.comments[index] = updated;
          }
        }
        const blog = state.blogs.find(b => b.id === updated.blogID);
        if (blog?.comments) {
          const index = blog.comments.findIndex(c => c.commentID === updated.commentID);
          if (index !== -1) {
            blog.comments[index] = updated;
          }
        }
      });
  },
});

export const { clearError, clearSuccess } = blogSlice.actions;
export default blogSlice.reducer;