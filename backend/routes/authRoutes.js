import express from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth route is working', UserModel: typeof User });
});

// ========================
// USER SIGNUP
// ========================
router.post('/signup', async (req, res) => {
  // Wrap everything in try-catch to ensure we always send a response
  try {
    // Log immediately to verify route is hit
    console.log('\n📝 ========== SIGNUP REQUEST START ==========');
    console.log('📝 Signup route hit at:', new Date().toISOString());
    console.log('📝 Request received:', req.method, req.url);
    
    // Verify User model
    if (!User) {
      console.error('❌ CRITICAL: User model is not imported!');
      return res.status(500).json({ 
        success: false,
        message: "Server configuration error: User model not found" 
      });
    }
    console.log('✅ User model verified:', typeof User);
    console.log('✅ User model name:', User.modelName);
    
    // Parse request body
    const { email, password, name } = req.body || {};
    console.log('📝 Request body received:', { 
      email: email ? `${email.substring(0, 3)}***` : 'missing', 
      name: name || 'missing', 
      hasPassword: !!password,
      passwordLength: password ? password.length : 0
    });

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false,
        message: "Database connection error. Please try again later." 
      });
    }
    
    console.log('✅ MongoDB connection state:', mongoose.connection.readyState);
    console.log('✅ MongoDB database name:', mongoose.connection.db?.databaseName);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = String(email).toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ 
        success: false,
        message: "Please enter a valid email address" 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already exists (use normalized email)
    let existingUser;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      return res.status(500).json({ 
        success: false,
        message: "Database connection error. Please try again later." 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists. Please login instead." 
      });
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(String(password), 10);
    } catch (hashError) {
      console.error('❌ Password hashing error:', hashError);
      return res.status(500).json({ 
        success: false,
        message: "Error processing password" 
      });
    }

    // Create new user with normalized email
    console.log('📝 Creating user object with:', { email: normalizedEmail, name: name ? String(name).trim() : '', hasPassword: !!hashedPassword });
    
    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      name: name ? String(name).trim() : '',
      isActive: true
    };
    
    console.log('📝 User data to save:', { ...userData, password: '[HIDDEN]' });
    
    console.log('📝 Creating User instance...');
    let newUser;
    try {
      newUser = new User(userData);
      console.log('✅ User instance created');
    } catch (createError) {
      console.error('❌ Error creating User instance:', createError);
      return res.status(500).json({ 
        success: false,
        message: `Error creating user: ${createError.message}` 
      });
    }
    
    // Validate before saving
    try {
      console.log('📝 Validating user...');
      await newUser.validate();
      console.log('✅ User validation passed');
    } catch (validationError) {
      console.error('❌ User validation failed:', validationError);
      const validationMessages = Object.values(validationError.errors || {}).map(err => err.message).join(', ');
      return res.status(400).json({ 
        success: false,
        message: validationMessages || "Validation error" 
      });
    }

    try {
      await newUser.save();
      console.log('✅ New user created:', normalizedEmail);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name
        }
      });
    } catch (saveError) {
      console.error('❌ User save error:', saveError);
      console.error('❌ Save error name:', saveError.name);
      console.error('❌ Save error code:', saveError.code);
      console.error('❌ Save error message:', saveError.message);
      
      // Handle validation errors from Mongoose
      if (saveError.name === 'ValidationError') {
        const validationMessages = Object.values(saveError.errors || {}).map(err => err.message).join(', ');
        return res.status(400).json({ 
          success: false,
          message: validationMessages || "Validation error" 
        });
      }
      
      // Handle duplicate key error
      if (saveError.code === 11000 || (saveError.name === 'MongoServerError' && saveError.code === 11000)) {
        return res.status(400).json({ 
          success: false,
          message: "Email already exists" 
        });
      }
      
      throw saveError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('❌ ========== SIGNUP ERROR ==========');
    console.error('❌ Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    if (error.errors) {
      console.error('❌ Error details:', error.errors);
    }
    console.error('❌ ===================================');
    
    // Provide more specific error messages
    let errorMessage = "Server error during signup";
    let statusCode = 500;
    
    if (error.code === 11000) {
      errorMessage = "Email already exists";
      statusCode = 400;
    } else if (error.name === 'ValidationError') {
      const validationMessages = Object.values(error.errors || {}).map(err => err.message).join(', ');
      errorMessage = validationMessages || error.message || "Validation error";
      statusCode = 400;
    } else if (error.name === 'MongoServerError') {
      if (error.code === 11000) {
        errorMessage = "Email already exists";
        statusCode = 400;
      } else {
        errorMessage = `Database error: ${error.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('❌ Returning error to client:', { statusCode, errorMessage });
    
    // Always send a response, even if there's an error
    if (!res.headersSent) {
      res.status(statusCode).json({ 
        success: false,
        message: errorMessage 
      });
    } else {
      console.error('❌ Response already sent, cannot send error response');
    }
  }
});

// ========================
// USER LOGIN
// ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 User login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password required" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check if active
    if (!user.isActive) {
      console.log('❌ User account is inactive:', email);
      return res.status(401).json({ 
        success: false,
        message: "Account is inactive" 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = `user-${user._id}-${Date.now()}`;

    console.log('✅ Successful login for', email);
    console.log('🔑 Token generated:', token);

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

// ========================
// GET USER PROFILE
// ========================
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Extract user ID from token (format: user-{id}-{timestamp})
    const userId = token.split('-')[1];

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ========================
// UPDATE USER PROFILE
// ========================
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Extract user ID from token
    const userId = token.split('-')[1];

    const { name, email, profilePicture } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
      user.email = email;
    }
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ========================
// CHANGE PASSWORD
// ========================
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Extract user ID from token
    const userId = token.split('-')[1];

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Current and new password required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 6 characters" 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log('✅ Password changed for:', user.email);

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

export default router;