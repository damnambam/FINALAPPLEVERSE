// signupHandler.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Connect to appleverse DB
const userDB = mongoose.createConnection("mongodb://localhost:27017/appleverse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Pending requests schema
const pendingSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: String,
  password: String, // hashed
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const PendingRequest = userDB.model("PendingRequest", pendingSchema, "pendingrequests");

// Signup handler
export const handleSignupRequest = async (req, res) => {
  try {
    const { name, dob, email, password } = req.body;

    // Check if user already exists
    const existing = await PendingRequest.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create pending request
    const newRequest = await PendingRequest.create({
      name,
      dob,
      email,
      password: hashedPassword,
    });

    res.json({ message: "Signup request submitted", request: newRequest });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
