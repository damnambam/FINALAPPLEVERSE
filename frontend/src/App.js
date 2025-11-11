import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
  useNavigate
} from 'react-router-dom';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import FeaturesGrid from './components/FeaturesGrid';
import AdvancedFilters from './components/AdvancedFilters';
import SearchResults from './components/SearchResults';
import TemplateCreator from './components/TemplateCreator';
import TreeScrollPage from './components/TreeScrollPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import CreateApple from './pages/CreateApple';
import SingleApple from './pages/SingleApple';
import SignupLogin from "./pages/SignupLogin";
import LibraryV2 from "./pages/LibraryV2";
import AppleDisp from "./components/AppleDisp";
import "@fortawesome/fontawesome-free/css/all.min.css";
import IntegratedAuth from './components/IntegratedAuth';
import './App.css';

// 🔒 Protected Route for Admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const adminToken = localStorage.getItem('adminToken');
  if (!isAdmin || !adminToken) return <Navigate to="/signup-login" replace />;
  return children;
};

// 🔒 Protected Route for Users (both admin and regular users)
const ProtectedUserRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!adminToken && !userToken) {
    return <Navigate to="/signup-login" replace />;
  }
  return children;
};

// 🍎 Wrapper component for apple detail route
const AppleDisplayPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [apple, setApple] = useState(location.state?.apple || null);
  const [loading, setLoading] = useState(!location.state?.apple);

  useEffect(() => {
    if (!apple) {
      const fetchApple = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/apples/${id}`);
          const data = await res.json();
          if (data.success) {
            setApple(data.apple);
          }
        } catch (err) {
          console.error("❌ Failed to fetch apple:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchApple();
    }
  }, [id, apple]);

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading apple details…</p>;
  if (!apple) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Apple not found.</p>;

  return (
    <AppleDisp
      appleData={apple}
      onClose={() => navigate(-1)}
      isAdmin={true}
    />
  );
};

function App() {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Check admin status on mount
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  // ✅ Listen for login/logout changes
  useEffect(() => {
    const handleAuthChange = () => {
      const adminStatus = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(adminStatus);
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // ✅ Mock search data
  const mockResults = [
    { id: 1, name: 'Honeycrisp', origin: 'Minnesota, USA', taste: 'Sweet', emoji: '🍎' },
    { id: 2, name: 'Granny Smith', origin: 'Australia', taste: 'Tart', emoji: '🍏' },
    { id: 3, name: 'Gala', origin: 'New Zealand', taste: 'Sweet', emoji: '🍎' },
    { id: 4, name: 'McIntosh', origin: 'Canada', taste: 'Tart-Sweet', emoji: '🍎' },
  ];

  // ✅ Search Logic
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
      <Navigation isAdmin={isAdmin} onLogout={handleLogout} />

      <Routes>
        {/* 🔐 Auth Pages */}
        <Route path="/signup-login" element={<SignupLogin setIsAdmin={setIsAdmin} />} />
        <Route path="/login" element={<IntegratedAuth />} />

        {/* ⚙️ Settings Page */}
        <Route
          path="/settings"
          element={
            <ProtectedUserRoute>
              <Settings />
            </ProtectedUserRoute>
          }
        />

        {/* 🔐 User Dashboard */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedUserRoute>
              <UserDashboard />
            </ProtectedUserRoute>
          }
        />

        {/* 🔐 Admin Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard isAdmin={true} />
            </ProtectedAdminRoute>
          }
        />

        {/* 📚 Library Page */}
        <Route path="/library" element={<LibraryV2 />} />

        {/* 🍎 Apple Detail Route */}
        <Route path="/apple-detail/:id" element={<AppleDisplayPage />} />

        {/* 🍎 Apple Upload Routes */}
        <Route path="/create-apple" element={<CreateApple />} />
        <Route path="/single-apple" element={<SingleApple />} />
        <Route path="/template-creator" element={<TemplateCreator />} />

        {/* 🌳 About Page */}
        <Route path="/about" element={<TreeScrollPage />} />

        {/* 🏠 Home Page */}
        <Route
          path="/"
          element={
            <>
              <HeroSection />
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
