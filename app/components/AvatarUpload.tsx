"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";

interface AvatarUploadProps {
  currentImageUrl?: string | null;
  userId: string;
  onUploadSuccess?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

export default function AvatarUpload({
  currentImageUrl,
  userId,
  onUploadSuccess,
  size = "md",
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setError(null);
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setPreviewUrl(data.url);
      onUploadSuccess?.(data.url);
      
      // Fire custom event to notify layout components to refresh user data
      window.dispatchEvent(new CustomEvent('avatarUploaded', { 
        detail: { userId, avatarUrl: data.url } 
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile"
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-500">
              <Camera size={size === "sm" ? 24 : size === "md" ? 32 : 40} />
            </div>
          )}
        </div>

        {/* Upload button overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload photo"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Instructions */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click the camera icon to upload
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          JPG, PNG or WebP (max 5MB)
        </p>
      </div>

      {/* Remove button */}
      {previewUrl && !uploading && (
        <button
          onClick={handleRemove}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Remove photo"
        >
          <Trash2 size={16} />
          <span>Remove Photo</span>
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Success message */}
      {!uploading && !error && previewUrl && previewUrl !== currentImageUrl && (
        <div className="text-sm text-green-600 dark:text-green-400 text-center">
          Photo uploaded successfully!
        </div>
      )}
    </div>
  );
}
