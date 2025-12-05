import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// ----------------------------
// Supabase Initialization
// ----------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// ----------------------------------------------------
// Core Email Sender
// ----------------------------------------------------
interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
  cc?: { email: string; name?: string }[];
  bcc?: { email: string; name?: string }[];
  headers?: { [key: string]: string };
  params?: { [key: string]: any };
  tags?: string[];
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
  sender,
  replyTo,
  cc,
  bcc,
  headers,
  params,
  tags,
}: SendEmailParams) {
  const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
  const defaultSenderEmail =
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || "no-reply@yourdomain.com";

  const finalSender = sender || {
    email: defaultSenderEmail,
    name: "Task Management System",
  };

  // Missing API KEY
  if (!apiKey) {
    console.error("❌ Brevo API key missing.");
    return { success: false, message: "Brevo API key not defined." };
  }

  // Missing sender email
  if (!finalSender.email) {
    console.error("❌ Sender email is missing.");
    return { success: false, message: "Sender email missing." };
  }

  // Log params
  console.log("📬 Sending email...");
  console.log("➡ Sender:", finalSender.email);
  console.log("➡ To:", JSON.stringify(to));

  const body = {
    sender: finalSender,
    to,
    subject,
    htmlContent,
    replyTo,
    cc,
    bcc,
    headers,
    params,
    tags,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Brevo Error:", data);
      return { success: false, error: data };
    }

    console.log("✅ Email sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("🔥 Email sending failed:", error);
    return { success: false, error };
  }
}

// ----------------------------------------------------
// Registration Confirmation Email
// ----------------------------------------------------
export async function sendRegistrationConfirmationEmail(
  toEmail: string,
  toName: string,
  verificationLink: string
) {
  const subject = "Welcome! Please confirm your email";
  const htmlContent = `
    <p>Hello ${toName},</p>
    <p>Please confirm your email using the link below:</p>
    <p><a href="${verificationLink}">Confirm Email</a></p>
  `;

  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
    tags: ["registration"],
  });
}

// ----------------------------------------------------
// Password Reset Email
// ----------------------------------------------------
export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  resetLink: string
) {
  const subject = "Reset Your Password";
  const htmlContent = `
    <p>Hello ${toName},</p>
    <p>Click below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
  `;

  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
    tags: ["password-reset"],
  });
}

// ----------------------------------------------------
// ⭐ OPTION 1 FIXED: TASK ASSIGNMENT EMAIL
// ----------------------------------------------------
export async function sendTaskAssignmentNotification(
  userId: string, // RECEIVES ONLY USER ID
  taskTitle: string,
  taskLink: string,
  assignerName: string
) {
  console.log("📌 Fetching recipient info for userId:", userId);

  // Fetch email + name from Supabase
  const { data: user, error } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("❌ Could not fetch user for task email:", error);
    return { success: false, message: "User email not found" };
  }

  const { email, full_name } = user;

  if (!email) {
    console.error("❌ User has no email stored:", userId);
    return { success: false, message: "Email missing" };
  }

  console.log("📩 Sending task assignment to:", email);

  const subject = `New Task Assigned: ${taskTitle}`;

  const htmlContent = `
    <p>Hello ${full_name || "User"},</p>
    <p>You have been assigned a new task by <strong>${assignerName}</strong>.</p>
    <p><strong>Task:</strong> ${taskTitle}</p>
    <p>View task: <a href="${taskLink}">Click here</a></p>
  `;

  return sendEmail({
    to: [{ email, name: full_name }],
    subject,
    htmlContent,
    tags: ["task-assignment"],
  });
}

// ----------------------------------------------------
// Admin Alert
// ----------------------------------------------------
export async function sendAdminAlert(
  toEmail: string,
  subject: string,
  alert: string
) {
  const htmlContent = `
    <p>Admin Alert:</p>
    <p>${alert}</p>
  `;

  return sendEmail({
    to: [{ email: toEmail, name: "Admin" }],
    subject,
    htmlContent,
    tags: ["admin-alert"],
  });
}

// ----------------------------------------------------
// Marketing Email
// ----------------------------------------------------
export async function sendMarketingEmail(
  toEmail: string,
  toName: string,
  campaignName: string,
  content: string
) {
  const subject = `Update: ${campaignName}`;

  const htmlContent = `
    <p>Hello ${toName},</p>
    ${content}
  `;

  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
    tags: ["marketing", campaignName],
  });
}
