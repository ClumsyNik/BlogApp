import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { updateBlog, clearError, clearSuccess } from "../hooks/blog";
import Button from "../components/Button";
import FormField from "../components/FormField";
import "../style/bloglist.css";
import { faX } from "@fortawesome/free-solid-svg-icons";
import Alerts from "../components/Alerts";
import { useRef } from "react";

const UpdateBlog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const redirect = useRef(false);

  const { success, error, loading } = useSelector(
    (state: RootState) => state.blog
  );

  const blog = useSelector((state: RootState) =>
    state.blog.blogs.find((b) => b.id === Number(id))
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (blog) {
      setTitle(blog.title);
      setContent(blog.content);
      setImagePreview(blog.image);
    }
  }, [blog]);

  useEffect(() => {
    if (success && !redirect.current) {
      redirect.current = true;

      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  if (!blog) {
    return <p className="text-center mt-5">Blog not found.</p>;
  }

  const handleUpdate = () => {
    if (!title || !content) return;

    if (!imageFile) {
      dispatch(
        updateBlog({
          id: blog.id,
          title,
          content,
          image: blog.image,
        })
      );
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(imageFile);

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
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.7);

        dispatch(
          updateBlog({
            id: blog.id,
            title,
            content,
            image: compressedImage,
          })
        );
      };
    };
  };

  const handleReset = () => {
    setTitle(blog.title);
    setContent(blog.content);
    setImageFile(null);
    setImagePreview(blog.image);

    const fileInput = document.getElementById("photo") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div className="card shadow-lg border-0 my-custom-card position-relative">
        <Button
          onClick={() => navigate("/bloglist")}
          colorVariant="link"
          icon={faX}
          className="btn-close-abs"
        />

        <div className="card-body p-4">
          <h3 className="text-center fw-bold mb-3">Update Blog</h3>

          {error && (
            <Alerts
              type="error"
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}

          {success && (
            <Alerts
              type="success"
              message={success}
              onClose={() => dispatch(clearSuccess())}
            />
          )}

          {imagePreview && (
            <div className="mb-3 text-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="img-fluid rounded"
                style={{ maxHeight: 250, objectFit: "cover" }}
              />
            </div>
          )}

          <FormField
            label="Blog Image"
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }
            }}
          />

          <FormField
            label="Blog Title"
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <FormField
            label="Content"
            id="content"
            type="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <Button
            colorVariant="dark"
            onClick={handleUpdate}
            className="w-100 mt-3"
          >
            {loading ? "Updating..." : "Update"}
          </Button>

          <Button
            colorVariant="light"
            onClick={handleReset}
            className="w-100 mt-2 border"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBlog;
