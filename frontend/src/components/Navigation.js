import React, { useState, useEffect } from 'react';
import { Apple, Home, Package, Info, LogIn, LayoutDashboard, User, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../services/authService';
import '../styles/Navigation.css';
 
const Navigation = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
 
  // Function to update authentication state
  const updateAuthState = () => {
    let currentUser = getCurrentUser();
    const loggedIn = isAuthenticated();
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
   
    // If getCurrentUser didn't return user data, try getting from localStorage directly
    if (!currentUser || !currentUser.name) {
      try {
        const adminData = localStorage.getItem('adminData');
        const userData = localStorage.getItem('userData');
       
        if (adminData) {
          currentUser = JSON.parse(adminData);
        } else if (userData) {
          currentUser = JSON.parse(userData);
        }
      } catch (err) {
        console.error('Error parsing user data from localStorage:', err);
      }
    }
   
    // Basic validation - check if token exists and looks valid
    if (loggedIn && (!token || token === 'null' || token === 'undefined')) {
      logout();
      setUser(null);
      setIsLoggedIn(false);
      setIsAdminUser(false);
      return;
    }
   
    setUser(currentUser);
    setIsLoggedIn(loggedIn);
    setIsAdminUser(adminStatus);
  };
 
  // Check authentication on mount and when location changes
  useEffect(() => {
    updateAuthState();
  }, [location.pathname]);
 
  // Listen for storage changes (when user logs in/out in another tab or component)
  useEffect(() => {
    const handleStorageChange = () => {
      updateAuthState();
    };
 
    window.addEventListener('storage', handleStorageChange);
   
    // Custom event for same-tab updates
    window.addEventListener('authChange', handleStorageChange);
 
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);
 
  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveTab('home');
    else if (path === '/library') setActiveTab('library');
    else if (path === '/about') setActiveTab('about');
    else if (path === '/dashboard') setActiveTab('dashboard');
    else if (path === '/user-dashboard') setActiveTab('dashboard');
  }, [location.pathname]);
 
  // Build tabs array dynamically
  const getTabsArray = () => {
    const baseTabs = [
      { id: 'home', label: 'Home', icon: Home, route: '/' },
      { id: 'library', label: 'Library', icon: Package, route: '/library' },
      { id: 'about', label: 'About', icon: Info, route: '/about' },
    ];
 
    // Add dashboard tab based on user type
    if (isAdminUser) {
      baseTabs.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' });
    } else if (isLoggedIn) {
      baseTabs.push({ id: 'dashboard', label: 'My Dashboard', icon: User, route: '/user-dashboard' });
    }
 
    return baseTabs;
  };
 
  const tabs = getTabsArray();
 
  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    if (tab.route) {
      navigate(tab.route);
    }
  };
 
  const handleSignupLogin = () => {
    navigate('/signup-login');
  };
 
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsLoggedIn(false);
    setIsAdminUser(false);
    setActiveTab('home');
   
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('authChange'));
   
    navigate('/');
  };
 
  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <Apple size={28} className="brand-icon" />
          <span className="brand-text">AppleVerse 2.0</span>
        </div>
 
        {/* Main Navigation Tabs */}
        <div className="nav-tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                <IconComponent size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
 
        {/* User Actions */}
        <div className="nav-actions">
          {isLoggedIn ? (
            <div className="user-menu">
              <button
                className="settings-btn"
                onClick={() => navigate('/settings')}
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <LogIn size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              className="admin-login-btn"
              onClick={handleSignupLogin}
              title="Signup or Login"
            >
              <LogIn size={18} />
              <span>Signup/Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
 
export default Navigation;