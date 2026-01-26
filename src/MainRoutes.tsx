import { Route, Routes } from "react-router-dom";
import BlogList from "./pages/BlogList";
import Registration from "./pages/Registration";
import Login from "./pages/LogIn";
import CreateBlog from "./pages/CreateBlog";
import RouteGuard from "./store/RouteGuard";
import { useAuthRestore } from "./store/authRouter";
import ViewPost from "./pages/ViewPost";
import EditPost from "./pages/EditPost";

const MainRoutes = () => {
  useAuthRestore();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteGuard isPrivate={false}>
            <Login />
          </RouteGuard>
        }
      />
      <Route
        path="/userregistration"
        element={
          <RouteGuard isPrivate={false}>
            <Registration />
          </RouteGuard>
        }
      />

      <Route
        path="/bloglist"
        element={
          <RouteGuard isPrivate={true}>
            <BlogList />
          </RouteGuard>
        }
      />
      <Route
        path="/create-blog"
        element={
          <RouteGuard isPrivate={true}>
            <CreateBlog />
          </RouteGuard>
        }
      />
      <Route
        path="bloglist/blog/:id"
        element={
          <RouteGuard isPrivate={true}>
            <ViewPost />
          </RouteGuard>
        }
      />

      <Route
        path="bloglist/edit-blog/:id"
        element={
          <RouteGuard isPrivate={true}>
            <EditPost />
          </RouteGuard>
        }
      />
    </Routes>
  );
};

export default MainRoutes;
