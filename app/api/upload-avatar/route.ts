import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { validateImageFile } from "@/lib/supabase/storage-helpers";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "File and userId are required" },
        { status: 400 }
      );
    }

    // Validate file
    try {
      validateImageFile(file);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Upload to Supabase Storage using admin client
    const AVATARS_BUCKET = "profile_images";
    
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Delete old avatar if exists
    const { data: existingFiles } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .list("", {
        search: userId,
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => f.name);
      await supabaseAdmin.storage.from(AVATARS_BUCKET).remove(filesToDelete);
    }

    // Upload new avatar
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);

    // Update database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ profile_image: publicUrl })
      .eq("id", userId);

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
