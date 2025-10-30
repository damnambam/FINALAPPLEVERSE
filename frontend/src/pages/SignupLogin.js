import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup, adminLogin } from "../services/authService";
import "../styles/SignupLogin.css";

export default function SignupLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    dob: "",
  });
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (forgotPassword) {
        alert("Password reset link sent to your email!");
        setForgotPassword(false);
        setLoading(false);
        return;
      }

      // ============ ADMIN MODE ============
      if (isAdminMode) {
        if (isLogin) {
          const response = await adminLogin(formData.email, formData.password);
          
          if (response.token) {
            alert("Admin login successful!");
            navigate("/dashboard");
          }
        } else {
          const response = await fetch("http://localhost:5000/api/admin/signup-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.name,
              dob: formData.dob,
              email: formData.email,
              password: formData.password,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            alert("Admin request submitted! Wait for approval.");
            setIsLogin(true);
            setFormData({ email: "", password: "", name: "", dob: "" });
          } else {
            throw new Error(data.error || "Admin signup failed");
          }
        }
      } 
      // ============ USER MODE ============
      else {
        if (isLogin) {
          const response = await login(formData.email, formData.password);
          
          if (response.success) {
            alert(`Hello You, ${response.user.name || response.user.email}!`);
            navigate("/user-dashboard");
          }
        } else {
          const response = await signup(
            formData.email, 
            formData.password, 
            formData.name
          );
          
          if (response.success) {
            alert("Signup successful! Please login.");
            setIsLogin(true);
            setFormData({ email: formData.email, password: "", name: "", dob: "" });
          }
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setForgotPassword(false);
    setError("");
    setFormData({ email: "", password: "", name: "", dob: "" });
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsLogin(true);
    setForgotPassword(false);
    setError("");
    setFormData({ email: "", password: "", name: "", dob: "" });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {forgotPassword
            ? "Forgot Password"
            : isAdminMode && !isLogin
            ? "Request Admin Access 👨‍💼"
            : isAdminMode
            ? "Admin Login 👨‍💼"
            : isLogin
            ? "The vibe is ripe 🍎"
            : "Join Appleverse 🍏"}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && !forgotPassword && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          {!isLogin && !forgotPassword && isAdminMode && (
            <input
              type="date"
              name="dob"
              placeholder="Date of Birth"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {!forgotPassword && (
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? "Processing..."
              : forgotPassword
              ? "Send Reset Link"
              : isAdminMode && !isLogin
              ? "Request Admin Access"
              : isAdminMode
              ? "Admin Login"
              : isLogin
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        <div className="auth-links">
          {!forgotPassword && isLogin && !isAdminMode && (
            <p onClick={() => setForgotPassword(true)} className="link">
              Forgot Password?
            </p>
          )}

          {forgotPassword && (
            <p onClick={() => setForgotPassword(false)} className="link">
              Back to Login
            </p>
          )}

          {!forgotPassword && (
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span className="link" onClick={toggleMode}>
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          )}

          {!forgotPassword && (
            <p className="admin-toggle">
              {isAdminMode ? (
                <span className="link" onClick={toggleAdminMode}>
                  ← Regular User {isLogin ? "Login" : "Signup"}
                </span>
              ) : (
                <span className="link" onClick={toggleAdminMode}>
                  Admin {isLogin ? "Login" : "Signup"} →
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}