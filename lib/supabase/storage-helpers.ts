import { supabase } from "@/lib/supabase/client";

const AVATARS_BUCKET = "profile_images";

/**
 * Upload user avatar to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Delete old avatar if exists
  const { data: existingFiles } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list("", {
      search: userId,
    });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => f.name);
    await supabase.storage.from(AVATARS_BUCKET).remove(filesToDelete);
  }

  // Upload new avatar
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Update user profile image in database
 * @param userId - The user's ID
 * @param imageUrl - The public URL of the image
 */
export async function updateUserProfileImage(
  userId: string,
  imageUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ profile_image: imageUrl })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

/**
 * Delete user avatar from storage
 * @param userId - The user's ID
 */
export async function deleteAvatar(userId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list("", {
      search: userId,
    });

  if (files && files.length > 0) {
    const filesToDelete = files.map((f) => f.name);
    await supabase.storage.from(AVATARS_BUCKET).remove(filesToDelete);
  }

  // Clear profile_image in database
  await supabase
    .from("users")
    .update({ profile_image: null })
    .eq("id", userId);
}

/**
 * Validate image file
 * @param file - The file to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
  }

  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 5MB.");
  }

  return true;
}
