import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActivePath = (path) => {
    return location.pathname === path ? 'border-[#f29f05] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
  };

  const isMobileActivePath = (path) => {
    return location.pathname === path ? 'bg-[#f29f05]/10 text-[#f29f05]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="mx-auto max-w-[90%] px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl sm:text-2xl font-bold text-[#f29f05]">CraveCart</span>
              </div>
              <div className="hidden md:ml-12 md:flex md:space-x-12">
                <Link
                  to="/"
                  className={`inline-flex items-center border-b-2 px-2 pt-1 text-lg font-medium transition-colors duration-200 ${isActivePath('/')}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/menu"
                  className={`inline-flex items-center border-b-2 px-2 pt-1 text-lg font-medium transition-colors duration-200 ${isActivePath('/menu')}`}
                >
                  Menu
                </Link>
                <Link
                  to="/orders"
                  className={`inline-flex items-center border-b-2 px-2 pt-1 text-lg font-medium transition-colors duration-200 ${isActivePath('/orders')}`}
                >
                  Orders
                </Link>
              </div>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center space-x-6">
              <button
                type="button"
                className="rounded-full bg-white p-2.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              <Link
                to="/profile"
                className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f29f05] focus:ring-offset-2"
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-[#f29f05]/10"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f29f05]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-4 pb-3 pt-2">
              <Link
                to="/"
                className={`block rounded-lg px-3 py-2 text-base font-medium ${isMobileActivePath('/')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/menu"
                className={`block rounded-lg px-3 py-2 text-base font-medium ${isMobileActivePath('/menu')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Menu
              </Link>
              <Link
                to="/orders"
                className={`block rounded-lg px-3 py-2 text-base font-medium ${isMobileActivePath('/orders')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link
                to="/profile"
                className={`block rounded-lg px-3 py-2 text-base font-medium ${isMobileActivePath('/profile')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="py-6 sm:py-10">
        <main>
          <div className="mx-auto max-w-[90%] px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/menu", element: <Menu /> },
      { path: "/orders", element: <Orders /> },
      { path: "/profile", element: <Profile /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
} 