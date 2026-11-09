import { useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const inquiryTypes = [
  {
    label: "Commissions",
    question: "Where is the project located?",
    placeholder: "City, region, or project site",
  },
  {
    label: "Collaborations",
    question: "What role or contribution do you have in mind?",
    placeholder: "For example: a joint project, research, writing, or visual work",
  },
  {
    label: "Studio inquiries",
    question: "What would you like to explore with the studio?",
    placeholder: "A project, opportunity, question, or other idea",
  },
  {
    label: "Press / features",
    question: "Which outlet is this for, and when is your deadline?",
    placeholder: "Publication or platform, format, and deadline",
  },
] as const;

type InquiryType = (typeof inquiryTypes)[number];

export function InquiryFunnel() {
  const [activeInquiry, setActiveInquiry] = useState<InquiryType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0.01 } : { type: "spring" as const, stiffness: 280, damping: 28 };

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeInquiry || isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeInquiry.label,
          name: formData.get("name"),
          email: formData.get("email"),
          organization: formData.get("organization"),
          details: formData.get("details"),
          specificAnswer: formData.get("specificAnswer"),
          website: formData.get("website"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your inquiry could not be sent. Please try again.");

      trackEvent("contact_clicked", { method: "inquiry_form", inquiry_type: activeInquiry.label });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your inquiry could not be sent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function chooseInquiry(inquiry: InquiryType | null) {
    setActiveInquiry(inquiry);
    setError("");
    setSubmitted(false);
  }

  return (
    <LayoutGroup>
      <motion.div layout className="mt-10">
        <AnimatePresence initial={false}>
          {activeInquiry ? (
            <motion.section
              key={activeInquiry.label}
              layoutId={`inquiry-${activeInquiry.label}`}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              transition={transition}
              className="border border-black/10 bg-white p-5 sm:p-7"
            >
              {submitted ? (
                <div aria-live="polite" className="py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/45">Inquiry received</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">Thank you for reaching out.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-black/65">
                    Your message was sent to the studio, and a copy was emailed to you.
                  </p>
                  <button
                    type="button"
                    onClick={() => chooseInquiry(null)}
                    className="mt-6 min-h-11 border border-black px-4 py-2 text-xs uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    Back to inquiry types
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-black/45">Studio inquiry</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{activeInquiry.label}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseInquiry(null)}
                      className="min-h-11 text-xs uppercase tracking-[0.16em] text-black/55 underline decoration-black/25 underline-offset-4 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      Change type
                    </button>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={submitInquiry}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs uppercase tracking-[0.16em] text-black/65">
                        Your name
                        <input
                          name="name"
                          autoComplete="name"
                          required
                          maxLength={100}
                          className="mt-2 min-h-12 w-full border border-black/20 bg-white px-3 text-base normal-case tracking-normal text-black outline-none transition-colors focus:border-black"
                        />
                      </label>
                      <label className="block text-xs uppercase tracking-[0.16em] text-black/65">
                        Email
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          className="mt-2 min-h-12 w-full border border-black/20 bg-white px-3 text-base normal-case tracking-normal text-black outline-none transition-colors focus:border-black"
                        />
                      </label>
                    </div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-black/65">
                      Organization <span className="normal-case tracking-normal">(optional)</span>
                      <input
                        name="organization"
                        autoComplete="organization"
                        maxLength={160}
                        className="mt-2 min-h-12 w-full border border-black/20 bg-white px-3 text-base normal-case tracking-normal text-black outline-none transition-colors focus:border-black"
                      />
                    </label>
                    <label className="block text-xs uppercase tracking-[0.16em] text-black/65">
                      {activeInquiry.question}
                      <input
                        name="specificAnswer"
                        required
                        maxLength={500}
                        placeholder={activeInquiry.placeholder}
                        className="mt-2 min-h-12 w-full border border-black/20 bg-white px-3 text-base normal-case tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-black"
                      />
                    </label>
                    <label className="block text-xs uppercase tracking-[0.16em] text-black/65">
                      Tell me a little more
                      <textarea
                        name="details"
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={4}
                        placeholder="Add any other details that would be helpful."
                        className="mt-2 w-full resize-y border border-black/20 bg-white px-3 py-3 text-base normal-case leading-relaxed tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-black"
                      />
                    </label>
                    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                      <label>
                        Leave this field blank
                        <input name="website" tabIndex={-1} autoComplete="off" />
                      </label>
                    </div>
                    <p className="text-xs leading-relaxed text-black/55">
                      Your email address will be CC’d on the message sent to the studio.
                    </p>
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-h-12 border border-black bg-black px-6 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Sending…" : "Send inquiry"}
                    </button>
                  </form>
                </>
              )}
            </motion.section>
          ) : (
            <motion.div key="inquiry-types" layout className="grid gap-3 sm:grid-cols-2">
              {inquiryTypes.map((inquiry) => (
                <motion.button
                  key={inquiry.label}
                  type="button"
                  layoutId={`inquiry-${inquiry.label}`}
                  transition={transition}
                  onClick={() => chooseInquiry(inquiry)}
                  className="min-h-16 border border-black/10 px-4 py-4 text-left text-sm uppercase tracking-[0.2em] text-black/60 transition-colors hover:border-black/40 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  {inquiry.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
