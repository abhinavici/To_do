import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Name, email, and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please login." },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Registration failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="auth-card">
        <p className="auth-eyebrow">Task Pilot</p>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Track work, personal items, and deadlines with a board designed for quick momentum.
        </p>

        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-label" htmlFor="register-name">
            Name
          </label>
          <input
            id="register-name"
            className="input-field"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />

          <label className="input-label" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label className="input-label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            className="input-field"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Back to login</Link>
        </p>
      </main>
    </div>
  );
}

export default Register;
