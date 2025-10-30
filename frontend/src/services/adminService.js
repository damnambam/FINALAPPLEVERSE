const ADMIN_API_URL = "http://localhost:5000/api/admin";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  
  console.log('🔑 Getting auth headers, token:', token ? 'exists' : 'missing');
  
  if (!token || token === 'null' || token === 'undefined') {
    throw new Error('No authentication token found. Please login again.');
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

// ========================
// GET PENDING REQUESTS
// ========================
export const getPendingRequests = async () => {
  try {
    console.log('📥 Fetching pending requests...');
    const response = await fetch(`${ADMIN_API_URL}/pending-requests`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    console.log('📦 Response:', data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch pending requests");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getPendingRequests:', error);
    throw error;
  }
};

// ========================
// GET CURRENT ADMINS
// ========================
export const getCurrentAdmins = async () => {
  try {
    console.log('📥 Fetching current admins...');
    const response = await fetch(`${ADMIN_API_URL}/admins`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    console.log('📦 Response:', data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch admins");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getCurrentAdmins:', error);
    throw error;
  }
};

// ========================
// APPROVE ADMIN REQUEST
// ========================
export const approveAdminRequest = async (requestId) => {
  try {
    console.log('✅ Approving request:', requestId);
    const response = await fetch(`${ADMIN_API_URL}/approve/${requestId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to approve request");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in approveAdminRequest:', error);
    throw error;
  }
};

// ========================
// REJECT ADMIN REQUEST
// ========================
export const rejectAdminRequest = async (requestId) => {
  try {
    console.log('❌ Rejecting request:', requestId);
    const response = await fetch(`${ADMIN_API_URL}/reject/${requestId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reject request");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in rejectAdminRequest:', error);
    throw error;
  }
};

// ========================
// TOGGLE ADMIN STATUS
// ========================
export const toggleAdminStatus = async (adminId, isActive) => {
  try {
    console.log('🔄 Toggling admin status:', adminId, 'to', isActive);
    const response = await fetch(`${ADMIN_API_URL}/toggle-status/${adminId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update admin status");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in toggleAdminStatus:', error);
    throw error;
  }
};

// ========================
// GET ADMIN ACTIVITY LOG
// ========================
export const getAdminActivityLog = async (adminId) => {
  try {
    console.log('📋 Fetching activity log for:', adminId);
    const response = await fetch(`${ADMIN_API_URL}/activity/${adminId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch activity log");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getAdminActivityLog:', error);
    throw error;
  }
};

// ========================
// DELETE ADMIN (Revoke Access)
// ========================
export const deleteAdmin = async (adminId) => {
  try {
    console.log('🗑️ Deleting admin:', adminId);
    const response = await fetch(`${ADMIN_API_URL}/delete/${adminId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete admin");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in deleteAdmin:', error);
    throw error;
  }
};

// ========================
// REINSTATE REJECTED REQUEST
// ========================
export const reinstateRequest = async (requestId) => {
  try {
    console.log('🔄 Reinstating request:', requestId);
    const response = await fetch(`${ADMIN_API_URL}/reinstate/${requestId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reinstate request");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in reinstateRequest:', error);
    throw error;
  }
};

// ========================
// GET REJECTED REQUESTS
// ========================
export const getRejectedRequests = async () => {
  try {
    console.log('📥 Fetching rejected requests...');
    const response = await fetch(`${ADMIN_API_URL}/rejected-requests`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch rejected requests");
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getRejectedRequests:', error);
    throw error;
  }
};