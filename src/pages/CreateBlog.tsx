import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faImage } from "@fortawesome/free-solid-svg-icons";
import type { AppDispatch, RootState } from "../store";
import { AddBlog, clearError, clearSuccess } from "../hooks/blog";
import FormField from "../components/FormField";
import "../style/createblog.css";

const MAX_IMAGES = 10;

interface BlogImage {
  imagePath: string;
  altText: string;
  sortOrder: number;
}

type ImagePreview = { file: File; url: string };

const CreateBlog = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.userauth.user);
  const { success, loading, error } = useSelector(
    (state: RootState) => state.blog,
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [imagePreviews]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(
      0,
      MAX_IMAGES - imagePreviews.length,
    );
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setImages((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve) => {
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
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });

  const handleSubmit = async () => {
    if (!user?.userID) return;

    const compressedImages = await Promise.all(
      imagePreviews.map((img) => compressImage(img.file)),
    );

    const imagesToUpload: BlogImage[] = compressedImages.map(
      (imgData, index) => ({
        imagePath: imgData,
        altText: `Image ${index + 1}`,
        sortOrder: index,
      }),
    );

    try {
      await dispatch(
        AddBlog({
          title,
          content,
          userID: user.userID,
          images: imagesToUpload,
        }),
      ).unwrap();

      setTimeout(() => {
        dispatch(clearSuccess());
        handleClearForm();
        navigate("/bloglist");
      }, 1500);
    } catch (err) {
      console.error("Failed to add blog", err);
    }
  };

  const handleClearForm = () => {
    setTitle("");
    setContent("");
    setImages([]);
    setImagePreviews([]);
    const fileInput = document.getElementById(
      "image-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="create-blog-wrapper">
      <div className="post-card bw-card">
        <div className="post-header">
          <h3>Create Post</h3>
          <button className="close-btn" onClick={() => navigate("/bloglist")}>
            <FontAwesomeIcon icon={faX} />
          </button>
        </div>

        {success && (
          <p
            style={{
              color: "green",
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 15,
              textAlign: "center",
            }}
          >
            {success}
          </p>
        )}
        {error && (
          <p
            style={{
              color: "red",
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 15,
              textAlign: "center",
            }}
          >
            {error}
          </p>
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
          <div className="image-preview-grid">
            {imagePreviews.map((img, i) => (
              <div key={img.url} className="preview-img-wrapper">
                <img
                  src={img.url}
                  className="preview-img"
                  alt={`preview-${i}`}
                />
                <button
                  className="remove-img-btn"
                  onClick={() => removeImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <p className="selected-images-info">
            {images.length} / {MAX_IMAGES} images selected
          </p>
        )}

        <div className="post-actions">
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

        <div className="post-buttons">
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
          <button className="btn-clear" onClick={handleClearForm}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
