import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import Orders from "./pages/Orders";
import RestaurantDetails from "./pages/Restaurants";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/restaurants" element={<RestaurantDetails />} />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
