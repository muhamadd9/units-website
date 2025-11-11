import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Arts from "./pages/Arts";
import ArtDetail from "./pages/ArtDetail";
import ArtistProfile from "./pages/ArtistProfile";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import ArtistOrders from "./pages/ArtistOrders";
import UserOrders from "./pages/UserOrders";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompanyOneUnitsAdmin from "./pages/admin/CompanyOneUnitsAdmin";
import CompanyTwoUnitsAdmin from "./pages/admin/CompanyTwoUnitsAdmin";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompanyOneUnits from "./pages/units/CompanyOneUnits";
import CompanyTwoUnits from "./pages/units/CompanyTwoUnits";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/units/zaya-development" replace />;
};

const NavIfNotAdmin = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return <Navbar />;
};

const FooterIfNotAdmin = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return <Footer />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavIfNotAdmin />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Public legacy routes (kept but not used as home) */}
            <Route path="/arts" element={<Arts />} />
            <Route path="/arts/:id" element={<ArtDetail />} />
            <Route path="/artist/:id" element={<ArtistProfile />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/artist-orders" element={<ArtistOrders />} />
            <Route path="/my-orders" element={<UserOrders />} />

            {/* Units (view) */}
            <Route path="/units/zaya-development" element={<CompanyOneUnits />} />
            <Route path="/units/rikaz-development" element={<CompanyTwoUnits />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="zaya-development" replace />} />
              <Route path="zaya-development" element={<CompanyOneUnitsAdmin />} />
              <Route path="rikaz-development" element={<CompanyTwoUnitsAdmin />} />
              <Route path="bookings" element={<BookingsAdmin />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* <FooterIfNotAdmin /> */}
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
