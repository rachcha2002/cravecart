import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      address: "",
    };

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    // Validate phone number
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
      isValid = false;
    }

    // Validate address
    if (!formData.address.trim()) {
      errors.address = "Address is required";
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleRegister = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      // Call register function with all required parameters
      const success = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.phoneNumber,
        formData.address
      );

      if (success) {
        toast.success("Registration successful!");
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Create Account
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Join us to start ordering your favorite food
      </p>

      <div className="space-y-6">
        {/* Name field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-primary"
            } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your full name"
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-primary"
            } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your email"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
          )}
        </div>

        {/* Phone number field */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.phoneNumber
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-primary"
            } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
            placeholder="Format: 123-456-7890"
          />
          {formErrors.phoneNumber ? (
            <p className="mt-1 text-sm text-red-500">
              {formErrors.phoneNumber}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter in format: 123-456-7890, (123) 456-7890, or +1234567890
            </p>
          )}
        </div>

        {/* Address field */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.address
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-primary"
            } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
            placeholder="Enter your delivery address"
          />
          {formErrors.address && (
            <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
          )}
        </div>

        {/* Password fields */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white pr-10"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg bg-primary text-white bg-[#f29f05] hover:bg-[#e69504] font-medium transition-colors ${
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90"
          }`}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#f29f05] hover:text-[#e69504] font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
