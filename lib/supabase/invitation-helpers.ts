import { supabase } from "./client";
import { sendEmail } from "@/lib/brevo/emailService";
import { randomBytes } from "crypto";

// Generate a secure random token
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createInvitation(
  email: string,
  invitedBy: string,
  role: "admin" | "employee" = "employee"
) {
  // Get the inviter's name
  const { data: inviter, error: inviterError } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", invitedBy)
    .single();

  if (inviterError) {
    console.error("Error fetching inviter details:", inviterError);
    throw new Error("Unable to fetch inviter information");
  }

  const inviterName = inviter?.full_name || "Zeloite Admin";

  // Check if invitation already exists
  const { data: existing } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", email)
    .single();

  // Generate a unique token
  const invitationToken = generateInvitationToken();

  // If invitation exists and is pending, update it with new token
  if (existing) {
    if (existing.status === "pending") {
      const { data, error } = await supabase
        .from("invitations")
        .update({
          invited_by: invitedBy,
          created_at: new Date().toISOString(),
          invitation_token: invitationToken,
        })
        .eq("email", email)
        .select();

      if (error) throw error;

      // Send updated invitation email with new token
      await sendInvitationEmail(email, invitationToken, role, inviterName);

      return data;
    } else if (existing.status === "accepted") {
      throw new Error(
        "This user has already accepted an invitation and may already have an account."
      );
    }
  }

  // Create new invitation with token
  const { data, error } = await supabase
    .from("invitations")
    .insert([
      {
        email,
        invited_by: invitedBy,
        role,
        status: "pending",
        invitation_token: invitationToken,
      },
    ])
    .select();

  if (error) throw error;

  // Send invitation email
  await sendInvitationEmail(email, invitationToken, role, inviterName);

  return data;
}

async function sendInvitationEmail(
  email: string,
  token: string,
  role: string,
  invitedBy: string
) {
  const signupUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }/auth/signup?token=${token}`;

  const subject = "You're invited to join Zeloite workspace!";
  const htmlContent = `
    <p>Hello,</p>
    <p><strong>${invitedBy}</strong> has invited you to join the Zeloite workspace on Task Management System.</p>
    <p>Please click the link below to accept your invitation and create your account:</p>
    <p><a href="${signupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a></p>
    <p>Your role will be: <strong>${role}</strong></p>
    <p>This invitation link is unique to you and can only be used once.</p>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
  `;

  const emailResult = await sendEmail({
    to: [{ email, name: email }],
    subject,
    htmlContent,
    tags: ["invitation"],
  });

  if (!emailResult.success) {
    console.error("Failed to send invitation email:", emailResult.error);
  } else {
    console.log("Invitation email sent successfully to:", email);
  }
}

export async function acceptInvitation(email: string, userId: string) {
  // Try to find a pending invitation
  const { data: invitations, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", email)
    .eq("status", "pending");

  // If there's an error fetching, throw it
  if (fetchError) throw fetchError;

  // If no pending invitation exists, that's okay - user might have already accepted or signed up without invitation
  if (!invitations || invitations.length === 0) {
    console.log("No pending invitation found for:", email);
    return null;
  }

  // Get the first pending invitation
  const invitation = invitations[0];

  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (updateError) throw updateError;

  return invitation;
}
