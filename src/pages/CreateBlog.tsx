import { useState, useEffect } from "react";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { useDispatch, useSelector } from "react-redux";
import { clearSuccess, AddBlog, clearError } from "../hooks/blog";
import type { AppDispatch, RootState } from "../store";
import { useNavigate } from "react-router-dom";
import "../style/createblog.css";
import Alerts from "../components/Alerts";
import { faX } from "@fortawesome/free-solid-svg-icons/faX";
import "../style/createblog.css";

const CreateBlog = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.userauth.user);
  const { success, loading, error } = useSelector(
    (state: RootState) => state.blog
  );

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, []);

  const handleSubmit = () => {
    if (!user?.userID) {
      return;
    }

    const blogPayload = {
      title,
      content,
      authorID: user.userID,
      image: "",
    };

    if (!image) {
      dispatch(clearError());
      dispatch(AddBlog(blogPayload));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(image);

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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

        dispatch(AddBlog({ ...blogPayload, image: compressedBase64 }))
          .unwrap()
          .then(() => {
            setTimeout(() => {
              dispatch(clearSuccess());
              handleClearForm();
              navigate("/bloglist");
            }, 1500);
          });
      };
    };
  };

  const handleClearForm = () => {
    setImage(null);
    setImagePreview("");
    setTitle("");
    setContent("");
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <>
      <div className="main-container">
        <div
          className="card shadow-lg border-0 my-custom-card"
          style={{ position: "relative" }}
        >
          <Button
            onClick={() => navigate("/bloglist")}
            colorVariant="link"
            icon={faX}
            className="btn-close-abs"
          ></Button>
          <div className="card-body p-4">
            <h3 className="text-center fw-bold mb-3">Add Blog</h3>
            {success && (
              <Alerts
                type="success"
                message={success || ""}
                onClose={clearSuccess}
              ></Alerts>
            )}
            <div className="mb-3 text-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="img-fluid rounded"
                  style={{ maxHeight: 200, width: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 180,
                    backgroundColor: "#e9ecef",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#6c757d",
                    borderRadius: 8,
                    fontSize: "0.9rem",
                  }}
                >
                  No Image Selected
                </div>
              )}
            </div>

            <div className="mb-3">
              <FormField
                label="Image"
                type="file"
                id="image"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setImage(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                accept="image/*"
              />
            </div>

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
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {error && (
              <Alerts
                type="error"
                message={error}
                onClose={() => dispatch(clearError())}
              />
            )}

            <Button
              colorVariant="dark"
              onClick={handleSubmit}
              className="w-100 mt-3 justify-content-center"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>

            <Button
              colorVariant="light"
              onClick={handleClearForm}
              className="w-100 mt-2 justify-content-center border"
            >
              Clear Form
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateBlog;
