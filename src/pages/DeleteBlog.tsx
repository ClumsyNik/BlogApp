import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import "../style/bloglist.css";
import {
  clearSingleBlog,
  FetchSingleBlog,
  deleteBlog,
  clearError,
  clearSuccess,
} from "../hooks/blog";
import Button from "../components/Button";
import Alerts from "../components/Alerts";
import { faX } from "@fortawesome/free-solid-svg-icons";
import Loader from "../components/Loader";

const DeleteBlog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { singleBlog, loadingSingleBlog, error, success } = useSelector(
    (state: RootState) => state.blog
  );

  useEffect(() => {
    if (id) {
      dispatch(FetchSingleBlog({ id: Number(id) })).finally(() => {
        setIsInitialLoad(false);
      });
    }
  }, [dispatch, id]);

  useEffect(() => {
    return () => {
      dispatch(clearSingleBlog());
      dispatch(clearError());
      dispatch(clearSuccess());
    };
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        navigate("/bloglist", { replace: true });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  const handleDelete = () => {
    if (singleBlog) {
      dispatch(deleteBlog(singleBlog.id));
    }
  };

  if (isInitialLoad || loadingSingleBlog) {
    return <Loader />;
  }

  if (!singleBlog && !success) {
    return <Navigate to="/bloglist" replace />;
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div
        className="card shadow-lg border-0 my-custom-card"
        style={{ maxWidth: "500px", width: "100%" }}
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

          {singleBlog && (
            <>
              <div className="mb-3 text-center">
                {singleBlog.image && (
                  <img
                    src={singleBlog.image}
                    alt={singleBlog.title}
                    className="img-fluid rounded mb-2"
                    style={{
                      maxHeight: 200,
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <h5 className="fw-bold mt-2">{singleBlog.title}</h5>
                <p className="text-muted small text-truncate-2">
                  {singleBlog.content}
                </p>
              </div>

              <p className="text-center text-danger fw-bold mb-4">
                Are you sure you want to delete this blog?
              </p>

              <div className="d-grid gap-2">
                <Button
                  colorVariant="danger"
                  onClick={handleDelete}
                  className="py-2 fw-bold"
                >
                  {success ? "Deleting..." : "Confirm Delete"}
                </Button>

                <Button
                  colorVariant="light"
                  onClick={() => navigate("/bloglist")}
                  className="py-2 border"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteBlog;