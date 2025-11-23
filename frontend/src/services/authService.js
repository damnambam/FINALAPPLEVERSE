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
      throw new Error(data.message || data.error || "Signup failed");
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
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
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAdmin", "false");
      
      // Restore user's dark mode preference
      if (data.user.email) {
        const savedDarkMode = localStorage.getItem(`darkMode_${data.user.email}`) === 'true';
        const savedFontSize = localStorage.getItem(`fontSize_${data.user.email}`) || localStorage.getItem('fontSize');
        const fontSize = savedFontSize ? parseInt(savedFontSize, 10) : 16;
        const savedHighContrast = localStorage.getItem(`highContrast_${data.user.email}`) === 'true';
        
        localStorage.setItem('darkMode', savedDarkMode);
        localStorage.setItem('fontSize', fontSize);
        localStorage.setItem('highContrast', savedHighContrast);
        
        // Apply settings immediately
        if (savedDarkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
        document.body.classList.remove('large-text');
        if (savedHighContrast) {
          document.body.classList.add('high-contrast');
        } else {
          document.body.classList.remove('high-contrast');
        }
      }
      
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
        localStorage.setItem("adminData", JSON.stringify(data.admin));
        localStorage.setItem("userData", JSON.stringify(data.admin));
        
        // Restore admin's dark mode preference
        if (data.admin.email) {
          const savedDarkMode = localStorage.getItem(`darkMode_${data.admin.email}`) === 'true';
          const savedFontSize = localStorage.getItem(`fontSize_${data.admin.email}`) || localStorage.getItem('fontSize');
          const fontSize = savedFontSize ? parseInt(savedFontSize, 10) : 16;
          const savedHighContrast = localStorage.getItem(`highContrast_${data.admin.email}`) === 'true';
          
          localStorage.setItem('darkMode', savedDarkMode);
          localStorage.setItem('fontSize', fontSize);
          localStorage.setItem('highContrast', savedHighContrast);
          
          // Apply settings immediately
          if (savedDarkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
          document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
          document.body.classList.remove('large-text');
          if (savedHighContrast) {
            document.body.classList.add('high-contrast');
          } else {
            document.body.classList.remove('high-contrast');
          }
        }
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
  // Get current user to save their dark mode preference before logout
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.email) {
    // Save user's current dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const savedFontSize = localStorage.getItem('fontSize');
    const fontSize = savedFontSize ? parseInt(savedFontSize, 10) : 16;
    const highContrast = localStorage.getItem('highContrast') === 'true';
    
    // Store preferences with user email as key
    localStorage.setItem(`darkMode_${currentUser.email}`, darkMode);
    localStorage.setItem(`fontSize_${currentUser.email}`, fontSize);
    localStorage.setItem(`highContrast_${currentUser.email}`, highContrast);
  }
  
  // Clear authentication data
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("admin");
  localStorage.removeItem("adminData");
  localStorage.removeItem("userData");
  
  // Reset to light mode (normal mode) after logout
  localStorage.removeItem('darkMode');
  localStorage.removeItem('fontSize');
  localStorage.removeItem('highContrast');
  document.body.classList.remove('dark-mode', 'large-text', 'high-contrast');
  document.documentElement.style.setProperty('--user-font-size', '16px');
  
  // Dispatch custom event to update Navigation
  window.dispatchEvent(new Event('authChange'));
};

// ========================
// GET CURRENT USER
// ========================
export const getCurrentUser = () => {
  const adminData = localStorage.getItem("adminData");
  const userData = localStorage.getItem("userData");
  const user = localStorage.getItem("user");
  const admin = localStorage.getItem("admin");
  
  // Priority: adminData > userData > admin > user
  if (adminData) {
    return JSON.parse(adminData);
  }
  if (userData) {
    return JSON.parse(userData);
  }
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
// GET USER PROFILE (from backend)
// ========================
export const getProfile = async () => {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/settings/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
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
export const updateUserProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/settings/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    // Update stored user data
    if (data.success && data.user) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (isAdmin) {
        localStorage.setItem("admin", JSON.stringify(data.user));
        localStorage.setItem("adminData", JSON.stringify(data.user));
      }
      
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      // Dispatch custom event to update Navigation
      window.dispatchEvent(new Event('authChange'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// CHANGE PASSWORD
// ========================
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/settings/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        currentPassword, 
        newPassword 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to change password");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ========================
// GET USER PROFILE (OLD - for compatibility)
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
