'use client';

import { useState } from 'react';
import { ArrowRight, Check, Phone } from 'lucide-react';
import FileDropzone from './FileDropzone';

const SERVICES = [
  'Electrical',
  'Mechanical',
  'Environmental',
  'Full M&E',
  'Not sure yet',
];

const inputClasses =
  'w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300/60 focus:border-navy-300 transition-colors';

interface FormState {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState | 'consent', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    organisation: '',
    message: '',
  });
  const [service, setService] = useState('Full M&E');
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Please tell us your name.';
    if (!form.email.trim()) next.email = 'We need an email to reply to.';
    else if (!EMAIL_RE.test(form.email.trim()))
      next.email = 'That email address looks incomplete.';
    if (!form.message.trim())
      next.message = 'A line or two about the project helps us help you.';
    if (!consent)
      next.consent = 'Please confirm you are happy for us to store your details.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Focus the first field with an error
      const firstKey = Object.keys(found)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    setErrors({});
    setSubmitError('');
    setSending(true);

    const data = new FormData();
    data.append('name', form.name);
    data.append('email', form.email);
    data.append('phone', form.phone);
    data.append('organisation', form.organisation);
    data.append('message', form.message);
    data.append('service', service);
    files.forEach((file) => data.append('attachments', file));

    try {
      const res = await fetch('/api/enquiries', { method: 'POST', body: data });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setSubmitError(
          body.error ||
            'Something went wrong sending your enquiry. Please try again, or call us on 01482 838080.'
        );
        setSending(false);
      }
    } catch {
      setSubmitError(
        'We could not reach the server. Please check your connection and try again.'
      );
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <span className="mepm-spec">MEPM · Enquiry received`</span>
          <span className="font-mono text-xs font-semibold text-green-700">
            REF-{new Date().getFullYear()}
          </span>
        </div>
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check size={32} strokeWidth={2.5} />
          </span>
          <h2 className="mepm-h3 text-navy-700">Thanks, {form.name.split(' ')[0] || 'there'}</h2>
          <p className="mt-3 max-w-sm text-slate-600">
            Your enquiry is with us{files.length > 0 ? `, along with ${files.length} file${files.length > 1 ? 's' : ''}` : ''}.
            One of our engineers will be in touch as soon as possible to discuss your project.
            If it is urgent, call{' '}
            <a
              href="tel:+441482838080"
              className="font-medium text-navy-700 underline underline-offset-2 hover:text-green-600"
            >
              01482 838080
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => {
              setForm({ name: '', email: '', phone: '', organisation: '', message: '' });
              setService('Full M&E');
              setFiles([]);
              setConsent(false);
              setSubmitted(false);
            }}
            className="mt-7 inline-flex items-center gap-2 rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
        <span className="mepm-spec">MEPM · Project enquiry</span>
        <span className="font-mono text-xs font-semibold text-green-700">
          FORM
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-7" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="name"
            label="Full name"
            required
            error={errors.name}
            value={form.name}
            onChange={set('name')}
            placeholder="Jane Mitchell"
            autoComplete="name"
          />
          <Field
            id="email"
            label="Email"
            type="email"
            required
            error={errors.email}
            value={form.email}
            onChange={set('email')}
            placeholder="jane@firm.co.uk"
            autoComplete="email"
          />
          <Field
            id="phone"
            label="Phone"
            optional
            value={form.phone}
            onChange={set('phone')}
            placeholder="07000 000000"
            autoComplete="tel"
          />
          <Field
            id="organisation"
            label="Organisation"
            optional
            value={form.organisation}
            onChange={set('organisation')}
            placeholder="Mitchell Architects"
            autoComplete="organization"
          />
        </div>

        {/* Service picker */}
        <fieldset className="mt-5">
          <legend className="mb-2 block text-sm font-medium text-navy-700">
            Service needed
          </legend>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const on = service === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setService(s)}
                  aria-pressed={on}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    on
                      ? 'border-navy-700 bg-navy-700 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Message */}
        <div className="mt-5">
          <label
            htmlFor="message"
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            Project details <span className="text-danger">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={form.message}
            onChange={set('message')}
            placeholder="Tell us about the building, the scope and any timescales…"
            className={inputClasses}
            aria-invalid={!!errors.message}
          />
          {errors.message && (
            <p className="mt-1.5 text-sm text-danger">{errors.message}</p>
          )}
        </div>

        {/* Attachments */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-navy-700">
            Drawings or photos{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <FileDropzone files={files} onChange={setFiles} />
        </div>

        {/* Consent */}
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent)
                setErrors((prev) => ({ ...prev, consent: undefined }));
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-green-600"
          />
          <span>
            I consent to MEPM storing and processing my details so they can
            respond to my enquiry.
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1.5 text-sm text-danger">{errors.consent}</p>
        )}

        {submitError && (
          <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-green-500 px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-green-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {sending ? 'Sending…' : 'Send enquiry'}
            {!sending && <ArrowRight size={18} />}
          </button>
          <a
            href="tel:+441482838080"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-7 py-3.5 text-base font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            <Phone size={17} />
            Call us instead
          </a>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  optional,
  error,
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-700">
        {label}
        {required && <span className="text-danger"> *</span>}
        {optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={inputClasses}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
