import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import '../style/bloglist.css'
import {
  clearSingleBlog,
  FetchSingleBlog,
  deleteBlog,
  clearError,
  clearSuccess,
} from "../hooks/blog";
import Button from "../components/Button";
import Alerts from "../components/Alerts";
import "../style/bloglist.css";
import { faX } from "@fortawesome/free-solid-svg-icons";

const DeleteBlog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { singleBlog, loading, error, success } = useSelector(
    (state: RootState) => state.blog
  );

  useEffect(() => {
    dispatch(clearSingleBlog());
    if (id) {
      dispatch(FetchSingleBlog({ id: Number(id) }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        navigate("/bloglist");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  if (loading || !singleBlog) {
    return (
      <div
        className="bars-loader-wrapper d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="bars-loader">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (singleBlog) {
      dispatch(deleteBlog(singleBlog.id));
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div
        className="card shadow-lg border-0 my-custom-card"
        style={{ position: "relative" }}
      >
        <Button
          onClick={() => navigate("/bloglist")}
          colorVariant="link"
          icon={faX}
          className="btn-close-abs"
        />
        <div className="card-body p-4">
          <h3 className="text-center fw-bold mb-3 text-danger">Delete Blog</h3>

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

          <div className="mb-3 text-center">
            {singleBlog.image && (
              <img
                src={singleBlog.image}
                alt={singleBlog.title}
                className="img-fluid rounded mb-2"
                style={{ maxHeight: 250, objectFit: "cover" }}
              />
            )}
            <h5 className="fw-bold">{singleBlog.title}</h5>
            <p>{singleBlog.content}</p>
          </div>

          <p className="text-center text-danger fw-bold">
            Are you sure you want to delete this blog?
          </p>

          <Button
            colorVariant="danger"
            onClick={handleDelete}
            className="w-100 mt-3 justify-content-center"
          >
            Delete
          </Button>

          <Button
            colorVariant="light"
            onClick={() => navigate("/bloglist")}
            className="w-100 mt-2 justify-content-center border"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBlog;
