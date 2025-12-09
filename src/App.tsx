import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import AboutDevelopers from './pages/AboutDevelopers';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import ScrollToTop from './components/ScrollToTop';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/books" element={
          <ProtectedRoute>
            <Books />
          </ProtectedRoute>
        } />
        <Route path="/book/:id" element={
          <ProtectedRoute>
            <BookDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/about-developers" element={
          <ProtectedRoute>
            <AboutDevelopers />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </div >
  );
}

export default App;
