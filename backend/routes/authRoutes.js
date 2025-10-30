import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

// ========================
// SIGNUP ROUTE
// ========================
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = new User({ 
      email, 
      password: hashedPassword,
      name: name || email.split("@")[0]
    });
    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: "Signup successful!",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ========================
// LOGIN ROUTE
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send response (don't send password back)
    res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
      token: "fake-jwt-token", // Replace with real JWT later
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

// ========================
// GET USER PROFILE
// ========================
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ========================
// UPDATE USER PROFILE
// ========================
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, profilePicture } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update fields
    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ========================
// EXPORT ROUTER (THIS IS CRITICAL!)
// ========================
export default router;