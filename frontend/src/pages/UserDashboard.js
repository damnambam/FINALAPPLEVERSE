import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // If not logged in, redirect to login
      navigate('/signup-login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/signup-login');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Welcome back, {user.name || user.email}! 👋
            </h1>
            <p className="dashboard-subtitle">
              Explore apple varieties, manage your profile, and discover new favorites.
            </p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* User Info Card */}
        <div className="user-info-card">
          <div className="user-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <h2>{user.name || 'User'}</h2>
            <p>{user.email}</p>
            <span className="user-badge">Regular User</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/" className="action-card">
              <div className="action-icon">🍎</div>
              <h3>Browse Apples</h3>
              <p>Explore 900+ apple varieties with detailed information</p>
            </Link>

            <Link to="/createapple" className="action-card">
              <div className="action-icon">➕</div>
              <h3>Add Apple</h3>
              <p>Contribute a new apple variety to our database</p>
            </Link>

            <Link to="/templates" className="action-card">
              <div className="action-icon">📋</div>
              <h3>Templates</h3>
              <p>Create and manage apple templates</p>
            </Link>

            <Link to="/about" className="action-card">
              <div className="action-icon">🌳</div>
              <h3>About</h3>
              <p>Learn more about Appleverse</p>
            </Link>

            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">👤</div>
              <h3>My Profile</h3>
              <p>View and edit your profile information</p>
            </div>

            <div className="action-card">
              <div className="action-icon">⭐</div>
              <h3>Favorites</h3>
              <p>View your favorite apple varieties</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👁️</div>
              <div className="activity-content">
                <p className="activity-title">Latest View</p>
                <p className="activity-description">No recent views yet</p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">⬇️</div>
              <div className="activity-content">
                <p className="activity-title">Latest Download</p>
                <p className="activity-description">No downloads yet</p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">🔍</div>
              <div className="activity-content">
                <p className="activity-title">Recent Search</p>
                <p className="activity-description">No searches yet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🍎</div>
            <div className="stat-content">
              <h3>0</h3>
              <p>Apples Added</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>0</h3>
              <p>Favorites</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <h3>0</h3>
              <p>Views</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;