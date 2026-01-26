import Button from "../components/Button";
import FormField from "../components/FormField";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { loginUser, setUser, clearError, clearSuccess } from "../hooks/auth";
import { supabase } from "../services/supabase";
import "../style/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setshowSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector(
    (state: RootState) => state.userauth,
  );

  useEffect(() => {
    const restoreUser = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const { data: profile } = await supabase
          .from("tbluser")
          .select("*")
          .eq("userID", sessionUser.id)
          .maybeSingle();
        if (profile) dispatch(setUser(profile));
      }
    };
    restoreUser();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(clearError());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      setshowSuccess(true);
      const timer = setTimeout(() => {
        setshowSuccess(false);
        dispatch(clearSuccess());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const resultAction = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(resultAction)) {
      dispatch(setUser(resultAction.payload));
      navigate("/bloglist");
    }
  };

  const goToRegistration = () => {
    dispatch(clearError());
    dispatch(clearSuccess());
    navigate("/userregistration");
  };

  return (
    <div className="login-container d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="card login-card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <h3 className="text-center fw-bold mb-2">Login</h3>
          <p className="text-center text-muted mb-4">
            Sign in with your email and password
          </p>

          {showError && (
            <p
              className="text-error"
              style={{
                textAlign: "center",
                color: "#991b1b",
                fontWeight: 500,
                margin: "10px 0",
              }}
            >
              {error}
            </p>
          )}

          {showSuccess && (
            <p
              className="text-success"
              style={{
                textAlign: "center",
                color: "#0FA809",
                fontWeight: 500,
                margin: "10px 0",
              }}
            >
              {success}
            </p>
          )}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <FormField
                label="Email Address"
                id="email"
                type="email"
                align="start"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <FormField
                label="Password"
                id="password"
                type={showPassword ? "text" : "password"}
                align="start"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="login-checkbox form-check">
              <input
                type="checkbox"
                id="showPassword"
                className="form-check-input"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
              />
              <label htmlFor="showPassword" className="form-check-label">
                Show password
              </label>
            </div>

            <div className="login-field">
              <Button
                type="submit"
                colorVariant="dark"
                className="w-100 py-2 d-flex justify-content-center"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </div>
          </form>

          <div className="d-flex justify-content-center align-items-center mt-4 gap-2 flex-wrap text-center">
            <span className="text-muted small">No account?</span>
            <Button
              colorVariant="link"
              className="p-0 text-decoration-none fw-bold"
              onClick={goToRegistration}
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
