import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Verified from './pages/Verified';
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from './pages/NotFound';
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Catalogue from "./pages/Catalogue";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Estimate from "./pages/Estimate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FaviconUpdater from "./components/FaviconUpdater";
import AuthBridge from "../src/context/Auth";
import OurWorkPublic from "./pages/OurWork"

// Yahan apna ResetPassword component import karna mat bhool
import ResetPassword from "./pages/ResetPassword";

function LayoutWrapper() {
  const location = useLocation();
  const hideHeaderFooter =
    location.pathname.startsWith("/auth/reset-password") ||
    location.pathname === "/login" ||
    location.pathname === "/admin" ||
    location.pathname === "/auth/verified";


  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeaderFooter && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/our-work" element={<OurWorkPublic />} />
          {/* Reset Password Route */}
          <Route path="/auth" element={<AuthBridge />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verified" element={<Verified />} />
          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <FaviconUpdater />
      <CartProvider>
        <Router>
          <LayoutWrapper />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}


export default App;
