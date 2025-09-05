import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Verified from "./pages/Verified";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
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
import Auth from "../src/context/Auth";
import OurWorkPublic from "./pages/OurWork";
import { useEffect } from "react";
import { gapi } from "gapi-script";
import TermsPage from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import ProductionDashboard from "./components/admin/ProductionDashboard";
import TitleUpdater from "./components/common/TitleUpdater";
// import OrderTracking from "./pages/OrderTracking";

function LayoutWrapper() {
  const location = useLocation();

  // List of routes where header/footer should be shown
  const mainRoutes = [
    "/",
    "/catalogue",
    "/terms",
    "/cart",
    "/about",
    "/contact",
    "/estimate",
    "/privacy",
    "/our-work",
    // "/track-order",
    "/profile",
  ];

  // Hide header/footer if not in mainRoutes OR special routes
  const hideHeaderFooter =
    !mainRoutes.includes(location.pathname) ||
    location.pathname === "/login" ||
    location.pathname.startsWith("/auth/reset-password") ||
    location.pathname === "/admin" ||
    location.pathname === "/production" ||
    location.pathname === "/auth/verified";

  return (
    <div className="min-h-screen bg-gray-50">
      <TitleUpdater />

      {!hideHeaderFooter && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/our-work" element={<OurWorkPublic />} />
          <Route path="/auth" element={<Auth />} />               {/* handle email links */}
          <Route path="/auth/login" element={<Auth />} />         {/* handle Google login */}
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verified" element={<Verified />} />

          {/* <Route path="/track" element={<OrderTracking />} /> */}

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
          <Route
            path="/production"
            element={
              <ProtectedRoute requiredRole="production">
                <ProductionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all NotFound */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
        }}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    function start() {
      gapi.client.init({
        apiKey: "AIzaSyAcUPet5yafJOl1BacuBT9moyg_jd_291c",
        clientId:
          "7355025915-iavbbbsne3bg9d3ctusa0g98rs86uscr.apps.googleusercontent.com",
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
        scope: "https://www.googleapis.com/auth/spreadsheets",
      });
    }
    gapi.load("client:auth2", start);
  }, []);

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
