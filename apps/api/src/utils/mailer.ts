import { ENV } from "../config/env.js";
import { logger } from "../lib/logger.js";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface MailSender {
  name: string;
  email: string;
}

/**
 * Derives the sender identity from SMTP_FROM ("Name <email>" or a bare
 * address), falling back to SMTP_USER. Returns null when nothing usable is
 * configured so callers can skip sending instead of throwing.
 */
function resolveSender(): MailSender | null {
  const raw = ENV.SMTP_FROM || ENV.SMTP_USER;
  if (!raw) return null;

  const named = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const email = (named?.[2] ?? raw).trim();
  const name = named?.[1]?.trim() || "FinTrack";
  return { name, email };
}

/**
 * Sends via Brevo's transactional HTTP API (port 443). Works on hosts that
 * block outbound SMTP ports (e.g. Render), which raw nodemailer cannot reach.
 */
async function sendViaBrevo(
  message: MailMessage,
  sender: MailSender,
): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": ENV.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Brevo API ${response.status}: ${body.slice(0, 300)}`);
  }
}

/**
 * Direct SMTP via nodemailer. Convenient for local development, but blocked on
 * many PaaS hosts. Timeouts keep a blocked port from hanging the request.
 */
async function sendViaSmtp(
  message: MailMessage,
  sender: MailSender,
): Promise<void> {
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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: ENV.SMTP_FROM || `${sender.name} <${sender.email}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

/**
 * Single entry point for outbound mail. Prefers the Brevo HTTP API when a key
 * is configured (the only thing that works on Render), otherwise falls back to
 * SMTP for local development. Silently skips when nothing is configured.
 */
async function sendMail(message: MailMessage): Promise<void> {
  const sender = resolveSender();

  if (ENV.BREVO_API_KEY) {
    if (!sender) {
      logger.warn(
        "BREVO_API_KEY set but no sender (SMTP_FROM/SMTP_USER) — skipping email send",
      );
      return;
    }
    await sendViaBrevo(message, sender);
    return;
  }

  if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS && sender) {
    await sendViaSmtp(message, sender);
    return;
  }

  logger.warn(
    "No email transport configured (BREVO_API_KEY or SMTP_*) — skipping email send",
  );
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  const base =
    ENV.EMAIL_VERIFICATION_BASE_URL || `http://localhost:${ENV.PORT}/api`;
  const verifyUrl = `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendMail({
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

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  // Link points at the frontend reset page, not the API.
  const base = (
    ENV.PASSWORD_RESET_BASE_URL || "http://localhost:5173/FinTrack"
  ).replace(/\/+$/, "");
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to,
    subject: "Reset your FinTrack password",
    text: `Hi ${name},\n\nWe received a request to reset your FinTrack password. Visit the link below to choose a new one:\n${resetUrl}\n\nThe link expires in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your FinTrack password. Click the button below to choose a new one:</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </p>
      <p style="color:#888;font-size:13px;">The link expires in 1 hour. If you didn't request a password reset, ignore this email and your password stays unchanged.</p>
    `,
  });
}
