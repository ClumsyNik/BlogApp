import Button from "../components/Button";
import FormField from "../components/FormField";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { registerUser, clearSuccess, clearError } from "../hooks/auth";
import Alerts from "../components/Alerts";
import "../style/registration.css";

const Registration = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { success, loading, error } = useSelector(
    (state: RootState) => state.userauth
  );

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const result = await dispatch(
      registerUser({ name, email, image, password })
    );

    if (registerUser.fulfilled.match(result)) {
      setTimeout(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
        setName("");
        setEmail("");
        setPassword("");
        setImage(null);
        navigate("/");
      }, 1500);
    }
  };

  const goToLogin = () => {
    navigate("/");
  };
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="card shadow-lg border-0 registration-card">
        <div className="card-body p-4 p-sm-4 p-md-5">
          <h3 className="text-center fw-bold mb-1">Registration</h3>

          <div className="text-center text-muted mb-4">
            <hr className="mx-auto my-4 text-muted w-60" />
          </div>

          {success && (
            <Alerts
              type="success"
              message={success}
              onClose={() => dispatch(clearSuccess())}
            />
          )}
          {error && (
            <Alerts
              type="error"
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Name"
              id="name"
              type="text"
              align="start"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <FormField
              label="Email address"
              id="email"
              type="email"
              align="start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FormField
              label="Password"
              id="password"
              type="password"
              align="start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <FormField
              label="Profile Image"
              id="image"
              type="file"
              align="start"
              value=""
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0]);
                }
              }}
              accept="image/*"
            />

            <Button
              type="submit"
              colorVariant="dark"
              className="w-100 mt-3 justify-content-center gap-2"
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
            <span className="text-muted small">Already have an account?</span>
            <Button colorVariant="link" className="p-0" onClick={goToLogin}>
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
