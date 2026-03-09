import { motion } from "framer-motion";

const inquiryTypes = [
  "Commissions",
  "Collaborations",
  "Studio inquiries",
  "Press / features",
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-white px-6 pb-16 pt-28 text-black md:px-10 lg:px-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl"
      >
        <div className="grid gap-10 border border-black/10 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Contact</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Reach out if you want to build something thoughtful.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/68 md:text-lg">
              Ethan Fryer is developing a studio practice rooted in architecture, speculative thinking, graphics, and design objects.
              If the work resonates, this is the place for collaborations, commissions, opportunities, and conversations around where the studio can go next.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {inquiryTypes.map((item) => (
                <div key={item} className="border border-black/10 px-4 py-4 text-sm uppercase tracking-[0.2em] text-black/60">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-black/10 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Email</p>
              <a href="mailto:Epfryer@me.com" className="mt-3 inline-block text-2xl font-medium tracking-[-0.02em] hover:opacity-70">
                Epfryer@me.com
              </a>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Phone</p>
              <a href="tel:+18135050290" className="mt-3 inline-block text-xl font-medium hover:opacity-70">
                +1 (813) 505-0290
              </a>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Current framing</p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-black/68">
                Architecture graduate. Visual world-builder. Studio in progress.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Locations / context</p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-black/68">
                Work shaped between Florida, Virginia, and a broader architectural/editorial lens.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
