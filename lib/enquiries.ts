export const ENQUIRY_STATUSES = ['new', 'read', 'replied', 'archived'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return (ENQUIRY_STATUSES as readonly string[]).includes(value);
}

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

export interface AdminAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface AdminEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
  attachments: AdminAttachment[];
}
