import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, Moon, Save } from 'lucide-react';
import { updateUserProfile, changePassword } from '../services/authService';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [userDetails, setUserDetails] = useState({ name: '', email: '', dob: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUserData();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    applyDarkMode(savedDarkMode);
  }, []);

  const loadUserData = () => {
    try {
      const adminData = localStorage.getItem('adminData');
      const userData = localStorage.getItem('userData');
      const data = adminData ? JSON.parse(adminData) : userData ? JSON.parse(userData) : null;
      if (data) setUserDetails({ name: data.name || '', email: data.email || '', dob: data.dob || '' });
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const applyDarkMode = (enabled) => {
    if (enabled) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  };

  const handleDetailsChange = (e) => setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const togglePasswordVisibility = (field) => setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', newValue);
    applyDarkMode(newValue);
    setMessage({ type: 'success', text: 'Dark Mode updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveDetails = async () => {
    setLoading(true); setMessage({ type: '', text: '' });
    try {
      const updateData = {};
      if (userDetails.name.trim()) updateData.name = userDetails.name.trim();
      if (userDetails.email.trim()) updateData.email = userDetails.email.trim();
      if (userDetails.dob) updateData.dob = userDetails.dob;

      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save.' }); setLoading(false); return;
      }

      const response = await updateUserProfile(updateData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (response.user) setUserDetails({ name: response.user.name || '', email: response.user.email || '', dob: response.user.dob || '' });
      }
    } catch (err) {
      console.error('Error saving details:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    setLoading(true); setMessage({ type: '', text: '' });
    try {
      const { currentPassword, newPassword, confirmPassword } = passwordData;
      if (!currentPassword || !newPassword || !confirmPassword) {
        setMessage({ type: 'error', text: 'All password fields are required.' }); setLoading(false); return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' }); setLoading(false); return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' }); setLoading(false); return;
      }

      const response = await changePassword(currentPassword, newPassword);
      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Settings</h1>
      </div>

      {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

      <div className="settings-content">
        <div className="settings-tabs">
          <button className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={20}/> Profile</button>
          <button className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}><Lock size={20}/> Password</button>
          <button className={`settings-tab ${activeTab === 'accessibility' ? 'active' : ''}`} onClick={() => setActiveTab('accessibility')}><Moon size={20}/> Accessibility</button>
        </div>

        <div className="settings-tab-content">
          {activeTab === 'profile' && (
            <div className="tab-panel">
              <h2>Profile Information</h2>
              <p className="tab-description">Update your personal information (all fields are optional)</p>
              <div className="form-group">
                <label htmlFor="name">Name (optional)</label>
                <input type="text" id="name" name="name" value={userDetails.name} onChange={handleDetailsChange} placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input type="email" id="email" name="email" value={userDetails.email} onChange={handleDetailsChange} placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date of Birth (optional)</label>
                <input type="date" id="dob" name="dob" value={userDetails.dob} onChange={handleDetailsChange} />
              </div>
              <button className="save-btn" onClick={handleSaveDetails} disabled={loading}><Save size={18}/>{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-panel">
              <h2>Change Password</h2>
              <p className="tab-description">Update your account password</p>
              {['current', 'new', 'confirm'].map((field) => (
                <div className="form-group" key={field}>
                  <label htmlFor={`${field}Password`}>{field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}</label>
                  <div className="password-input-wrapper">
                    <input type={showPasswords[field] ? 'text' : 'password'} id={`${field}Password`} name={`${field}Password`} value={passwordData[`${field}Password`]} onChange={handlePasswordChange} placeholder={`Enter ${field} password`} />
                    <button type="button" className="toggle-password" onClick={() => togglePasswordVisibility(field)}><Eye size={18} /></button>
                  </div>
                </div>
              ))}
              <button className="save-btn" onClick={handleChangePassword} disabled={loading}><Lock size={18}/>{loading ? 'Changing...' : 'Change Password'}</button>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="tab-panel">
              <h2>Accessibility Settings</h2>
              <p className="tab-description">Customize your viewing experience</p>
              <div className="accessibility-options">
                <div className="accessibility-option">
                  <div className="option-info">
                    <div className="option-icon"><Moon size={24}/></div>
                    <div>
                      <h3>Dark Mode</h3>
                      <p>Switch between light and dark theme</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
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
