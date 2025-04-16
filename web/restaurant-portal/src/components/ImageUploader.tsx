// src/components/ImageUploader.tsx
import React, { useEffect, useRef } from "react";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  buttonText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  buttonText = "Upload Image",
}) => {
  const cloudinaryWidget = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - Cloudinary is loaded from CDN
    if (window.cloudinary) {
      cloudinaryWidget.current = window.cloudinary.createUploadWidget(
        {
          cloudName: "dn1w8k2l1", // Replace with your Cloudinary cloud name
          uploadPreset: "restaurant-images", // Replace with your upload preset
          sources: ["local", "camera"],
          multiple: false,
          cropping: true,
          styles: {
            palette: {
              window: "#F5F5F5",
              sourceBg: "#FFFFFF",
              windowBorder: "#90a0b3",
              tabIcon: "#0094c7",
              inactiveTabIcon: "#69778A",
              menuIcons: "#0094C7",
              link: "#53ad9d",
              action: "#8F5DA5",
              inProgress: "#0194c7",
              complete: "#53ad9d",
              error: "#c43737",
              textDark: "#000000",
              textLight: "#FFFFFF",
            },
          },
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            onUploadSuccess(result.info.secure_url);
          }
        }
      );
    }
  }, [onUploadSuccess]);

  const openWidget = () => {
    if (cloudinaryWidget.current) {
      cloudinaryWidget.current.open();
    }
  };

  return (
    <button
      type="button"
      onClick={openWidget}
      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
    >
      <svg
        className="-ml-1 mr-2 h-5 w-5 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
      {buttonText}
    </button>
  );
};

export default ImageUploader;
