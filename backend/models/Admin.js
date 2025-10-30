import mongoose from 'mongoose';

// ========================
// ADMIN SCHEMA
// ========================
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  dob: {
    type: Date
  },
  role: {
    type: String,
    default: 'Admin',
    enum: ['Admin', 'Super Admin', 'admin']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  lastStatusChange: {
    type: Date
  },
  activityLog: [{
    action: String,
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ========================
// PENDING REQUEST SCHEMA
// ========================
const pendingRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ========================
// REJECTED REQUEST SCHEMA
// ========================
const rejectedRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  dob: {
    type: Date
  },
  reason: {
    type: String
  },
  rejectedBy: {
    type: String
  },
  rejectedAt: {
    type: Date,
    default: Date.now
  },
  originalRequestDate: {
    type: Date
  }
}, {
  timestamps: true
});

// ========================
// USE MAIN MONGOOSE CONNECTION (appleverse database)
// This connects to the same database as server.js
// ========================
const Admin = mongoose.model('Admin', adminSchema, 'admins');
const PendingRequest = mongoose.model('PendingRequest', pendingRequestSchema, 'pendingrequests');
const RejectedRequest = mongoose.model('RejectedRequest', rejectedRequestSchema, 'rejectedrequests');

export { Admin, PendingRequest, RejectedRequest };