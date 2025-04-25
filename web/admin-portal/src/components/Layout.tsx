import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import Header from "./Header";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Users", path: "/users", icon: "👥" },
    { name: "Restaurants", path: "/restaurants", icon: "🍽️" },
    { name: "Orders", path: "/orders", icon: "📦" },
    { name: "Reports", path: "/reports", icon: "📈" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-lg transition-all duration-300`}
      >
        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg ${
                    location.pathname === item.path
                      ? "bg-[#f29f05] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
