import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import routes and handlers
import authRoutes from "./routes/authRoutes.js";
import adminManagementRoutes from "./routes/adminRoutes.js";
import appleRoutes from "./routes/appleRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { handleSignupRequest } from "./signupHandler.js";
import passwordlessAuthRoutes from './routes/passwordlessAuthRoutes.js';

dotenv.config();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express setup
const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
app.use(express.json());
app.use(cors({ 
  origin: "http://localhost:3000", 
  credentials: true 
}));

// ========================
// MONGODB CONNECTION (Main DB)
// ========================
mongoose
  .connect("mongodb://localhost:27017/appleverse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB (appleverse)");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ========================
// MULTER SETUP (Image uploads)
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "images")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ========================
// ROUTES
// ========================

// Root
app.get("/", (req, res) => {
  res.json({ 
    message: "🍎 Appleverse API is running!",
    endpoints: {
      user_auth: "/api/auth/*",
      admin_auth: "/api/admin/*",
      apples: "/api/apples/*"
    }
  });
});

// ========================
// USER AUTHENTICATION ROUTES
// ========================
app.use("/api/auth", authRoutes);

// ========================
// PASSWORD RECOVERY AND OTP ROUTES (Users)
// ========================
app.use('/api/login', passwordlessAuthRoutes);


// ========================
// ADMIN MANAGEMENT ROUTES (includes login, OTP, dashboard)
// ========================
app.use("/api/admin", adminManagementRoutes);

// ========================
// ADMIN ROUTES
// ========================
app.post("/api/admin/signup-request", handleSignupRequest);

// ========================
// APPLE ROUTES
// ========================
app.use("/api/apples", appleRoutes);

// ========================
// SETTINGS ROUTES
// ========================
app.use("/api/auth/settings", settingsRoutes);

// ========================
// STATIC FILES
// ========================
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    success: false,
    error: "Route not found",
    path: req.url
  });
});

// ========================
// ERROR HANDLING
// ========================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 User Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍💼 Admin Login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📊 Admin Dashboard API: http://localhost:${PORT}/api/admin/pending-requests`);
  console.log(`🍎 Apple API: http://localhost:${PORT}/api/apples\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});