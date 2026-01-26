import Button from "../components/Button";
import FormField from "../components/FormField";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { registerUser, clearSuccess, clearError } from "../hooks/auth";
import "../style/registration.css";

const Registration = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { success, loading, error } = useSelector(
    (state: RootState) => state.userauth,
  );

  // Clear error & success mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
    return () => {
      dispatch(clearError());
      dispatch(clearSuccess());
    };
  }, [dispatch]);

  //Clear error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  //Clear Success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        navigate("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  //Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await dispatch(registerUser({ name, email, image, password }));
  };

  //LogIN page 
  const goToLogin = () => navigate("/");

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="card shadow-lg border-0 registration-card">
        <div className="card-body p-4 p-sm-4 p-md-5">
          <h3 className="text-center fw-bold mb-1">Registration</h3>

          <div className="text-center text-muted mb-4">
            <hr className="mx-auto my-4 text-muted" style={{ width: "60%" }} />
          </div>

          {error && (
            <p
              className="text-error text-center"
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
          
          {success && (
            <p
              className="text-success text-center"
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

          <form onSubmit={handleSubmit}>
            <FormField
              label="Name"
              id="name"
              type="text"
              align="start"
              value={name}
              onChange={(e) => setName(e.target.value)}
              classname="form-control"
            />

            <FormField
              label="Email address"
              id="email"
              type="email"
              align="start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              classname="form-control"
            />

            <FormField
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              align="start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              classname="form-control"
            />

            <div className="form-check mt-2">
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

            <FormField
              label="Profile Image"
              id="image"
              type="file"
              align="start"
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) setImage(target.files[0]);
              }}
              accept="image/*"
              classname="form-control"
            />

            <Button
              type="submit"
              colorVariant="dark"
              className="w-100 mt-3 justify-content-center gap-2"
              disabled={loading}
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