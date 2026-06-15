import nodemailer from 'nodemailer';

export interface EnquiryAlert {
  name: string;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  service?: string | null;
  message: string;
}

/**
 * Email a new-enquiry alert via SMTP. No-op (logs only) when SMTP_HOST is
 * unset. Never throws — callers treat email as best-effort so a mail outage
 * can't lose an enquiry.
 */
export async function sendEnquiryAlert(
  enquiry: EnquiryAlert,
  filenames: string[]
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const to = process.env.ENQUIRY_NOTIFY_TO;

  if (!host || !to) {
    console.log(
      `[email] SMTP not configured — skipping alert for ${enquiry.email}`
    );
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    const lines = [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      enquiry.phone ? `Phone: ${enquiry.phone}` : null,
      enquiry.organisation ? `Organisation: ${enquiry.organisation}` : null,
      enquiry.service ? `Service: ${enquiry.service}` : null,
      '',
      enquiry.message,
      '',
      filenames.length
        ? `Attachments: ${filenames.join(', ')}`
        : 'No attachments',
    ].filter((l): l is string => l !== null);

    await transport.sendMail({
      from: process.env.SMTP_USER || to,
      to,
      replyTo: enquiry.email,
      subject: `New enquiry — ${enquiry.name}`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send enquiry alert:', err);
  }
}
