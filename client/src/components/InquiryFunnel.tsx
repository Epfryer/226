import { useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

const inquiryTypes = [
  {
    label: "Commissions",
    question: "What are you looking to commission?",
    placeholder: "Tell me about the project, scope, location, and what you have in mind.",
  },
  {
    label: "Collaborations",
    question: "What would you like to collaborate on?",
    placeholder: "Share a little about the idea, team, and what a collaboration could look like.",
  },
  {
    label: "Studio inquiries",
    question: "What would you like to discuss?",
    placeholder: "Tell me what brought you here and what you would like to explore.",
  },
  {
    label: "Press / features",
    question: "What is the story or feature?",
    placeholder: "Include the outlet, subject, format, and any relevant deadlines.",
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

  function closeInquiry(open: boolean) {
    if (open) return;
    setActiveInquiry(null);
    setError("");
    setSubmitted(false);
  }

  return (
    <LayoutGroup>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {inquiryTypes.map((inquiry) => (
          <motion.button
            key={inquiry.label}
            type="button"
            layoutId={`inquiry-${inquiry.label}`}
            transition={transition}
            onClick={() => setActiveInquiry(inquiry)}
            className="min-h-16 border border-black/10 px-4 py-4 text-left text-sm uppercase tracking-[0.2em] text-black/60 transition-colors hover:border-black/40 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            {inquiry.label}
          </motion.button>
        ))}
      </div>

      <Dialog open={activeInquiry !== null} onOpenChange={closeInquiry}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto border-0 bg-transparent p-0 shadow-none">
          <AnimatePresence mode="wait">
            {activeInquiry && (
              <motion.div
                key={activeInquiry.label}
                layoutId={`inquiry-${activeInquiry.label}`}
                transition={transition}
                className="rounded-sm bg-white p-6 pr-12 text-black shadow-2xl sm:p-10 sm:pr-16"
              >
                {submitted ? (
                  <div className="py-8">
                    <p className="text-xs uppercase tracking-[0.3em] text-black/45">Inquiry received</p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Thank you for reaching out.</h2>
                    <p className="mt-4 text-base leading-relaxed text-black/65">
                      Your message was sent to the studio, and a copy was emailed to you.
                    </p>
                    <button
                      type="button"
                      onClick={() => closeInquiry(false)}
                      className="mt-8 border border-black px-5 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <DialogHeader className="text-left">
                      <p className="text-xs uppercase tracking-[0.3em] text-black/45">Studio inquiry</p>
                      <DialogTitle className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                        {activeInquiry.label}
                      </DialogTitle>
                      <DialogDescription className="mt-3 text-base leading-relaxed text-black/65">
                        Share a few details and your message will go directly to the studio.
                      </DialogDescription>
                    </DialogHeader>

                    <form className="mt-8 space-y-5" onSubmit={submitInquiry}>
                      <div className="grid gap-5 sm:grid-cols-2">
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
                        <textarea
                          name="details"
                          required
                          minLength={10}
                          maxLength={5000}
                          rows={5}
                          placeholder={activeInquiry.placeholder}
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
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </LayoutGroup>
  );
}
