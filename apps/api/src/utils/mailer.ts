import { ENV } from "../config/env.js";

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.warn(
      "[mailer] SMTP not configured — skipping verification email send",
    );
    return;
  }

  const base =
    ENV.EMAIL_VERIFICATION_BASE_URL || `http://localhost:${ENV.PORT}/api`;
  const verifyUrl = `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const from = ENV.SMTP_FROM || `FinTrack <${ENV.SMTP_USER}>`;

  // Lazy-load nodemailer (CJS) only when actually needed,
  // so Jest ESM tests don't load it at module init time.
  const { createRequire } = await import("node:module");
  const requireFn = createRequire(import.meta.url);
  const nodemailer = requireFn("nodemailer") as typeof import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from,
    to,
    subject: "Verify your FinTrack email",
    text: `Hi ${name},\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nThe link expires in 24 hours.\n\nIf you didn't register, you can safely ignore this email.`,
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Click the button below to verify your email address:</p>
      <p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
      </p>
      <p style="color:#888;font-size:13px;">The link expires in 24 hours. If you didn't register on FinTrack, ignore this email.</p>
    `,
  });
}
