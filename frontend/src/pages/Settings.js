import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, Accessibility, Save, Moon, Sun, Type, Contrast } from 'lucide-react';
import { updateUserProfile, changePassword } from '../services/authService';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fontSizeTimeoutRef = useRef(null);

  // User details state
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    dob: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Accessibility settings state
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    darkMode: false,
    fontSize: 16, // Default font size in pixels
    highContrast: false
  });

  // Load user data and settings on mount
  useEffect(() => {
    loadUserData();
    loadAccessibilitySettings();
  }, []);

  // Load user data from localStorage
  const loadUserData = () => {
    try {
      const adminData = localStorage.getItem('adminData');
      const userData = localStorage.getItem('userData');
      
      const data = adminData ? JSON.parse(adminData) : userData ? JSON.parse(userData) : null;
      
      if (data) {
        setUserDetails({
          name: data.name || '',
          email: data.email || '',
          dob: data.dob || ''
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  // Load accessibility settings
  const loadAccessibilitySettings = () => {
    const savedFontSize = localStorage.getItem('fontSize');
    const settings = {
      darkMode: localStorage.getItem('darkMode') === 'true',
      fontSize: savedFontSize ? parseInt(savedFontSize, 10) : 16,
      highContrast: localStorage.getItem('highContrast') === 'true'
    };
    setAccessibilitySettings(settings);
    applyAccessibilitySettings(settings);
  };

  // Apply accessibility settings to the page
  const applyAccessibilitySettings = (settings) => {
    // Dark mode
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Font size - apply as CSS variable
    document.documentElement.style.setProperty('--user-font-size', `${settings.fontSize}px`);
    // Also remove old large-text class for backward compatibility
      document.body.classList.remove('large-text');

    // High contrast
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  // Handle user details change
  const handleDetailsChange = (e) => {
    setUserDetails({
      ...userDetails,
      [e.target.name]: e.target.value
    });
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // Handle accessibility toggle
  const handleAccessibilityToggle = (setting) => {
    const newSettings = {
      ...accessibilitySettings,
      [setting]: !accessibilitySettings[setting]
    };
    
    setAccessibilitySettings(newSettings);
    localStorage.setItem(setting, newSettings[setting]);
    
    // Also save with user email for persistence across sessions
    const adminData = localStorage.getItem('adminData');
    const userData = localStorage.getItem('userData');
    const currentUser = adminData ? JSON.parse(adminData) : userData ? JSON.parse(userData) : null;
    
    if (currentUser && currentUser.email) {
      localStorage.setItem(`${setting}_${currentUser.email}`, newSettings[setting]);
    }
    
    applyAccessibilitySettings(newSettings);
    
    setMessage({ type: 'success', text: 'Accessibility setting updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Handle font size change (apply after 1 second delay)
  const handleFontSizeChange = (e) => {
    const newFontSize = parseInt(e.target.value, 10);
    
    // Update state immediately for slider display (but don't apply yet)
    const newSettings = {
      ...accessibilitySettings,
      fontSize: newFontSize
    };
    setAccessibilitySettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('fontSize', newFontSize);
    
    // Also save with user email for persistence across sessions
    const adminData = localStorage.getItem('adminData');
    const userData = localStorage.getItem('userData');
    const currentUser = adminData ? JSON.parse(adminData) : userData ? JSON.parse(userData) : null;
    
    if (currentUser && currentUser.email) {
      localStorage.setItem(`fontSize_${currentUser.email}`, newFontSize);
    }
    
    // Clear any existing timeout
    if (fontSizeTimeoutRef.current) {
      clearTimeout(fontSizeTimeoutRef.current);
    }
    
    // Apply font size after 1 second delay
    fontSizeTimeoutRef.current = setTimeout(() => {
      applyAccessibilitySettings(newSettings);
      setMessage({ type: 'success', text: 'Font size updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      fontSizeTimeoutRef.current = null;
    }, 1000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  // Save user details
  const handleSaveDetails = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Build update object with only non-empty fields
      const updateData = {};
      
      if (userDetails.name && userDetails.name.trim()) {
        updateData.name = userDetails.name.trim();
      }
      
      if (userDetails.email && userDetails.email.trim()) {
        updateData.email = userDetails.email.trim();
      }
      
      if (userDetails.dob) {
        updateData.dob = userDetails.dob;
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save.' });
        setLoading(false);
        return;
      }

      // Call backend API
      const response = await updateUserProfile(updateData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update local state with new data
        if (response.user) {
          setUserDetails({
            name: response.user.name || '',
            email: response.user.email || '',
            dob: response.user.dob || ''
          });
        }
      }
    } catch (err) {
      console.error('Error saving details:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'All password fields are required.' });
        setLoading(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
        setLoading(false);
        return;
      }

      // Call backend API
      const response = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Settings</h1>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            Password
          </button>
          <button
            className={`settings-tab ${activeTab === 'accessibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessibility')}
          >
            <Accessibility size={20} />
            Accessibility
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-panel">
              <h2>Profile Information</h2>
              <p className="tab-description">Update your personal information (all fields are optional)</p>

              <div className="form-group">
                <label htmlFor="name">Name (optional)</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userDetails.name}
                  onChange={handleDetailsChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userDetails.email}
                  onChange={handleDetailsChange}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth (optional)</label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={userDetails.dob}
                  onChange={handleDetailsChange}
                />
              </div>

              <button
                className="save-btn"
                onClick={handleSaveDetails}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="tab-panel">
              <h2>Change Password</h2>
              <p className="tab-description">Update your account password</p>

              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <button
                className="save-btn"
                onClick={handleChangePassword}
                disabled={loading}
              >
                <Lock size={18} />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="tab-panel">
              <h2>Accessibility Settings</h2>
              <p className="tab-description">Customize your viewing experience</p>

              <div className="accessibility-options">
                {/* Dark Mode */}
                <div className="accessibility-option">
                  <div className="option-info">
                    <div className="option-icon">
                      {accessibilitySettings.darkMode ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                      <h3>Dark Mode</h3>
                      <p>Switch between light and dark theme</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={accessibilitySettings.darkMode}
                      onChange={() => handleAccessibilityToggle('darkMode')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Font Size Slider */}
                <div className="accessibility-option">
                  <div className="option-info">
                    <div className="option-icon">
                      <Type size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3>Font Size</h3>
                      <p>Adjust font size for better readability ({accessibilitySettings.fontSize}px)</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light, #666)' }}>12px</span>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={accessibilitySettings.fontSize}
                      onChange={handleFontSizeChange}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        background: 'var(--border, #e0e0e0)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-light, #666)' }}>24px</span>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="accessibility-option">
                  <div className="option-info">
                    <div className="option-icon">
                      <Contrast size={24} />
                    </div>
                    <div>
                      <h3>High Contrast</h3>
                      <p>Enhance color contrast for better visibility</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={accessibilitySettings.highContrast}
                      onChange={() => handleAccessibilityToggle('highContrast')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;