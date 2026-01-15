import Button from "../components/Button";
import FormField from "../components/FormField";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { loginUser, setUser, clearError, clearSuccess } from "../hooks/auth";
import { supabase } from "../services/supabase";
import Alerts from "../components/Alerts";
import "../style/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.userauth);

  useEffect(() => {
    const restoreUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data: profile, error: profileError } = await supabase
          .from("tbluser")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        if (profile) {
          dispatch(setUser(profile));
          navigate("/bloglist");
        }

        if (profileError)
          console.error("Error fetching profile:", profileError.message);
      }
    };
    restoreUser();
  }, [dispatch, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resultAction = await dispatch(loginUser({ email }));

    if (loginUser.fulfilled.match(resultAction)) {
      dispatch(clearError());
      dispatch(clearSuccess());
      navigate("/bloglist");
    }
  };

  const goToRegistration = () => navigate("/setaccount");

  return (
    <div className="login-container d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="card login-card border">
        <div className="card-body p-4 p-md-5">
          <h3 className="text-center fw-bold mb-1">Login</h3>
          <p className="text-center text-muted mb-4">Sign in with your email</p>

          {error && (
            <Alerts
              type="error"
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Email Address"
              id="email"
              type="email"
              align="start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              colorVariant="dark"
              className="w-100 mt-3 justify-content-center py-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="d-flex justify-content-center align-items-center mt-4 gap-2 flex-wrap text-center">
            <span className="text-muted small">No account?</span>
            <Button
              colorVariant="link"
              className="p-0 text-decoration-none fw-bold"
              onClick={() => {
                dispatch(clearError());
                goToRegistration();
              }}
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
