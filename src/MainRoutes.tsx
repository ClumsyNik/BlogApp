import { Route, Routes } from "react-router-dom";
import BlogList from "./pages/BlogList";
import Registration from "./pages/Registration";
import Login from "./pages/LogIn";
import CreateBlog from "./pages/CreateBlog";
import UpdateBlog from "./pages/UpdateBlog";
import DeleteBlog from "./pages/DeleteBlog";
import RouteGuard from "./store/RouteGuard";
import { useAuthRestore } from "./store/authRouter";

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
        path="/update-blog/:id"
        element={
          <RouteGuard isPrivate={true}>
            <UpdateBlog />
          </RouteGuard>
        }
      />
      <Route
        path="/delete/:id"
        element={
          <RouteGuard isPrivate={true}>
            <DeleteBlog />
          </RouteGuard>
        }
      />
    </Routes>
  );
};

export default MainRoutes;