import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const SessionTimer: React.FC = () => {
  const { token, refreshToken } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!token) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiryTime = payload.exp * 1000;
        const remaining = Math.floor((expiryTime - Date.now()) / 1000);

        setTimeLeft(remaining > 0 ? remaining : 0);

        // Show warning when less than 5 minutes remain
        setShowWarning(remaining > 0 && remaining < 300);

        // Auto refresh token when less than 2 minutes remain
        if (remaining > 0 && remaining < 120) {
          refreshToken();
        }
      } catch (error) {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [token, refreshToken]);

  if (!timeLeft || timeLeft <= 0) {
    return null;
  }

  // Format time as mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return showWarning ? (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg">
      <div className="flex">
        <div className="py-1">
          <svg
            className="h-6 w-6 text-yellow-500 mr-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="font-bold">Session Expiring</p>
          <p className="text-sm">Your session will expire in {formattedTime}</p>
          <button
            onClick={() => refreshToken()}
            className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-xs"
          >
            Extend Session
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default SessionTimer;
