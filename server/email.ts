import nodemailer from "nodemailer";
import { appOrigin, HttpError } from "./security";
import { database } from "./database";
export async function sendContinuation(
  reference: string,
  token: string,
  force = false,
) {
  const p = await database()
    .prepare(
      "SELECT email,email_sent_at,completed FROM payments WHERE reference=?",
    )
    .bind(reference)
    .first<{
      email: string;
      email_sent_at: string | null;
      completed: number;
    }>();
  if (!p || p.completed || (!force && p.email_sent_at)) return;
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD ||
    !process.env.SMTP_FROM
  ) {
    if (process.env.ALLOW_LIVE_PAYMENTS === "true")
      throw new HttpError("Email is not configured", 503);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 465),
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: p.email,
    subject: "Complete your FEDMOGA registration",
    text: `Your payment has been verified.\n\nComplete your registration using this private, single-use link:\n${appOrigin()}/?continue=${encodeURIComponent(token)}\n\nReference: ${reference}\nThe link expires after 30 days. Do not share it.\n\nFEDMOGA — Knowledge, Discipline and Unity`,
  });
  await database()
    .prepare("UPDATE payments SET email_sent_at=? WHERE reference=?")
    .bind(new Date().toISOString(), reference)
    .run();
}
