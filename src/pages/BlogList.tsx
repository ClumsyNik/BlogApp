import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { resetBlogState, fetchBlogsByAuthor } from "../hooks/blog";
import { logout } from "../hooks/auth";
import Pagination from "../components/Pagination";
import Card from "../components/Card";
import Button from "../components/Button";
import "../style/bloglist.css";
import {
  faPlus,
  faPowerOff,
  faEdit,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "../components/Loader";

const BlogList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.userauth);
  const { blogs, total, loading } = useSelector(
    (state: RootState) => state.blog
  );
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (!user?.userID) return;
    dispatch(
      fetchBlogsByAuthor({
        authorID: user.userID.toString(),
        page,
        perPage: ITEMS_PER_PAGE,
      })
    );
  }, [page, user?.userID, dispatch]);

  const handleLogOut = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="app-wrapper min-vh-100 pb-5">
      {!loading && (
        <nav className="navbar border-bottom sticky-top bg-white py-3">
          <div className="container-xl d-flex justify-content-between align-items-center px-4">
            <div
              className="logo-brand"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            >
              <span className="fw-black fs-4 tracking-tighter m-0">BLOG.</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                onClick={() => navigate("/create-blog")}
                colorVariant="dark"
                className="d-flex align-items-center px-3"
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>

              <Button
                onClick={handleLogOut}
                colorVariant="light"
                className="d-flex align-items-center px-3"
              >
                <FontAwesomeIcon icon={faPowerOff} />
              </Button>
            </div>
          </div>
        </nav>
      )}
      <main className="container-xl px-4 mt-5">
        {!loading && (
          <header className="mb-5">
            <p className="fw-black mb-1">{user?.name}: Blogs</p>
            <p className="text-muted small mb-0">
              {blogs.length} Out Of {total} {total > 1 ? "Posts" : "Post"}
            </p>
          </header>
        )}
        {loading ? (
          <Loader></Loader>
        ) : (
          <div className="blog-masonry-grid">
            {blogs.map((blog) => (
              <Card
                key={blog.id}
                image={blog.image}
                title={blog.title}
                content={blog.content}
                onTitleClick={() => navigate(`/update-blog/${blog.id}`)}
                actions={
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      onClick={() => navigate(`/update-blog/${blog.id}`)}
                      colorVariant="light"
                      className="btn-action-round edit-hover"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>

                    <Button
                      onClick={() => {
                        dispatch(resetBlogState());
                        navigate(`/delete/${blog.id}`);
                      }}
                      colorVariant="light"
                      className="btn-action-round delete-hover"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        {!loading && total > ITEMS_PER_PAGE && (
          <div className="py-5 d-flex justify-content-center">
            <Pagination
              currentPage={page}
              totalItems={total}
              perPage={ITEMS_PER_PAGE}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogList;
