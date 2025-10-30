const API_URL = "http://localhost:5000/api/auth";
const ADMIN_API_URL = "http://localhost:5000/api/admin";

// ========================
// SIGNUP
// ========================
export const signup = async (email, password, name) => {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// LOGIN
// ========================
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store user data and token in localStorage
    if (data.success && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAdmin", "false");
      
      // Dispatch custom event to update Navigation
      window.dispatchEvent(new Event('authChange'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// ADMIN LOGIN
// ========================
export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Admin login failed");
    }

    // Store admin data and token
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("isAdmin", "true");
      
      if (data.admin) {
        localStorage.setItem("user", JSON.stringify(data.admin));
        localStorage.setItem("admin", JSON.stringify(data.admin));
      }
      
      console.log('✅ Admin token stored:', data.token);
      
      // Dispatch custom event to update Navigation
      window.dispatchEvent(new Event('authChange'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// LOGOUT
// ========================
export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("admin");
  
  // Dispatch custom event to update Navigation
  window.dispatchEvent(new Event('authChange'));
};

// ========================
// GET CURRENT USER
// ========================
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  const admin = localStorage.getItem("admin");
  
  // Return admin if exists, otherwise return user
  if (admin) {
    return JSON.parse(admin);
  }
  return user ? JSON.parse(user) : null;
};

// ========================
// CHECK IF LOGGED IN
// ========================
export const isAuthenticated = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  
  // Check if token exists and is not null/undefined string
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return false;
  }
  
  return true;
};

// ========================
// CHECK IF ADMIN
// ========================
export const isAdmin = () => {
  return localStorage.getItem("isAdmin") === "true";
};

// ========================
// GET USER PROFILE
// ========================
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/profile/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch profile");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// UPDATE USER PROFILE
// ========================
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_URL}/profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    // Update stored user data
    if (data.success && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Dispatch custom event to update Navigation
      window.dispatchEvent(new Event('authChange'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};