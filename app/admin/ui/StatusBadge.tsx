import {
  ENQUIRY_STATUS_LABELS,
  isEnquiryStatus,
  type EnquiryStatus,
} from '@/lib/enquiries';

const STYLES: Record<EnquiryStatus, string> = {
  new: 'bg-green-100 text-green-800 border-green-200',
  read: 'bg-slate-100 text-slate-600 border-slate-200',
  replied: 'bg-navy-50 text-navy-700 border-navy-200',
  archived: 'bg-slate-50 text-slate-400 border-slate-200',
};

export default function StatusBadge({ status }: { status: string }) {
  const key: EnquiryStatus = isEnquiryStatus(status) ? status : 'new';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] ${STYLES[key]}`}
    >
      {ENQUIRY_STATUS_LABELS[key]}
    </span>
  );
}
