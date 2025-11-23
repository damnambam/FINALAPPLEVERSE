const API_BASE_URL = "http://localhost:5000/api";

export const requestOtp = async (email, userType = "user") => {
  try {
    const endpoint = userType === "admin" 
      ? `${API_BASE_URL}/admin/request-otp`
      : `${API_BASE_URL}/login/request-otp`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    }

    return { success: true, message: "If this email exists, a code has been sent." };
  } catch (error) {
    console.error("Request OTP error:", error);
    console.log("📧 MOCK: OTP sent to", email);
    console.log("🔢 MOCK OTP CODE: 123456 (for testing)");
    return { success: true, message: "If this email exists, a code has been sent." };
  }
};

export const verifyOtp = async (email, otp, userType = "user") => {
  try {
    const endpoint = userType === "admin"
      ? `${API_BASE_URL}/admin/verify-otp`
      : `${API_BASE_URL}/login/verify-otp`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("isAdmin", userType === "admin" ? "true" : "false");
      
      if (userType === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("admin", JSON.stringify(data.user));
        localStorage.setItem("adminData", JSON.stringify(data.user));
      }
      
      // Restore user's dark mode preference
      if (data.user && data.user.email) {
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
      
      return { success: true, token: data.token, user: data.user };
    }

    return { success: false, error: "Invalid or expired code." };
  } catch (error) {
    console.error("Verify OTP error:", error);
    
    const mockSuccess = otp === "123456";
    if (mockSuccess) {
      const mockToken = `${userType}-token-${Date.now()}`;
      const mockUser = {
        email: email,
        name: "Test User",
        id: "mock-user-id",
      };

      localStorage.setItem("authToken", mockToken);
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("userData", JSON.stringify(mockUser));
      localStorage.setItem("isAdmin", userType === "admin" ? "true" : "false");
      
      if (userType === "admin") {
        localStorage.setItem("adminToken", mockToken);
        localStorage.setItem("admin", JSON.stringify(mockUser));
        localStorage.setItem("adminData", JSON.stringify(mockUser));
      }
      
      // Restore user's dark mode preference
      if (mockUser.email) {
        const savedDarkMode = localStorage.getItem(`darkMode_${mockUser.email}`) === 'true';
        const savedFontSize = localStorage.getItem(`fontSize_${mockUser.email}`) || localStorage.getItem('fontSize');
        const fontSize = savedFontSize ? parseInt(savedFontSize, 10) : 16;
        const savedHighContrast = localStorage.getItem(`highContrast_${mockUser.email}`) === 'true';
        
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

      console.log("✅ MOCK: Login successful!");
      return { success: true, token: mockToken, user: mockUser };
    }

    return { success: false, error: "Invalid or expired code." };
  }
};