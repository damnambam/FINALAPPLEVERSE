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

  const updateAuthState = () => {
    let currentUser = getCurrentUser();
    const loggedIn = isAuthenticated();
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

    if (!currentUser || !currentUser.name) {
      try {
        const adminData = localStorage.getItem('adminData');
        const userData = localStorage.getItem('userData');

        if (adminData) currentUser = JSON.parse(adminData);
        else if (userData) currentUser = JSON.parse(userData);
      } catch (err) {
        console.error('Error parsing user data from localStorage:', err);
      }
    }

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

  useEffect(() => {
    updateAuthState();
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = () => updateAuthState();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const p = location.pathname;
    if (p === '/') setActiveTab('home');
    else if (p === '/library') setActiveTab('library');
    else if (p === '/about') setActiveTab('about');
    else if (p === '/dashboard' || p === '/user-dashboard') setActiveTab('dashboard');
  }, [location.pathname]);

  const getTabsArray = () => {
    const baseTabs = [
      { id: 'home', label: 'Home', icon: Home, route: '/' },
      { id: 'library', label: 'Library', icon: Package, route: '/library' },
      { id: 'about', label: 'About', icon: Info, route: '/about' },
    ];

    if (isAdminUser)
      baseTabs.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' });
    else if (isLoggedIn)
      baseTabs.push({ id: 'dashboard', label: 'My Dashboard', icon: User, route: '/user-dashboard' });

    return baseTabs;
  };

  const tabs = getTabsArray();

  return (
    <nav className="navigation" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
      <div className="nav-container-fixed" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: '0 32px', height: '70px', alignItems: 'center' }}>

        {/* LEFT — LOGO */}
        <div className="nav-left">
          <Apple size={28} className="brand-icon" />
          <span className="brand-text">AppleVerse 2.0</span>
        </div>

        {/* CENTER — NAVIGATION TABS */}
        <div className="nav-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => navigate(tab.route)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT — SETTINGS + LOGOUT */}
        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <button className="settings-btn" onClick={() => navigate('/settings')}>
                <Settings size={18} />
              </button>

              <button className="logout-btn" onClick={() => {
                logout();
                window.dispatchEvent(new Event('authChange'));
                navigate('/');
              }}>
                <LogIn size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button className="admin-login-btn" onClick={() => navigate('/signup-login')}>
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
