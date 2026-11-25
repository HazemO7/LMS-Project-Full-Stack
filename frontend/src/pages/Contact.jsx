import React, { useState } from 'react';
import { EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import { AlertBanner } from '../components/ui/AlertBanner';

export const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormState({ name: '', email: '', message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F172A]">
            Get in touch
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#475569]">
            Questions about course access, instructor accounts, or deployment configuration? Send a note using the form.
          </p>

          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0F172A]">
              <EnvelopeSimple size={18} weight="duotone" aria-hidden="true" className="text-[#1D4ED8]" />
              Project support
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#475569]">
              For bug reports or setup questions, you can also open an issue on the project repository on GitHub.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:col-span-7">
          {submitted && (
            <AlertBanner
              variant="success"
              className="mb-6"
              onDismiss={() => setSubmitted(false)}
            >
              Your message has been recorded locally in this preview form. Connect a mail or ticket endpoint when deploying to production.
            </AlertBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-sm font-medium text-[#0F172A]"
                >
                  Full name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="Alex Rivera"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-sm font-medium text-[#0F172A]"
                >
                  Email address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                placeholder="Share what you need help with..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            >
              <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
