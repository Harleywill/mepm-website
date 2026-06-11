'use client';

import { useState } from 'react';
import { Button } from '../components/ui';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!data.get('consent')) {
      setError('Please confirm you are happy for us to store your details.');
      return;
    }

    setError('');
    // Phase 2: wire to a form handler / email service
    console.log('Enquiry:', Object.fromEntries(data.entries()));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-8">
        <h3 className="font-body font-semibold text-navy-700 mb-2">
          Thanks for getting in touch
        </h3>
        <p className="text-sm text-slate-600">
          We have your enquiry and will come back to you as soon as we can. If
          it is urgent, call us on 01482 838080.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full px-4 py-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-navy-300 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-navy-700 mb-1.5">
          Name
        </label>
        <input id="name" name="name" type="text" required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1.5">
          Email or phone
        </label>
        <input id="email" name="contact" type="text" required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-navy-700 mb-1.5">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={inputClasses}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          name="consent"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-green-600"
        />
        I consent to MEPM storing and processing my details so they can respond
        to my enquiry.
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" variant="secondary" size="md">
        Send enquiry
      </Button>
    </form>
  );
}
