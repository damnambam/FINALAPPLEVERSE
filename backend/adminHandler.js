// adminHandler.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* ----------------------------
   1) Connect to appleverse_users DB
-------------------------------*/
const userDB = mongoose.createConnection("mongodb://localhost:27017/appleverse_users", {
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

// Rejected requests schema
const rejectedSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: String,
  password: String,
  createdAt: { type: Date, default: Date.now },
});
export const RejectedRequest = userDB.model("RejectedRequest", rejectedSchema, "rejectedrequests");

/* ----------------------------
   2) Connect to appleverse DB for admins
-------------------------------*/
const mainDB = mongoose.createConnection("mongodb://localhost:27017/appleverse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Admin schema
const adminSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: String,
  password: String, // hashed
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
});
export const Admin = mainDB.model("Admin", adminSchema, "admins");

/* ----------------------------
   LISTING FUNCTIONS
-------------------------------*/
export const listPendingRequests = async (req, res) => {
  try {
    const pending = await PendingRequest.find();
    res.json(pending);
  } catch (error) {
    console.error("Error listing pending requests:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const listActiveAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    console.error("Error listing active admins:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const listRejectedRequests = async (req, res) => {
  try {
    const rejected = await RejectedRequest.find();
    res.json(rejected);
  } catch (error) {
    console.error("Error listing rejected requests:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

/* ----------------------------
   ACTION FUNCTIONS
-------------------------------*/
export const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const pendingDoc = await PendingRequest.findById(requestId);
    if (!pendingDoc) return res.status(404).json({ error: "Request not found" });

    await Admin.create({
      name: pendingDoc.name,
      dob: pendingDoc.dob,
      email: pendingDoc.email,
      password: pendingDoc.password,
      role: "admin",
    });

    await PendingRequest.findByIdAndDelete(requestId);
    res.json({ message: "Request approved. User added to admins." });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    let doc = await PendingRequest.findById(requestId);

    if (doc) {
      await RejectedRequest.create({
        name: doc.name,
        dob: doc.dob,
        email: doc.email,
        password: doc.password,
      });
      await PendingRequest.findByIdAndDelete(requestId);
      return res.json({ message: "Request rejected, moved to 'rejectedrequests'." });
    }

    doc = await Admin.findById(requestId);
    if (doc) {
      await RejectedRequest.create({
        name: doc.name,
        dob: doc.dob,
        email: doc.email,
        password: doc.password,
      });
      await Admin.findByIdAndDelete(requestId);
      return res.json({ message: "Admin revoked, moved to 'rejectedrequests'." });
    }

    res.status(404).json({ error: "Not found in pending or active admins." });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const revokeAccess = async (req, res) => {
  try {
    const { requestId } = req.body;
    const adminDoc = await Admin.findById(requestId);
    if (!adminDoc) return res.status(404).json({ error: "Admin not found" });

    await RejectedRequest.create({
      name: adminDoc.name,
      dob: adminDoc.dob,
      email: adminDoc.email,
      password: adminDoc.password,
    });
    await Admin.findByIdAndDelete(requestId);
    res.json({ message: "Admin revoked, moved to 'rejectedrequests'." });
  } catch (error) {
    console.error("Error revoking access:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const reinstateRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const rejectedDoc = await RejectedRequest.findById(requestId);
    if (!rejectedDoc) return res.status(404).json({ error: "Rejected request not found" });

    await Admin.create({
      name: rejectedDoc.name,
      dob: rejectedDoc.dob,
      email: rejectedDoc.email,
      password: rejectedDoc.password,
      role: "admin",
    });
    await RejectedRequest.findByIdAndDelete(requestId);
    res.json({ message: "Rejected admin reinstated to 'admins'." });
  } catch (error) {
    console.error("Error reinstating request:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
