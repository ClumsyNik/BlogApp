import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { fetchSingleBlog, addComment } from "../hooks/blog";
import Loader from "../components/Loader";
import ImageAvatar from "../components/ImageAvatar";
import Button from "../components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faCommentDots,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

const ViewPost = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { singleBlog: blog, loading } = useSelector(
    (state: RootState) => state.blog,
  );
  const { user } = useSelector((state: RootState) => state.userauth);

  const [commentInputs, setCommentInputs] = useState<{
    [blogId: string]: { text: string; file?: File };
  }>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchSingleBlog(id));
  }, [id, dispatch]);

  const handleAddComment = (blogID: string) => {
    const input = commentInputs[blogID];
    if (!input || (!input.text && !input.file) || !user?.userID) return;

    dispatch(
      addComment({
        blogID,
        userID: user.userID,
        content: input.text,
        file: input.file,
      }),
    );

    setCommentInputs((prev) => ({
      ...prev,
      [blogID]: { text: "", file: undefined },
    }));
  };

  const openImageModal = (src: string) => setModalImage(src);
  const closeImageModal = () => setModalImage(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <Loader />;
  if (!blog) return <p className="text-center mt-5">Post not found</p>;

  const commentsToShow = showAllComments
    ? (blog.comments ?? [])
    : (blog.comments?.slice(0, 2) ?? []);

  return (
    <div className="bloglist-wrapper">
      <div className="blog-card shadow-sm">
        {/* Blog Header */}
        <div className="blog-header d-flex align-items-center gap-2">
          <ImageAvatar src={blog.authorAvatar} size={42} />
          <div>
            <p className="fw-semibold mb-0">{blog.authorName}</p>
            <small className="text-muted">{formatDate(blog.created_at)}</small>
          </div>
        </div>

        <div className="blog-content mt-2">
          <p className="mb-2">Title: {blog.title}</p>
          <p className="mb-2">{blog.content}</p>
        </div>

        {blog.images && blog.images.length > 0 && (
          <div className="blog-image-grid mt-2">
            {blog.images.map((img, idx) => (
              <div key={idx} className="blog-image-wrapper">
                <img
                  src={img.imagePath}
                  alt={img.altText || `image-${idx}`}
                  className="blog-image"
                  onClick={() => openImageModal(img.imagePath)}
                />
              </div>
            ))}
          </div>
        )}

        <div
          className="blog-actions d-flex mt-3"
          style={{
            justifyContent: "space-around",
            borderTop: "1px solid #eee",
            paddingTop: "8px",
          }}
        >
          <div
            className={`d-flex align-items-center gap-2 ${liked ? "text-primary fw-semibold" : "text-muted"}`}
            style={{ cursor: "pointer" }}
            onClick={() => setLiked((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faThumbsUp} />
            {liked ? "Liked" : "Like"}
          </div>

          <div
            className="d-flex align-items-center gap-2 text-muted"
            style={{ cursor: "pointer" }}
            onClick={() =>
              document.getElementById(`comment-input-${blog.id}`)?.focus()
            }
          >
            <FontAwesomeIcon icon={faCommentDots} />
            Comment
          </div>
        </div>

        <hr className="my-2" />

        <div className="blog-comments">
          {commentsToShow.map((c) => (
            <div key={c.commentID} className="comment mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <ImageAvatar src={c.userAvatar ?? undefined} size={36} />
                <p className="fw-semibold mb-0">{c.userName ?? "User"}</p>
              </div>
              <p className="mb-1 ms-5">{c.content}</p>
              {c.imagePath && (
                <div className="ms-5 mb-1">
                  <img
                    src={c.imagePath}
                    alt="comment-img"
                    className="comment-image rounded"
                    onClick={() => c.imagePath && openImageModal(c.imagePath)}
                  />
                </div>
              )}
              <small className="text-muted ms-5">
                {formatDate(c.created_at)}
              </small>
            </div>
          ))}

          {blog.comments && blog.comments.length > 3 && (
            <div
              className="text-center text-primary fw-semibold"
              style={{ cursor: "pointer", marginBottom: "8px" }}
              onClick={() => setShowAllComments((prev) => !prev)}
            >
              {showAllComments
                ? "Hide comments"
                : `View ${blog.comments.length - 2} more comment(s)`}
            </div>
          )}

          {user && (
            <div className="add-comment d-flex align-items-center gap-2 mt-2">
              <ImageAvatar src={user?.image ?? undefined} size={40} />
              <input
                type="text"
                placeholder="Write a comment..."
                className="form-control rounded-pill"
                id={`comment-input-${blog.id}`}
                value={commentInputs[blog.id]?.text || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [blog.id]: { ...prev[blog.id], text: e.target.value },
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment(blog.id);
                }}
              />
              <input
                type="file"
                accept="image/*"
                id={`comment-file-${blog.id}`}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (commentInputs[blog.id]?.file) {
                    alert("You can only attach one image per comment.");
                    return;
                  }
                  setCommentInputs((prev) => ({
                    ...prev,
                    [blog.id]: { ...prev[blog.id], file },
                  }));
                }}
              />
              <Button
                onClick={() =>
                  document.getElementById(`comment-file-${blog.id}`)?.click()
                }
                colorVariant="light"
                className="d-flex align-items-center justify-content-center rounded-circle px-3"
              >
                <FontAwesomeIcon icon={faImage} />
              </Button>
              <Button
                onClick={() => handleAddComment(blog.id)}
                colorVariant="dark"
                className="d-flex align-items-center justify-content-center rounded-circle px-3"
              >
                <FontAwesomeIcon icon={faCommentDots} />
              </Button>
            </div>
          )}

          {commentInputs[blog.id]?.file && (
            <div className="mt-1 ms-5">
              <small className="text-muted">
                Selected: {commentInputs[blog.id]?.file?.name}
              </small>
            </div>
          )}
        </div>
      </div>

      {modalImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <span className="close-modal">&times;</span>
          <img src={modalImage} alt="Modal" className="modal-content" />
        </div>
      )}
    </div>
  );
};

export default ViewPost;
