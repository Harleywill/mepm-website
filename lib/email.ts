import { Resend } from 'resend';

export interface EnquiryAlert {
  name: string;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  service?: string | null;
  message: string;
}

/**
 * Email a new-enquiry alert via Resend. No-op (logs only) when
 * RESEND_API_KEY is unset. Never throws — email is best-effort so a mail
 * outage can't lose an enquiry.
 */
export async function sendEnquiryAlert(
  enquiry: EnquiryAlert,
  filenames: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_NOTIFY_TO;
  const from = process.env.ENQUIRY_FROM || 'MEPM Website <onboarding@resend.dev>';

  if (!apiKey || !to) {
    console.log(
      `[email] Resend not configured — skipping alert for ${enquiry.email}`
    );
    return;
  }

  const lines = [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : null,
    enquiry.organisation ? `Organisation: ${enquiry.organisation}` : null,
    enquiry.service ? `Service: ${enquiry.service}` : null,
    '',
    enquiry.message,
    '',
    filenames.length ? `Attachments: ${filenames.join(', ')}` : 'No attachments',
  ].filter((l): l is string => l !== null);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: enquiry.email,
      subject: `New enquiry — ${enquiry.name}`,
      text: lines.join('\n'),
    });
    if (error) console.error('[email] Resend rejected the message:', error);
  } catch (err) {
    console.error('[email] Failed to send enquiry alert:', err);
  }
}
