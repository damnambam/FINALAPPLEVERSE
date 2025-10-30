// Backend: routes/adminRoutes.js (Unified with Mongoose)
import express from 'express';
import bcrypt from 'bcrypt';
import { Admin, PendingRequest, RejectedRequest } from '../models/Admin.js';

const router = express.Router();

// ========================
// MIDDLEWARE - Verify Admin Token
// ========================
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  console.log('🔐 Auth Header:', authHeader);
  console.log('🔐 Token received:', token);
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  // Accept any token that exists (for development)
  // In production, you'd verify the JWT properly
  if (token && token.length > 0) {
    console.log('✅ Token accepted');
    // Extract admin ID from token (format: admin-{id}-{timestamp})
    const adminId = token.split('-')[1];
    req.adminId = adminId;
    next();
  } else {
    console.log('❌ Invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================
// GET PENDING ADMIN REQUESTS
// ========================
router.get('/pending-requests', verifyAdminToken, async (req, res) => {
  try {
    console.log('📥 Fetching pending requests...');
    const pendingRequests = await PendingRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ Found', pendingRequests.length, 'pending requests');
    res.json({ 
      success: true, 
      requests: pendingRequests 
    });
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests', details: error.message });
  }
});

// ========================
// GET ALL CURRENT ADMINS
// ========================
router.get('/admins', verifyAdminToken, async (req, res) => {
  try {
    console.log('📥 Fetching current admins...');
    const admins = await Admin.find({})
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ Found', admins.length, 'admins');
    res.json({ 
      success: true, 
      admins 
    });
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins', details: error.message });
  }
});

// ========================
// GET REJECTED REQUESTS
// ========================
router.get('/rejected-requests', verifyAdminToken, async (req, res) => {
  try {
    console.log('📥 Fetching rejected requests...');
    const rejectedRequests = await RejectedRequest.find({})
      .sort({ rejectedAt: -1 })
      .lean();

    console.log('✅ Found', rejectedRequests.length, 'rejected requests');
    res.json({ 
      success: true, 
      requests: rejectedRequests 
    });
  } catch (error) {
    console.error('❌ Error fetching rejected requests:', error);
    res.status(500).json({ error: 'Failed to fetch rejected requests', details: error.message });
  }
});

// ========================
// APPROVE ADMIN REQUEST
// ========================
router.post('/approve/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✅ Approving request:', id);

    // Find the pending request
    const pendingRequest = await PendingRequest.findById(id);

    if (!pendingRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create new admin from pending request
    const newAdmin = new Admin({
      name: pendingRequest.name,
      email: pendingRequest.email,
      password: pendingRequest.password, // Already hashed from signup
      dob: pendingRequest.dob,
      role: 'Admin',
      isActive: true,
      approvedBy: req.adminId,
      approvedAt: new Date(),
      activityLog: [{
        action: 'Account created',
        details: 'Admin account approved and created',
        timestamp: new Date()
      }]
    });

    // Save new admin
    await newAdmin.save();

    // Remove from pending requests
    await PendingRequest.findByIdAndDelete(id);

    console.log('✅ Admin approved successfully');
    res.json({ 
      success: true, 
      message: 'Admin approved successfully',
      admin: newAdmin
    });
  } catch (error) {
    console.error('❌ Error approving admin:', error);
    res.status(500).json({ error: 'Failed to approve admin request', details: error.message });
  }
});

// ========================
// REJECT ADMIN REQUEST
// ========================
router.post('/reject/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('❌ Rejecting request:', id);

    // Find the pending request
    const pendingRequest = await PendingRequest.findById(id);

    if (!pendingRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Move to rejected requests
    const rejectedRequest = new RejectedRequest({
      name: pendingRequest.name,
      email: pendingRequest.email,
      dob: pendingRequest.dob,
      reason: pendingRequest.reason,
      rejectedBy: req.adminId,
      rejectedAt: new Date(),
      originalRequestDate: pendingRequest.createdAt
    });

    await rejectedRequest.save();

    // Remove from pending requests
    await PendingRequest.findByIdAndDelete(id);

    console.log('✅ Request rejected successfully');
    res.json({ 
      success: true, 
      message: 'Admin request rejected' 
    });
  } catch (error) {
    console.error('❌ Error rejecting admin:', error);
    res.status(500).json({ error: 'Failed to reject admin request', details: error.message });
  }
});

// ========================
// TOGGLE ADMIN ACTIVE STATUS
// ========================
router.put('/toggle-status/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    console.log('🔄 Toggling admin status:', id, 'to', isActive);

    const admin = await Admin.findByIdAndUpdate(
      id,
      { 
        isActive,
        lastStatusChange: new Date(),
        $push: {
          activityLog: {
            action: `Status changed to ${isActive ? 'active' : 'inactive'}`,
            details: `Admin status updated by ${req.adminId}`,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('✅ Admin status updated');
    res.json({ 
      success: true, 
      message: 'Admin status updated successfully',
      admin
    });
  } catch (error) {
    console.error('❌ Error updating admin status:', error);
    res.status(500).json({ error: 'Failed to update admin status', details: error.message });
  }
});

// ========================
// GET ADMIN ACTIVITY LOG
// ========================
router.get('/activity/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Fetching activity log for admin:', id);

    const admin = await Admin.findById(id).select('activityLog name email');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('✅ Activity log fetched');
    res.json({ 
      success: true, 
      activityLog: admin.activityLog || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching activity log:', error);
    res.status(500).json({ error: 'Failed to fetch activity log', details: error.message });
  }
});

// ========================
// DELETE ADMIN (Revoke Access)
// ========================
router.delete('/delete/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting admin:', id);

    // Prevent self-deletion
    if (id === req.adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('✅ Admin deleted successfully');
    res.json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin', details: error.message });
  }
});

// ========================
// REINSTATE REJECTED REQUEST (Move back to pending)
// ========================
router.post('/reinstate/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Reinstating rejected request:', id);

    const rejectedRequest = await RejectedRequest.findById(id);

    if (!rejectedRequest) {
      return res.status(404).json({ error: 'Rejected request not found' });
    }

    // Move back to pending
    const pendingRequest = new PendingRequest({
      name: rejectedRequest.name,
      email: rejectedRequest.email,
      dob: rejectedRequest.dob,
      reason: rejectedRequest.reason,
      status: 'pending'
    });

    await pendingRequest.save();
    await RejectedRequest.findByIdAndDelete(id);

    console.log('✅ Request reinstated successfully');
    res.json({ 
      success: true, 
      message: 'Request reinstated to pending' 
    });
  } catch (error) {
    console.error('❌ Error reinstating request:', error);
    res.status(500).json({ error: 'Failed to reinstate request', details: error.message });
  }
});

export default router;