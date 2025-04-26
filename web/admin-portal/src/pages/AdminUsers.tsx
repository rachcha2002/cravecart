import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { api } from "../config/api";
import AdminForm from "../components/AdminForm";
import RestaurantDetails from "../components/RestaurantDetails";
import DeliveryPartnerDetails from "../components/DeliveryPartnerDetails";
import { toast } from "react-hot-toast";
import { debounce } from "lodash"; // Import debounce for performance optimization

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isVerified: boolean;
  phoneNumber: string;
  address?: string;
  restaurantInfo?: {
    restaurantName: string;
    description: string;
    cuisine: string[];
    businessHours: {
      open: string;
      close: string;
    };
    location: {
      type: string;
      coordinates: [number, number];
    };
    images: Array<{
      url: string;
      description: string;
      isPrimary?: boolean;
      _id: string;
      uploadedAt: string;
    }>;
  };
  createdAt: string;
  deliveryInfo?: {
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    availabilityStatus: string;
    documents: {
      driverLicense?: {
        url: string;
        verified: boolean;
        uploadedAt: string;
      };
      vehicleRegistration?: {
        url: string;
        verified: boolean;
        uploadedAt: string;
      };
      insurance?: {
        url: string;
        verified: boolean;
        uploadedAt: string;
      };
    };
  };
}

interface PaginatedResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

type UserRole = "admin" | "restaurant" | "delivery" | "customer";
type DocumentType = "driverLicense" | "vehicleRegistration" | "insurance";
type SearchField = "name" | "email" | "phone" | "address" | "all";

interface Document {
  url: string;
  verified: boolean;
  uploadedAt: string;
}

interface Documents {
  driverLicense?: Document;
  vehicleRegistration?: Document;
  insurance?: Document;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<UserRole>("admin");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<User | null>(
    null
  );
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] =
    useState<User | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [isSearching, setIsSearching] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, activeTab]);

  // Create a debounced search function to improve performance
  // This will wait for 300ms after the user stops typing before executing the search
  const debouncedSearch = debounce((query: string) => {
    setIsSearching(query.length > 0);
    // If we want server-side search, we would call fetchUsers with search params here
    // For now, we're doing client-side filtering
  }, 300);

  // Update the debounced search whenever searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel(); // Clean up the debounced function
  }, [searchQuery]);

  const fetchUsers = async (searchParams = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      // Here we could add search parameters for server-side search:
      // params: { page: pagination.page, limit: pagination.limit, role: activeTab, search: searchQuery }
      const response = await axios.get<PaginatedResponse>(
        api.endpoints.users.getAll,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: pagination.page,
            limit: pagination.limit,
            role: activeTab,
            ...searchParams,
          },
        }
      );

      setUsers(response.data.users);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch users");
      setLoading(false);
    }
  };

  // Enhanced search with field-specific filtering
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase().trim();

    switch (searchField) {
      case "name":
        return user.name.toLowerCase().includes(query);
      case "email":
        return user.email.toLowerCase().includes(query);
      case "phone":
        return user.phoneNumber.toLowerCase().includes(query);
      case "address":
        return user.address
          ? user.address.toLowerCase().includes(query)
          : false;
      case "all":
      default:
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phoneNumber.toLowerCase().includes(query) ||
          (user.address && user.address.toLowerCase().includes(query)) ||
          // For restaurants, also search in restaurant name
          (user.restaurantInfo?.restaurantName &&
            user.restaurantInfo.restaurantName.toLowerCase().includes(query)) ||
          // For delivery personnel, also search in vehicle info
          (user.deliveryInfo?.vehicleNumber &&
            user.deliveryInfo.vehicleNumber.toLowerCase().includes(query))
        );
    }
  });

  // Clear search and reset pagination
  const clearSearch = () => {
    setSearchQuery("");
    setPagination({ ...pagination, page: 1 });
    setIsSearching(false);
  };

  // Handle specific field search
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchField(field);
    // Re-apply the current search with the new field selection
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  };

  // You can implement server-side search to improve performance with large datasets
  const handleServerSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUsers({ search: searchQuery, searchField });
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        api.endpoints.users.updateStatus(userId),
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // Refresh the user list
    } catch (error) {
      setError("Failed to update user status");
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        api.endpoints.users.verifyUser(userId),
        { isVerified: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchUsers(); // Refresh the user list
    } catch (error) {
      setError("Failed to verify user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(api.endpoints.users.deleteUser(userId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      setError("Failed to delete user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (
      !window.confirm("Are you sure you want to reset this user's password?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(api.endpoints.users.resetPassword(userId), null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(
        "Password reset successful. The new password has been sent to the user's email."
      );
    } catch (error) {
      setError("Failed to reset password");
    }
  };

  const handleEditAdmin = (admin: User) => {
    setSelectedAdmin(admin);
    setShowAdminForm(true);
  };

  const handleAdminFormSuccess = () => {
    setShowAdminForm(false);
    setSelectedAdmin(null);
    fetchUsers();
  };

  const handleAdminFormCancel = () => {
    setShowAdminForm(false);
    setSelectedAdmin(null);
  };

  const handleVerifyDocument = async (
    userId: string,
    documentType: DocumentType
  ) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_USER_SERVICE_URL}/api/users/${userId}/delivery/documents/${documentType}/verify`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify document");
      }

      // Update the selected delivery partner's document verification status
      if (selectedDeliveryPartner && selectedDeliveryPartner._id === userId) {
        setSelectedDeliveryPartner((prev) => {
          if (!prev || !prev.deliveryInfo) return prev;
          return {
            ...prev,
            deliveryInfo: {
              ...prev.deliveryInfo,
              documents: {
                ...prev.deliveryInfo.documents,
                [documentType]: {
                  ...prev.deliveryInfo.documents[documentType],
                  verified: true,
                },
              },
            },
          };
        });
      }

      // Refresh the users list to get updated verification status
      fetchUsers();
      toast.success("Document verified successfully");
    } catch (error) {
      console.error("Error verifying document:", error);
      toast.error("Failed to verify document");
    }
  };

  const handleUnverifyDocument = async (
    userId: string,
    documentType: DocumentType
  ) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_USER_SERVICE_URL}/api/users/${userId}/delivery/documents/${documentType}/unverify`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unverify document");
      }

      // Update the selected delivery partner's document verification status
      if (selectedDeliveryPartner && selectedDeliveryPartner._id === userId) {
        setSelectedDeliveryPartner((prev) => {
          if (!prev || !prev.deliveryInfo) return prev;
          return {
            ...prev,
            deliveryInfo: {
              ...prev.deliveryInfo,
              documents: {
                ...prev.deliveryInfo.documents,
                [documentType]: {
                  ...prev.deliveryInfo.documents[documentType],
                  verified: false,
                },
              },
            },
          };
        });
      }

      // Refresh the users list to get updated verification status
      fetchUsers();
      toast.success("Document unverified successfully");
    } catch (error) {
      console.error("Error unverifying document:", error);
      toast.error("Failed to unverify document");
    }
  };

  const handleVerifyAccount = async (userId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_USER_SERVICE_URL}/api/users/${userId}/verify`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify account");
      }

      // Refresh the users list to get updated verification status
      fetchUsers();
      toast.success("Account verified successfully");
    } catch (error) {
      console.error("Error verifying account:", error);
      toast.error("Failed to verify account");
    }
  };

  const handleUnverifyUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.patch(
        `${process.env.REACT_APP_USER_SERVICE_URL}/api/users/${userId}/delivery/unverify`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Update the users list to reflect the change
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isVerified: false } : user
          )
        );
        toast.success("User unverified successfully");
      }
    } catch (error) {
      console.error("Error unverifying user:", error);
      toast.error("Failed to unverify user");
    }
  };

  const tabs: { id: UserRole; label: string }[] = [
    { id: "admin", label: "Admins" },
    { id: "restaurant", label: "Restaurants" },
    { id: "delivery", label: "Delivery Partners" },
    { id: "customer", label: "Customers" },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          {activeTab === "admin" && (
            <button
              onClick={() => setShowAdminForm(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#f29f05] hover:bg-[#d88f04] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]"
            >
              Register New Admin
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPagination({ ...pagination, page: 1 });
                  clearSearch(); // Reset search when changing tabs
                }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? "border-[#f29f05] text-[#f29f05]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Enhanced Search Bar */}
        <div className="mt-4 mb-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}s...`}
                className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-[#f29f05] focus:border-[#f29f05]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                {!searchQuery && (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Search Field Selector */}
            <div className="w-40">
              <select
                value={searchField}
                onChange={(e) =>
                  handleSearchFieldChange(e.target.value as SearchField)
                }
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#f29f05] focus:border-[#f29f05] sm:text-sm rounded-md"
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="address">Address</option>
              </select>
            </div>

            {/* Server-side search button (uncomment if implementing server-side search) */}
            {/* <button
              onClick={handleServerSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#f29f05] hover:bg-[#d88f04] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]"
            >
              Search
            </button> */}
          </div>

          {/* Search status indicator */}
          {isSearching && (
            <div className="mt-2 text-sm text-gray-500">
              Found {filteredUsers.length} results for "{searchQuery}"
              {searchField !== "all" && ` in ${searchField}`}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`${
                    activeTab === "restaurant" || activeTab === "delivery"
                      ? "cursor-pointer hover:bg-gray-50"
                      : ""
                  }`}
                  onClick={() => {
                    if (activeTab === "restaurant") {
                      setSelectedRestaurant(user);
                    } else if (activeTab === "delivery") {
                      setSelectedDeliveryPartner(user);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.isVerified ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      {activeTab === "admin" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAdmin(user);
                            }}
                            className="text-[#f29f05] hover:text-[#d88f04]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetPassword(user._id);
                            }}
                            className="text-[#f29f05] hover:text-[#d88f04]"
                          >
                            Reset Password
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(
                            user._id,
                            user.status === "active" ? "inactive" : "active"
                          );
                        }}
                        className="text-[#f29f05] hover:text-[#d88f04]"
                      >
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      {user.isVerified ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnverifyUser(user._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Unverify
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyUser(user._id);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user._id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results Message */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isSearching
              ? `No ${activeTab}s found matching your search criteria.`
              : `No ${activeTab}s available.`}
          </div>
        )}

        {/* Pagination */}
        {(!isSearching || filteredUsers.length > 0) && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{pagination.page}</span>{" "}
                  to <span className="font-medium">{pagination.pages}</span> of{" "}
                  <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    }
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    }
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Form Modal */}
      {showAdminForm && (
        <AdminForm
          mode={selectedAdmin ? "edit" : "create"}
          adminData={selectedAdmin || undefined}
          onSuccess={handleAdminFormSuccess}
          onCancel={handleAdminFormCancel}
        />
      )}

      {/* Restaurant Details Modal */}
      {selectedRestaurant && (
        <RestaurantDetails
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onVerify={handleVerifyUser}
        />
      )}

      {/* Delivery Partner Details Modal */}
      {selectedDeliveryPartner && (
        <DeliveryPartnerDetails
          deliveryPartner={selectedDeliveryPartner}
          onClose={() => setSelectedDeliveryPartner(null)}
          onVerifyDocument={handleVerifyDocument}
          onUnverifyDocument={handleUnverifyDocument}
          onVerifyAccount={handleVerifyAccount}
        />
      )}
    </div>
  );
};

export default AdminUsers;
