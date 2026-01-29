import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { fetchSingleBlog, addComment, editComment, deleteComment } from "../hooks/blog";
import Loader from "../components/Loader";
import ImageAvatar from "../components/ImageAvatar";
import Button from "../components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faCommentDots, faImage, faEllipsis } from "@fortawesome/free-solid-svg-icons";

const ViewPost = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { singleBlog: blog, loading } = useSelector((state: RootState) => state.blog);
  const { user } = useSelector((state: RootState) => state.userauth);

  const [commentInputs, setCommentInputs] = useState<{ [blogId: string]: { text: string; file?: File } }>({});
  const [editingComment, setEditingComment] = useState<{ [commentID: string]: { text: string; file?: File; removeImage?: boolean } }>({});
  const [imagePreview, setImagePreview] = useState<{ [commentID: string]: string }>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);

  useEffect(() => {
    if (id) dispatch(fetchSingleBlog(id));
  }, [id, dispatch]);

  const handleAddComment = (blogID: string) => {
    const input = commentInputs[blogID];
    if (!input || (!input.text && !input.file) || !user?.userID) return;

    dispatch(addComment({ blogID, userID: user.userID, content: input.text, file: input.file }));
    setCommentInputs(prev => ({ ...prev, [blogID]: { text: "", file: undefined } }));
  };

  const handleEditComment = async (commentID: string) => {
    if (!user?.userID) return;
    const edit = editingComment[commentID];
    if (!edit) return;

    try {
      await dispatch(editComment({
        commentID,
        userID: user.userID,
        content: edit.text,
        file: edit.file,
        removeImage: edit.removeImage
      })).unwrap();

      setEditingComment(prev => {
        const copy = { ...prev };
        delete copy[commentID];
        return copy;
      });
      setImagePreview(prev => {
        const copy = { ...prev };
        delete copy[commentID];
        return copy;
      });
      setOpenCommentMenu(null);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDeleteComment = async (commentID: string) => {
    if (!user?.userID || !blog?.id) return;
    try {
      await dispatch(deleteComment({ commentID, userID: user.userID, blogID: blog.id })).unwrap();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const openImageModal = (src?: string | null) => {
    if (!src) return;
    setModalImage(src);
  };
  const closeImageModal = () => setModalImage(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) return <Loader />;
  if (!blog) return <p className="text-center mt-5">Post not found</p>;

  const commentsToShow = showAllComments ? (blog.comments ?? []) : (blog.comments?.slice(0, 2) ?? []);

  return (
    <div className="bloglist-wrapper">
      <div className="blog-card shadow-sm">
        <div className="blog-header d-flex align-items-center gap-2">
          <ImageAvatar src={blog.authorAvatar ?? undefined} size={42} />
          <div>
            <p className="fw-semibold mb-0">{blog.authorName}</p>
            <small className="text-muted">{formatDate(blog.created_at)}</small>
          </div>
        </div>

        <div className="blog-content mt-2">
          <p className="mb-2">Title: {blog.title}</p>
          <p className="mb-2">{blog.content}</p>
        </div>

        {blog.images?.length ? (
          <div className="blog-image-grid mt-2">
            {blog.images.map((img, idx) => (
              <div key={idx} className="blog-image-wrapper">
                <img
                  src={img.imagePath}
                  alt={img.altText || `image-${idx}`}
                  className="blog-image"
                  onClick={() => img.imagePath && openImageModal(img.imagePath)}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="blog-actions d-flex mt-3" style={{ justifyContent: "space-around", borderTop: "1px solid #eee", paddingTop: "8px" }}>
          <div
            className={`d-flex align-items-center gap-2 ${liked ? "text-primary fw-semibold" : "text-muted"}`}
            style={{ cursor: "pointer" }}
            onClick={() => setLiked(prev => !prev)}
          >
            <FontAwesomeIcon icon={faThumbsUp} /> {liked ? "Liked" : "Like"}
          </div>
          <div
            className="d-flex align-items-center gap-2 text-muted"
            style={{ cursor: "pointer" }}
            onClick={() => document.getElementById(`comment-input-${blog.id}`)?.focus()}
          >
            <FontAwesomeIcon icon={faCommentDots} /> Comment
          </div>
        </div>

        <hr className="my-2" />

        <div className="blog-comments">
          {commentsToShow.map(c => {
            const isEditing = editingComment[c.commentID] !== undefined;
            return (
              <div key={c.commentID} className="comment mb-3 position-relative">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <ImageAvatar src={c.userAvatar ?? undefined} size={36} />
                  <p className="fw-semibold mb-0">{c.userName ?? "User"}</p>

                  {c.userID === user?.userID && !isEditing && (
                    <div className="ms-auto position-relative comment-menu-wrapper">
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); setOpenCommentMenu(prev => prev === c.commentID ? null : c.commentID); }}
                      >
                        <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
                      </span>
                      {openCommentMenu === c.commentID && (
                        <div className="comment-menu position-absolute bg-white shadow rounded">
                          <p
                            className="mb-0 p-2 comment-menu-item"
                            onClick={() => setEditingComment(prev => ({ ...prev, [c.commentID]: { text: c.content } }))}
                          >Edit</p>
                          <p
                            className="mb-0 p-2 comment-menu-item text-danger"
                            onClick={() => handleDeleteComment(c.commentID)}
                          >Delete</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-1">
                    <input
                      type="text"
                      className="form-control"
                      value={editingComment[c.commentID]?.text || ""}
                      onChange={e => setEditingComment(prev => ({ ...prev, [c.commentID]: { ...prev[c.commentID], text: e.target.value } }))}
                      onKeyDown={e => { if (e.key === "Enter") handleEditComment(c.commentID); }}
                    />

                    {!editingComment[c.commentID]?.removeImage && (c.imagePath || imagePreview[c.commentID]) && (
                      <div className="mt-2 position-relative">
                        <img src={imagePreview[c.commentID] || c.imagePath} className="comment-image rounded" />
                        <button
                          className="btn btn-sm btn-danger position-absolute top-0 end-0"
                          onClick={() => setEditingComment(prev => ({ ...prev, [c.commentID]: { ...prev[c.commentID], removeImage: true, file: undefined } }))}
                        >✕</button>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      id={`edit-file-${c.commentID}`}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const previewURL = URL.createObjectURL(file);
                        setImagePreview(prev => ({ ...prev, [c.commentID]: previewURL }));
                        setEditingComment(prev => ({ ...prev, [c.commentID]: { ...prev[c.commentID], file, removeImage: false } }));
                      }}
                    />

                    <div className="mt-2 d-flex gap-2">
                      <Button size="sm" colorVariant="light" onClick={() => document.getElementById(`edit-file-${c.commentID}`)?.click()}>Change Image</Button>
                      <Button size="sm" colorVariant="dark" onClick={() => handleEditComment(c.commentID)}>Save</Button>
                      <Button size="sm" colorVariant="light" onClick={() => {
                        setEditingComment(prev => { const copy = { ...prev }; delete copy[c.commentID]; return copy; });
                        setImagePreview(prev => { const copy = { ...prev }; delete copy[c.commentID]; return copy; });
                      }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-1 ms-5">{c.content}</p>
                    {c.imagePath && (
                      <div className="ms-5 mb-1">
                        <img src={c.imagePath} alt="comment-img" className="comment-image rounded" onClick={() => c.imagePath && openImageModal(c.imagePath)} />
                      </div>
                    )}
                  </>
                )}
                <small className="text-muted ms-5">{formatDate(c.created_at)}</small>
              </div>
            );
          })}

          {blog.comments && blog.comments.length > 2 && (
            <div className="text-center text-primary fw-semibold" style={{ cursor: "pointer", marginBottom: "8px" }} onClick={() => setShowAllComments(prev => !prev)}>
              {showAllComments ? "Hide comments" : `View ${blog.comments.length - 2} more comment(s)`}
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
                onChange={e => setCommentInputs(prev => ({ ...prev, [blog.id]: { ...prev[blog.id], text: e.target.value } }))}
                onKeyDown={e => { if (e.key === "Enter") handleAddComment(blog.id); }}
              />
              <input
                type="file"
                accept="image/*"
                id={`comment-file-${blog.id}`}
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (commentInputs[blog.id]?.file) { alert("You can only attach one image per comment."); return; }
                  setCommentInputs(prev => ({ ...prev, [blog.id]: { ...prev[blog.id], file } }));
                }}
              />
              <Button onClick={() => document.getElementById(`comment-file-${blog.id}`)?.click()} colorVariant="light" className="d-flex align-items-center justify-content-center rounded-circle px-3">
                <FontAwesomeIcon icon={faImage} />
              </Button>
              <Button onClick={() => handleAddComment(blog.id)} colorVariant="dark" className="d-flex align-items-center justify-content-center rounded-circle px-3">
                <FontAwesomeIcon icon={faCommentDots} />
              </Button>
            </div>
          )}

          {commentInputs[blog.id]?.file && (
            <div className="mt-1 ms-5">
              <small className="text-muted">Selected: {commentInputs[blog.id]?.file?.name}</small>
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
