import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { fetchAllBlogs, addComment, deleteComment, editComment } from "../hooks/blog";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import ImageAvatar from "../components/ImageAvatar";
import Button from "../components/Button";
import "../style/bloglist.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPowerOff, faThumbsUp, faCommentDots, faImage, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { logoutUser } from "../hooks/auth";

const ITEMS_PER_PAGE = 10;

const BlogList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { blogs, total, loading } = useSelector((state: RootState) => state.blog);
  const { user } = useSelector((state: RootState) => state.userauth);

  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [page, setPage] = useState(1);
  const [commentInputs, setCommentInputs] = useState<Record<string, { text: string; file?: File }>>({});
  const [likedBlogs, setLikedBlogs] = useState<Record<string, boolean>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<Record<string, { text: string; file?: File; removeImage?: boolean }>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllBlogs({ page, perPage: ITEMS_PER_PAGE }));
  }, [page, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".comment-menu-wrapper")) {
        setOpenCommentMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddComment = (blogID: string) => {
    const input = commentInputs[blogID];
    if (!input || (!input.text && !input.file) || !user?.userID) return;

    dispatch(addComment({ blogID, userID: user.userID, content: input.text, file: input.file }));

    setCommentInputs(prev => ({ ...prev, [blogID]: { text: "", file: undefined } }));
  };

  const handleDeleteComment = async (commentID: string, blogID: string) => {
    if (!user?.userID) return;

    try {
      await dispatch(deleteComment({ commentID, userID: user.userID, blogID })).unwrap();
    } catch (err) {
      console.error("Delete failed:", err);
    }
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

  const handleLike = (blogID: string) => {
    setLikedBlogs(prev => ({ ...prev, [blogID]: !prev[blogID] }));
  };

  const handleLogOut = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/");
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  const openImageModal = (src: string) => setModalImage(src);
  const closeImageModal = () => setModalImage(null);

  const displayedBlogs = showMyPosts ? blogs.filter(b => b.authorID === user?.userID) : blogs;

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Loader /></div>;

  return (
    <div className="bloglist-wrapper">
      <header className="bloglist-header">
        <nav className="navbar border-bottom sticky-top bg-white py-3">
          <div className="container-xl d-flex justify-content-between align-items-center px-4">
            <div className="logo-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="fw-bold fs-4 bolder tracking-tighter m-0">BLOG.</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button onClick={() => navigate("/create-blog")} colorVariant="dark">
                <FontAwesomeIcon icon={faPlus} />
              </Button>
              <Button onClick={handleLogOut} colorVariant="light">
                <FontAwesomeIcon icon={faPowerOff} />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {user && (
        <div className="d-flex justify-content-between align-items-center my-4">
          <div className="d-flex align-items-center gap-2">
            <ImageAvatar src={user.image ?? undefined} size={40} />
            <p className="mb-0">{user.name ?? "Anonymous"}</p>
          </div>
          <div className="my-post-toggle" onClick={() => setShowMyPosts(prev => !prev)}>
            <div className={`toggle-switch ${showMyPosts ? "on" : ""}`}>
              <span className="toggle-knob"></span>
            </div>
            <span className="toggle-label">My Post</span>
          </div>
        </div>
      )}

      <div className="blog-feed">
        {displayedBlogs.length === 0 && <p className="text-center text-muted mt-5">No blogs found.</p>}

        {displayedBlogs.map(blog => {
          const comments = blog.comments ?? [];
          const commentsToShow = showAllComments[blog.id] ? comments : comments.slice(0, 3);

          return (
            <div key={blog.id} className="blog-card shadow-sm">
              <div className="blog-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <ImageAvatar src={blog.authorAvatar ?? undefined} size={42} />
                  <div>
                    <p className="fw-semibold mb-0">{blog.authorName}</p>
                    <small className="text-muted">{formatDate(blog.created_at)}</small>
                  </div>
                </div>
                <div className="dropdown">
                  <button className="dropdown-btn">⋮</button>
                  <div className="dropdown-content">
                    <p className="dropdown-item" onClick={() => navigate(`/bloglist/blog/${blog.id}`)}>View Post</p>
                    {blog.authorID === user?.userID && (
                      <p className="dropdown-item" onClick={() => navigate(`/bloglist/edit-blog/${blog.id}`, { state: { blog } })}>Edit Post</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="blog-content mt-2">
                <p className="mb-2">Title: {blog.title}</p>
                <p className="mb-2">{blog.content}</p>
              </div>

              {Array.isArray(blog.images) && blog.images.length > 0 && (
                <div className="blog-image-grid mt-2">
                  {blog.images.map((img, idx) => (
                    <div key={idx} className="blog-image-wrapper">
                      <img src={img.imagePath} alt={img.altText || `image-${idx}`} className="blog-image" onClick={() => openImageModal(img.imagePath)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="blog-actions d-flex justify-content-evenly mt-3 px-1">
                <span className={`d-flex align-items-center gap-1 ${likedBlogs[blog.id] ? "text-primary fw-semibold" : "text-muted"}`} onClick={() => handleLike(blog.id)}>
                  <FontAwesomeIcon icon={faThumbsUp} /> {likedBlogs[blog.id] ? "Liked" : "Like"}
                </span>
                <span className="d-flex align-items-center gap-1 text-muted" style={{ cursor: "pointer" }} onClick={() => commentInputRefs.current[blog.id]?.focus()}>
                  <FontAwesomeIcon icon={faCommentDots} /> Comment
                </span>
              </div>

              <hr className="my-2" />

              <div className="blog-comments">
                {commentsToShow.length ? commentsToShow.map(c => {
                  const isEditing = editingComment[c.commentID] !== undefined;

                  return (
                    <div key={c.commentID} className="comment mb-3 position-relative">
                      <div className="d-flex align-items-start gap-2">
                        <ImageAvatar src={c.userAvatar ?? undefined} size={36} />
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between">
                            <p className="fw-semibold mb-0">{c.userName ?? "User"}</p>

                            {c.userID === user?.userID && !isEditing && (
                              <div className="comment-menu-wrapper position-relative ms-2">
                                <span
                                  className="comment-menu-toggle"
                                  style={{ cursor: "pointer" }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenCommentMenu(prev => prev === c.commentID ? null : c.commentID);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
                                </span>
                                {openCommentMenu === c.commentID && (
                                  <div className="comment-menu position-absolute bg-white shadow rounded">
                                    <p
                                      className="mb-0 p-2 comment-menu-item"
                                      onClick={() => setEditingComment(prev => ({ ...prev, [c.commentID]: { text: c.content } }))}
                                    >
                                      Edit
                                    </p>
                                    <p
                                      className="mb-0 p-2 comment-menu-item text-danger"
                                      onClick={() => handleDeleteComment(c.commentID, blog.id)}
                                    >
                                      Delete
                                    </p>
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
                                onChange={e =>
                                  setEditingComment(prev => ({
                                    ...prev,
                                    [c.commentID]: {
                                      ...prev[c.commentID],
                                      text: e.target.value
                                    }
                                  }))
                                }
                                onKeyDown={e => { if (e.key === "Enter") handleEditComment(c.commentID); }}
                              />

                              {!editingComment[c.commentID]?.removeImage && (c.imagePath || imagePreview[c.commentID]) && (
                                <div className="mt-2 position-relative">
                                  <img src={imagePreview[c.commentID] || c.imagePath} className="comment-image rounded" />
                                  <button
                                    className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                    onClick={() => setEditingComment(prev => ({
                                      ...prev,
                                      [c.commentID]: { ...prev[c.commentID], removeImage: true, file: undefined }
                                    }))}
                                  >
                                    ✕
                                  </button>
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

                                  setEditingComment(prev => ({
                                    ...prev,
                                    [c.commentID]: { ...prev[c.commentID], file, removeImage: false }
                                  }));
                                }}
                              />

                              <div className="mt-2 d-flex gap-2">
                                <Button
                                  size="sm"
                                  colorVariant="light"
                                  onClick={() => document.getElementById(`edit-file-${c.commentID}`)?.click()}
                                >
                                  Change Image
                                </Button>
                                <Button colorVariant="dark" size="sm" onClick={() => handleEditComment(c.commentID)}>Save</Button>
                                <Button colorVariant="light" size="sm" onClick={() => {
                                  setEditingComment(prev => { const copy = { ...prev }; delete copy[c.commentID]; return copy; });
                                  setImagePreview(prev => { const copy = { ...prev }; delete copy[c.commentID]; return copy; });
                                }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="mb-1">{c.content}</p>
                              {c.imagePath && (
                                <img src={c.imagePath} alt="comment-img" className="comment-image rounded" onClick={() => openImageModal(c.imagePath!)} />
                              )}
                            </>
                          )}

                          <small className="text-muted">{formatDate(c.created_at)}</small>
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-muted small">No comments yet.</p>}

                {comments.length > 3 && (
                  <p className="text-primary small ms-5 mb-2" style={{ cursor: "pointer" }} onClick={() => setShowAllComments(prev => ({ ...prev, [blog.id]: !prev[blog.id] }))}>
                    {showAllComments[blog.id] ? "View less comments" : "View more comments"}
                  </p>
                )}

                {user && (
                  <div className="add-comment d-flex align-items-center gap-2 mt-2">
                    <ImageAvatar src={user?.image ?? undefined} size={40} />
                    <input
                      ref={el => { commentInputRefs.current[blog.id] = el; }}
                      type="text"
                      placeholder="Write a comment..."
                      className="form-control rounded-pill"
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
                {commentInputs[blog.id]?.file && <div className="mt-1 ms-5"><small className="text-muted">Selected: {commentInputs[blog.id]!.file!.name}</small></div>}
              </div>
            </div>
          );
        })}

        {total > ITEMS_PER_PAGE && (
          <div className="pagination mt-4 d-flex justify-content-center gap-2">
            {Array.from({ length: Math.ceil(total / ITEMS_PER_PAGE) }).map((_, idx) => (
              <Button key={idx} onClick={() => setPage(idx + 1)} className={page === idx + 1 ? "active" : ""}>{idx + 1}</Button>
            ))}
          </div>
        )}
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

export default BlogList;