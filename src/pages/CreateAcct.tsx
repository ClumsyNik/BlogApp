import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { sendLink, setPending, clearError, clearSuccess } from "../hooks/auth";
import Alerts from "../components/Alerts";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

const isValidEmail = (email: string) =>
  /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

const CreateAcct = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector(
    (state: RootState) => state.userauth
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    setFormError(null);

    if (!trimmedName || !trimmedEmail) {
      setFormError("Name and email are required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    dispatch(setPending({ name: trimmedName, email: trimmedEmail }));

    const result = await dispatch(
      sendLink({ name: trimmedName, email: trimmedEmail })
    );

    if (sendLink.fulfilled.match(result)) {
      setName("");
      setEmail("");
    }

    useEffect(() => {
      dispatch(clearError());
      dispatch(clearSuccess());
    }, []);
  };

    const goToLogin = () => navigate("/");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1rem",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Create Account
        </h2>

        {formError && (
          <Alerts
            type="error"
            message={formError}
            onClose={() => setFormError(null)}
          />
        )}

        {error && (
          <Alerts
            type="error"
            message={error}
            onClose={() => dispatch(clearError())}
          />
        )}

        {success && (
          <Alerts
            type="success"
            message={success}
            onClose={() => dispatch(clearSuccess())}
          />
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            disabled={loading}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "1rem",
            }}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            disabled={loading}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "1rem",
            }}
          />

          <Button
            type="submit"
            colorVariant="dark"
            disabled={loading}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          >
            {loading ? "Sending..." : "Proceed"}
          </Button>
        </form>

        <p
          style={{
            fontSize: "0.85rem",
            color: "#6c757d",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          We will send you a link to complete your account setup.
        </p>
                  <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
            <span className="text-muted small">Already have an account?</span>
            <Button colorVariant="link" className="p-0" onClick={goToLogin}>
              Login
            </Button>
          </div>
      </div>
    </div>
  );
};

export default CreateAcct;
