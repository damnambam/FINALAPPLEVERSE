import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup, adminLogin } from "../services/authService";
import ForgotPasswordModal from "./ForgotPasswordModal";
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
  const [showForgotModal, setShowForgotModal] = useState(false);
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
      // ============ ADMIN MODE ============
      if (isAdminMode) {
        if (isLogin) {
          const response = await adminLogin(formData.email, formData.password);
          
          console.log('Admin login response:', response);
          
          if (response && response.token) {
            localStorage.setItem("authToken", response.token);
            localStorage.setItem("admin", JSON.stringify(response.admin));
            alert("Admin login successful!");
            navigate("/dashboard");
          } else {
            throw new Error("Admin login failed - no token received");
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
          
          console.log('User login response:', response);
          
          if (response && response.success && response.token) {
            localStorage.setItem("authToken", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            alert(`Hello You, ${response.user.name || response.user.email}!`);
            navigate("/user-dashboard");
          } else {
            throw new Error(response.error || "Login failed - no token received");
          }
        } else {
          const response = await signup(
            formData.email, 
            formData.password, 
            formData.name
          );
          
          console.log('Signup response:', response);
          
          if (response && response.success) {
            alert("Signup successful! Please login.");
            setIsLogin(true);
            setFormData({ email: formData.email, password: "", name: "", dob: "" });
          } else {
            const errorMsg = response.message || response.error || "Signup failed";
            // If email exists, suggest logging in instead
            if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('email already')) {
              const shouldLogin = window.confirm("This email is already registered. Would you like to login instead?");
              if (shouldLogin) {
                setIsLogin(true);
                setFormData({ ...formData, password: "" });
              } else {
                throw new Error(errorMsg);
              }
            } else {
              throw new Error(errorMsg);
            }
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
    setError("");
    setFormData({ email: "", password: "", name: "", dob: "" });
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsLogin(true);
    setError("");
    setFormData({ email: "", password: "", name: "", dob: "" });
  };

  const handleForgotPasswordSuccess = (response) => {
    localStorage.setItem("authToken", response.token);
    if (isAdminMode) {
      localStorage.setItem("admin", JSON.stringify(response.user));
      alert(`Welcome back, ${response.user.name || response.user.email}!`);
      navigate("/dashboard");
    } else {
      localStorage.setItem("user", JSON.stringify(response.user));
      alert(`Welcome back, ${response.user.name || response.user.email}!`);
      navigate("/user-dashboard");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {isAdminMode && !isLogin
            ? "Request Admin Access 👨‍💼"
            : isAdminMode
            ? "Admin Login 👨‍💼"
            : isLogin
            ? "The vibe is ripe 🍎"
            : "Join Appleverse 🍏"}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          {!isLogin && isAdminMode && (
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

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? "Processing..."
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
          {isLogin && (
            <p onClick={() => setShowForgotModal(true)} className="link">
              Forgot Password?
            </p>
          )}

          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span className="link" onClick={toggleMode}>
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>

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
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={handleForgotPasswordSuccess}
        userType={isAdminMode ? "admin" : "user"}
      />
    </div>
  );
}