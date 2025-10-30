import React, { useState, useEffect } from 'react';
import { Search, X, Clock, Activity, Check, XCircle, Eye, Plus, FileText, RefreshCw } from 'lucide-react';
import AppleDisp from './AppleDisp';
import './AdminDashboard.css';
import {
  getPendingRequests,
  getCurrentAdmins,
  approveAdminRequest,
  rejectAdminRequest,
  toggleAdminStatus,
  getAdminActivityLog
} from '../services/adminService';

const AdminDashboard = ({ isAdmin, onNavigateToTemplates }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedApple, setSelectedApple] = useState(null);
  const [showAppleDisp, setShowAppleDisp] = useState(false);
  const [isCreatingNewApple, setIsCreatingNewApple] = useState(false);
  
  // State for data from backend
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [currentAdmins, setCurrentAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    console.log('📊 AdminDashboard mounted, fetching data...');
    fetchAllData();
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    setRefreshing(true);
    
    console.log('🔄 Starting fetchAllData...');
    
    try {
      // Check if token exists
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      console.log('🔑 Token check:', token ? 'Token exists' : '❌ No token found');
      
      if (!token || token === 'null' || token === 'undefined') {
        throw new Error('Authentication token not found. Please login again.');
      }

      await Promise.all([
        fetchPendingRequests(),
        fetchCurrentAdmins()
      ]);
      
      console.log('✅ All data fetched successfully');
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data. Please try again.';
      setError(errorMessage);
      console.error('❌ Error fetching data:', err);
      
      // If authentication error, suggest re-login
      if (errorMessage.includes('token') || errorMessage.includes('Authentication')) {
        setError('Session expired. Please logout and login again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      console.log('📥 Fetching pending requests...');
      const data = await getPendingRequests();
      console.log('📦 Pending requests data:', data);
      
      const requests = data.requests || data.pendingRequests || [];
      setPendingAdmins(requests);
      console.log('✅ Set pending admins:', requests.length, 'requests');
      
      return data;
    } catch (err) {
      console.error('❌ Error in fetchPendingRequests:', err);
      setPendingAdmins([]); // Set empty array on error
      throw err;
    }
  };

  // Fetch current admins
  const fetchCurrentAdmins = async () => {
    try {
      console.log('📥 Fetching current admins...');
      const data = await getCurrentAdmins();
      console.log('📦 Current admins data:', data);
      
      const admins = data.admins || [];
      setCurrentAdmins(admins);
      console.log('✅ Set current admins:', admins.length, 'admins');
      
      return data;
    } catch (err) {
      console.error('❌ Error in fetchCurrentAdmins:', err);
      setCurrentAdmins([]); // Set empty array on error
      throw err;
    }
  };

  // Handle approve request
  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this admin request?')) {
      return;
    }

    try {
      console.log('⏳ Approving request:', requestId);
      await approveAdminRequest(requestId);
      alert('Admin request approved successfully! ✅');
      await fetchAllData(); // Refresh data
    } catch (err) {
      const errorMsg = err.message || 'Failed to approve request';
      alert('❌ Error: ' + errorMsg);
      console.error('❌ Approve error:', err);
    }
  };

  // Handle reject request
  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this admin request?')) {
      return;
    }

    try {
      console.log('⏳ Rejecting request:', requestId);
      await rejectAdminRequest(requestId);
      alert('Admin request rejected ✅');
      await fetchPendingRequests(); // Refresh pending requests
    } catch (err) {
      const errorMsg = err.message || 'Failed to reject request';
      alert('❌ Error: ' + errorMsg);
      console.error('❌ Reject error:', err);
    }
  };

  // Handle toggle active status
  const toggleActiveStatus = async (adminId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this admin?`)) {
      return;
    }

    try {
      console.log('⏳ Toggling status for:', adminId, 'to', !currentStatus);
      await toggleAdminStatus(adminId, !currentStatus);
      
      // Update local state immediately for better UX
      setCurrentAdmins(prev => prev.map(admin => 
        admin._id === adminId ? { ...admin, isActive: !currentStatus } : admin
      ));
      
      alert(`Admin status updated successfully! ✅`);
    } catch (err) {
      const errorMsg = err.message || 'Failed to update admin status';
      alert('❌ Error: ' + errorMsg);
      console.error('❌ Toggle status error:', err);
    }
  };

  // Handle view activity log
  const viewActivityLog = async (admin) => {
    try {
      console.log('📋 Opening activity log for:', admin.name);
      setSelectedAdmin(admin);
      setShowActivityLog(true);
      setLoading(true);
      
      // Fetch activity log from backend
      const data = await getAdminActivityLog(admin._id);
      setActivityLog(data.activityLog || []);
      console.log('✅ Activity log loaded:', data.activityLog?.length || 0, 'entries');
    } catch (err) {
      console.error('❌ Error fetching activity log:', err);
      setActivityLog([]);
      alert('Could not load activity log: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle create new apple
  const handleCreateNewApple = () => {
    const newApple = {
      id: Date.now(),
      name: '',
      origin: '',
      status: 'Active',
      lastUpdated: new Date().toISOString().split('T')[0],
      acno: '',
      accession: '',
      cultivar_name: '',
      e_origin_country: '',
      e_origin_province: '',
      e_origin_city: '',
      e_genus: 'Malus',
      e_species: 'domestica',
      e_pedigree: '',
      e_breeder: '',
      e_collector: '',
      description: '',
      taste: '',
      texture: '',
      uses: '',
      harvestSeason: '',
      hardiness: '',
      storage: ''
    };
    setSelectedApple(newApple);
    setIsCreatingNewApple(true);
    setShowAppleDisp(true);
  };

  // Handle save apple changes
  const handleSaveApple = (updatedApple) => {
    if (isCreatingNewApple) {
      alert('New apple variety created successfully! 🍎');
    } else {
      alert('Apple variety updated successfully! ✅');
    }
    setShowAppleDisp(false);
    setIsCreatingNewApple(false);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Format datetime helper
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Filter admins based on search (case-insensitive)
  const filteredPendingAdmins = pendingAdmins.filter(admin => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const name = (admin.name || '').toLowerCase();
    const email = (admin.email || '').toLowerCase();
    
    return name.includes(query) || email.includes(query);
  });

  const filteredCurrentAdmins = currentAdmins.filter(admin => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const name = (admin.name || '').toLowerCase();
    const email = (admin.email || '').toLowerCase();
    
    return name.includes(query) || email.includes(query);
  });

  // Initial loading state
  if (loading && pendingAdmins.length === 0 && currentAdmins.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>🔐 Admin Dashboard</h1>
          <p className="admin-subtitle">Manage administrators and system access</p>
          {(pendingAdmins.length > 0 || currentAdmins.length > 0) && (
            <p className="data-summary">
              {pendingAdmins.length} pending • {currentAdmins.length} current admins
            </p>
          )}
        </div>
        <div className="admin-header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchAllData}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={20} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          {onNavigateToTemplates && (
            <button 
              className="create-btn template-btn"
              onClick={onNavigateToTemplates}
            >
              <FileText size={20} />
              Create Template
            </button>
          )}
          <button 
            className="create-btn apple-btn"
            onClick={handleCreateNewApple}
          >
            <Plus size={20} />
            New Apple Variety
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchAllData}>🔄 Retry</button>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests
          {pendingAdmins.length > 0 && (
            <span className="badge">{pendingAdmins.length}</span>
          )}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Current Admins
          <span className="badge-secondary">{currentAdmins.length}</span>
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="admin-content">
        {activeTab === 'pending' && (
          <div className="pending-requests">
            <h2>Pending Admin Requests</h2>
            {searchQuery && filteredPendingAdmins.length === 0 && pendingAdmins.length > 0 ? (
              <div className="empty-state">
                <p>No results found for "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')}>Clear search</button>
              </div>
            ) : filteredPendingAdmins.length === 0 ? (
              <div className="empty-state">
                <p>✨ No pending requests at this time</p>
              </div>
            ) : (
              <div className="requests-list">
                {filteredPendingAdmins.map(admin => (
                  <div key={admin._id} className="request-card">
                    <div className="request-info">
                      <div className="request-header">
                        <h3>{admin.name}</h3>
                        <span className="request-date">
                          <Clock size={16} />
                          {formatDate(admin.createdAt || admin.requestDate)}
                        </span>
                      </div>
                      <p className="request-email">📧 {admin.email}</p>
                      {admin.dob && (
                        <p className="request-dob"><strong>DOB:</strong> {formatDate(admin.dob)}</p>
                      )}
                      {admin.reason && (
                        <p className="request-reason"><strong>Reason:</strong> {admin.reason}</p>
                      )}
                    </div>
                    <div className="request-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApprove(admin._id)}
                        disabled={loading}
                      >
                        <Check size={18} />
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleReject(admin._id)}
                        disabled={loading}
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'current' && (
          <div className="current-admins">
            <h2>Current Administrators</h2>
            {searchQuery && filteredCurrentAdmins.length === 0 && currentAdmins.length > 0 ? (
              <div className="empty-state">
                <p>No results found for "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')}>Clear search</button>
              </div>
            ) : filteredCurrentAdmins.length === 0 ? (
              <div className="empty-state">
                <p>No administrators found</p>
              </div>
            ) : (
              <div className="admins-grid">
                {filteredCurrentAdmins.map(admin => (
                  <div key={admin._id} className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h3>{admin.name}</h3>
                        <span className={`role-badge ${(admin.role || 'admin').replace(' ', '-').toLowerCase()}`}>
                          {admin.role || 'Admin'}
                        </span>
                      </div>
                      <div className="status-toggle">
                        <span className={`status-label ${admin.isActive ? 'active' : 'inactive'}`}>
                          {admin.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={admin.isActive || false}
                            onChange={() => toggleActiveStatus(admin._id, admin.isActive)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="admin-details">
                      <p><strong>Email:</strong> {admin.email}</p>
                      <p><strong>Joined:</strong> {formatDate(admin.createdAt)}</p>
                      <p><strong>Last Login:</strong> {formatDateTime(admin.lastLogin) || 'Never'}</p>
                    </div>

                    <button 
                      className="view-activity-btn"
                      onClick={() => viewActivityLog(admin)}
                    >
                      <Eye size={18} />
                      View Activity Log
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Log Modal */}
      {showActivityLog && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setShowActivityLog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedAdmin.name}</h2>
                <p className="modal-subtitle">{selectedAdmin.email}</p>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowActivityLog(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="activity-log">
              <h3>
                <Activity size={20} />
                Recent Activity
              </h3>
              {loading ? (
                <div className="loading-inline">
                  <div className="spinner"></div>
                  <p>Loading activity log...</p>
                </div>
              ) : activityLog.length === 0 ? (
                <div className="empty-state-inline">
                  <p>📝 No activity recorded yet</p>
                </div>
              ) : (
                <div className="activity-timeline">
                  {activityLog.map((log, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-action">{log.action}</p>
                        {log.details && <p className="activity-details">{log.details}</p>}
                        <p className="activity-time">
                          <Clock size={14} />
                          {formatDateTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apple Display Modal */}
      {showAppleDisp && selectedApple && (
        <AppleDisp 
          appleData={selectedApple}
          onClose={() => {
            setShowAppleDisp(false);
            setIsCreatingNewApple(false);
          }}
          isEditing={true}
          isAdmin={isAdmin}
          onSave={handleSaveApple}
          isNewApple={isCreatingNewApple}
        />
      )}
    </div>
  );
};

export default AdminDashboard;