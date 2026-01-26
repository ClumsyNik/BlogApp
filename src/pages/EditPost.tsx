import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faX,
  faImage,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import FormField from "../components/FormField";
import Alerts from "../components/Alerts";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { UpdateBlog, DeleteBlog } from "../hooks/blog";
import "../style/editpost.css";

const MAX_IMAGES = 10;

interface BlogImage {
  imageID: string;
  imagePath: string;
  altText?: string;
}

interface LocationState {
  blog?: {
    id: string;
    title: string;
    content: string;
    images?: BlogImage[];
  };
}

interface PreviewImage {
  imageID?: string;
  url: string;
  isNew: boolean;
}

const EditPost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const prefillBlog = (location.state as LocationState)?.blog;
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<PreviewImage[]>([]);
  const [removedImageIDs, setRemovedImageIDs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (prefillBlog) {
      setTitle(prefillBlog.title);
      setContent(prefillBlog.content);
      const previews =
        prefillBlog.images?.map((img) => ({
          imageID: img.imageID,
          url: img.imagePath,
          isNew: false,
        })) ?? [];
      setImagePreviews(previews);
    }
  }, [prefillBlog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(
      0,
      MAX_IMAGES - imagePreviews.length,
    );

    setNewImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((file) => ({
        url: URL.createObjectURL(file),
        isNew: true,
      })),
    ]);
  };

  const removeImage = (index: number) => {
    const img = imagePreviews[index];

    if (!img.isNew && img.imageID) {
      setRemovedImageIDs((prev) => [...prev, img.imageID!]);
    } else if (img.isNew) {
      const newIndex = imagePreviews
        .slice(0, index)
        .filter((img) => img.isNew).length;

      setNewImages((prev) => prev.filter((_, i) => i !== newIndex));
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!prefillBlog?.id) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await dispatch(
        UpdateBlog({
          blogID: prefillBlog.id,
          title,
          content,
          newImages,
          removedImageIDs,
        }),
      ).unwrap();

      setSuccess("Post updated successfully!");
      setTimeout(() => navigate("/bloglist"), 1000);
    } catch (err: any) {
      setError(err || "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (blogID: string) => {
    if (!blogID) return;

    try {
      await dispatch(DeleteBlog(blogID)).unwrap();
      setSuccess("Post deleted successfully!");
      setTimeout(() => navigate("/bloglist"), 1500);
    } catch (err: any) {
      setError(err || "Failed to delete post");
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleClearForm = () => {
    setTitle("");
    setContent("");
    setNewImages([]);
    setImagePreviews([]);
    setRemovedImageIDs([]);
  };

  return (
    <div className="create-blog-wrapper">
      <div className="post-card bw-card">
        <div className="post-header d-flex justify-content-between align-items-center position-relative">
          <h3>Edit Post</h3>

          <div className="menu-wrapper">
            <button className="menu-btn">
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>

            <div className="dropdown-menu">
              <button onClick={() => setConfirmDelete(true)}>
                Delete Post
              </button>
            </div>
          </div>
        </div>

        {success && (
          <p
            style={{
              color: "#000",
              backgroundColor: "#f0f0f0",
              padding: "10px 15px",
              borderRadius: 6,
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            {success}
          </p>
        )}
        {error && (
          <p
            style={{
              color: "#fff",
              backgroundColor: "#000",
              padding: "10px 15px",
              borderRadius: 6,
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            {error}
          </p>
        )}

        {confirmDelete && (
          <div
            className="alert-modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <Alerts
              type="warning"
              message={
                <div>
                  <p
                    style={{ fontSize: 22, fontWeight: 600, marginBottom: 25 }}
                  >
                    Are you sure you want to delete this post?
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "15px",
                    }}
                  >
                    <button
                      className="btn-submit"
                      onClick={() => handleDeletePost(prefillBlog?.id!)}
                    >
                      Yes, Delete
                    </button>
                    <button
                      className="btn-clear"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              }
            />
          </div>
        )}

        <FormField
          id="title"
          classname="post-input"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <FormField
          id="content"
          classname="post-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          textarea
          rows={5}
        />

        {imagePreviews.length > 0 && (
          <div className="image-preview-grid mt-3">
            {imagePreviews.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                className="preview-img-wrapper position-relative"
              >
                <img
                  src={img.url}
                  className="preview-img"
                  alt={`preview-${i}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setModalImage(img.url)}
                />
                <button
                  className="remove-img-btn position-absolute"
                  onClick={() => removeImage(i)}
                  style={{
                    top: 5,
                    right: 5,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    cursor: "pointer",
                  }}
                >
                  <FontAwesomeIcon icon={faX} />
                </button>
              </div>
            ))}
          </div>
        )}

        {imagePreviews.length > 0 && (
          <p className="selected-images-info mt-2">
            {imagePreviews.length} / {MAX_IMAGES} images selected
          </p>
        )}

        <div className="post-actions mt-2">
          <label htmlFor="image-upload" className="image-upload-btn">
            <FontAwesomeIcon icon={faImage} /> Add photos
          </label>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </div>

        <div className="post-buttons mt-3">
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Post"}
          </button>
          <button className="btn-clear" onClick={handleClearForm}>
            Clear
          </button>
        </div>
      </div>

      {modalImage && (
        <div
          className="image-modal"
          onClick={() => setModalImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <img
            src={modalImage}
            alt="Modal Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "8px",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EditPost;
