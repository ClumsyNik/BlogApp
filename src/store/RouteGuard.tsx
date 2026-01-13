// src/store/RouteGuard.tsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from ".";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  isPrivate: boolean;
}

const RouteGuard = ({ children, isPrivate }: Props) => {
  const { user, restoring } = useSelector((state: RootState) => state.userauth);

  if (restoring) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        Loading...
      </div>
    );
  }

  if (isPrivate) {
    return user ? <>{children}</> : <Navigate to="/" replace />;
  } else {
    return user ? <Navigate to="/bloglist" replace /> : <>{children}</>;
  }
};

export default RouteGuard;
