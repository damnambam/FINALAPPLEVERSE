import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SearchSection from './components/SearchSection';
import FeaturesGrid from './components/FeaturesGrid';
import AdvancedFilters from './components/AdvancedFilters';
import SearchResults from './components/SearchResults';
import TemplateCreator from './components/TemplateCreator';
import TreeScrollPage from './components/TreeScrollPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Footer from './components/Footer';
import CreateApple from './pages/CreateApple';
import SignupLogin from "./pages/SignupLogin";
import './App.css';

// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const adminToken = localStorage.getItem('adminToken');
  
  console.log('🔒 ProtectedAdminRoute check:', { isAdmin, hasToken: !!adminToken });
  
  if (!isAdmin || !adminToken) {
    console.log('❌ Access denied - redirecting to login');
    return <Navigate to="/signup-login" replace />;
  }
  
  console.log('✅ Access granted to admin dashboard');
  return children;
};

// Protected Route Component for User Dashboard
const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    console.log('❌ User not logged in - redirecting to login');
    return <Navigate to="/signup-login" replace />;
  }
  
  return children;
};

function App() {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on mount
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
    console.log('🔐 App mounted, admin status:', adminStatus);
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      const adminStatus = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(adminStatus);
      console.log('🔄 Auth changed, admin status:', adminStatus);
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // ✅ Mock search data
  const mockResults = [
    {
      id: 1,
      name: 'Honeycrisp',
      origin: 'Minnesota, USA',
      originFlag: '🇺🇸',
      taste: 'Sweet',
      texture: 'Extra Crisp',
      uses: ['Fresh Eating', 'Salads', 'Desserts'],
      description:
        'Exceptionally crisp and juicy with a perfect balance of sweetness and tartness. Known for its explosive crunch.',
      harvestSeason: 'Late September',
      hardiness: 'Zone 3-6',
      storage: '4-6 months',
      color: '#ff6b6b',
      secondaryColor: '#ffa726',
      emoji: '🍎',
    },
    {
      id: 2,
      name: 'Granny Smith',
      origin: 'Australia',
      originFlag: '🇦🇺',
      taste: 'Tart',
      texture: 'Firm',
      uses: ['Baking', 'Cooking', 'Fresh Eating'],
      description:
        'Bright green with a very tart flavor. Excellent for baking as it holds its shape well when cooked.',
      harvestSeason: 'October',
      hardiness: 'Zone 6-9',
      storage: '5-7 months',
      color: '#66bb6a',
      secondaryColor: '#4caf50',
      emoji: '🍏',
    },
    {
      id: 3,
      name: 'Gala',
      origin: 'New Zealand',
      originFlag: '🇳🇿',
      taste: 'Sweet',
      texture: 'Crisp',
      uses: ['Fresh Eating', 'Salads', 'Sauces'],
      description: 'Mild, sweet, and aromatic with a thin skin. A great everyday eating apple.',
      harvestSeason: 'Mid August',
      hardiness: 'Zone 5-8',
      storage: '3-4 months',
      color: '#ffcc80',
      secondaryColor: '#ffb74d',
      emoji: '🍎',
    },
    {
      id: 4,
      name: 'McIntosh',
      origin: 'Canada',
      originFlag: '🇨🇦',
      taste: 'Tart-Sweet',
      texture: 'Tender',
      uses: ['Sauces', 'Juice', 'Fresh Eating'],
      description: 'Classic Canadian apple with tender white flesh and distinctive tart-sweet flavor.',
      harvestSeason: 'September',
      hardiness: 'Zone 4-7',
      storage: '2-3 months',
      color: '#ef5350',
      secondaryColor: '#e57373',
      emoji: '🍎',
    },
  ];

  // ✅ Search logic
  const performSearch = (query) => {
    if (!query) return mockResults;
    const q = query.toLowerCase();
    return mockResults.filter(
      (apple) =>
        apple.name.toLowerCase().includes(q) ||
        apple.origin.toLowerCase().includes(q) ||
        apple.taste.toLowerCase().includes(q)
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      const results = performSearch(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setHasSearched(true);
    }, 800);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    alert('Logged out successfully');
  };

  return (
    <Router>
      <Navigation
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        {/* ✅ Signup/Login Page */}
        <Route path="/signup-login" element={<SignupLogin setIsAdmin={setIsAdmin} />} />

        {/* ✅ User Dashboard - Protected */}
        <Route 
          path="/user-dashboard" 
          element={
            <ProtectedUserRoute>
              <UserDashboard />
            </ProtectedUserRoute>
          } 
        />

        {/* ✅ Admin Dashboard - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard isAdmin={true} />
            </ProtectedAdminRoute>
          }
        />

        {/* ✅ Create Apple Page */}
        <Route path="/createapple" element={<CreateApple />} />

        {/* ✅ Template Creator Page */}
        <Route path="/templates" element={<TemplateCreator />} />

        {/* ✅ About Page */}
        <Route path="/about" element={<TreeScrollPage />} />

        {/* ✅ Home Page */}
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <SearchSection
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                isSearching={isSearching}
                hasSearched={hasSearched}
              />
              {hasSearched ? (
                <SearchResults
                  query={searchQuery}
                  results={searchResults}
                  onClearSearch={handleClearSearch}
                  onFilter={() => setShowAdvancedFilters(true)}
                />
              ) : (
                <FeaturesGrid />
              )}
              {showAdvancedFilters && (
                <AdvancedFilters onClose={() => setShowAdvancedFilters(false)} />
              )}
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;