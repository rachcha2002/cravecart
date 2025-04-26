import React, { useState } from "react";
import { User } from "../pages/AdminUsers";

type DocumentType = "driverLicense" | "vehicleRegistration" | "insurance";

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

interface DeliveryPartnerDetailsProps {
  deliveryPartner: User;
  onClose: () => void;
  onVerifyDocument: (
    userId: string,
    documentType: DocumentType
  ) => Promise<void>;
  onUnverifyDocument: (
    userId: string,
    documentType: DocumentType
  ) => Promise<void>;
  onVerifyAccount: (userId: string) => Promise<void>;
}

const DeliveryPartnerDetails: React.FC<DeliveryPartnerDetailsProps> = ({
  deliveryPartner,
  onClose,
  onVerifyDocument,
  onUnverifyDocument,
  onVerifyAccount,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(deliveryPartner.isVerified);
  const [documentVerificationStates, setDocumentVerificationStates] = useState<{
    [key: string]: boolean;
  }>({});

  const handleVerifyDocument = async (documentType: string) => {
    try {
      setDocumentVerificationStates((prev) => ({
        ...prev,
        [documentType]: true,
      }));
      console.log(deliveryPartner._id, documentType);
      await onVerifyDocument(deliveryPartner._id, documentType as DocumentType);
    } catch (error) {
      console.error(`Failed to verify ${documentType}:`, error);
    } finally {
      setDocumentVerificationStates((prev) => ({
        ...prev,
        [documentType]: false,
      }));
    }
  };

  const handleUnverifyDocument = async (documentType: string) => {
    try {
      setDocumentVerificationStates((prev) => ({
        ...prev,
        [documentType]: true,
      }));
      await onUnverifyDocument(
        deliveryPartner._id,
        documentType as DocumentType
      );
    } catch (error) {
      console.error(`Failed to unverify ${documentType}:`, error);
    } finally {
      setDocumentVerificationStates((prev) => ({
        ...prev,
        [documentType]: false,
      }));
    }
  };

  const handleVerifyAccount = async () => {
    try {
      setIsVerifying(true);
      await onVerifyAccount(deliveryPartner._id);
      setIsVerified(true);
      onClose();
    } catch (error) {
      console.error("Failed to verify account:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-4xl m-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {deliveryPartner.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Basic Information
              </h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {deliveryPartner.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {deliveryPartner.phoneNumber}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deliveryPartner.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {deliveryPartner.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Account Verification:</span>{" "}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isVerified ? "Verified" : "Unverified"}
                  </span>
                </p>
              </div>
            </div>

            {/* Delivery Information */}
            {deliveryPartner.deliveryInfo && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delivery Information
                </h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Vehicle Type:</span>{" "}
                    {deliveryPartner.deliveryInfo.vehicleType}
                  </p>
                  <p>
                    <span className="font-medium">Vehicle Number:</span>{" "}
                    {deliveryPartner.deliveryInfo.vehicleNumber}
                  </p>
                  <p>
                    <span className="font-medium">License Number:</span>{" "}
                    {deliveryPartner.deliveryInfo.licenseNumber}
                  </p>
                  <p>
                    <span className="font-medium">Availability:</span>{" "}
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deliveryPartner.deliveryInfo.availabilityStatus ===
                        "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {deliveryPartner.deliveryInfo.availabilityStatus}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documents
            </h3>
            <div className="space-y-4">
              {deliveryPartner.deliveryInfo?.documents ? (
                Object.entries(deliveryPartner.deliveryInfo.documents).map(
                  ([documentType, document]) => (
                    <div
                      key={documentType}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium capitalize">
                          {documentType.replace(/([A-Z])/g, " $1").trim()}
                        </h4>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            document.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {document.verified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Document
                        </a>
                        <div className="space-x-2">
                          {!document.verified ? (
                            <button
                              onClick={() => handleVerifyDocument(documentType)}
                              disabled={
                                documentVerificationStates[documentType]
                              }
                              className={`px-3 py-1 text-sm rounded ${
                                documentVerificationStates[documentType]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                            >
                              {documentVerificationStates[documentType]
                                ? "Verifying..."
                                : "Verify"}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleUnverifyDocument(documentType)
                              }
                              disabled={
                                documentVerificationStates[documentType]
                              }
                              className={`px-3 py-1 text-sm rounded ${
                                documentVerificationStates[documentType]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
                            >
                              {documentVerificationStates[documentType]
                                ? "Unverifying..."
                                : "Unverify"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-gray-500">No documents uploaded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          {!isVerified && (
            <button
              onClick={handleVerifyAccount}
              disabled={isVerifying}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isVerifying
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#f29f05] hover:bg-[#d88f04]"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]`}
            >
              {isVerifying ? "Verifying..." : "Verify Account"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29f05]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerDetails;
