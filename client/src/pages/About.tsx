import { motion } from "framer-motion";
import { useEffect } from "react";
import { Timeline } from "@/components/Timeline";
import { trackEvent } from "@/lib/analytics";

const inquiryTypes = ["Commissions", "Collaborations", "Studio inquiries", "Press / features"];

export default function About() {
  useEffect(() => {
    if (window.location.hash === "#contact") {
      document.getElementById("contact")?.scrollIntoView();
    }
  }, []);

  const timelineData = [
    {
      title: "2025",
      content: (
        <div>
          <p className="mb-8 text-xs font-normal text-white md:text-sm">
            Thesis work, competition entries, and a growing studio direction focused on spatial ideas, graphics, and objects.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1760548950/Thesis_DEF_iqucdo.jpg"
              alt="The 78 thesis project"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1760565962/AIA_Bauthaus_bey1te.jpg"
              alt="AIA competition work"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2024",
      content: (
        <div>
          <p className="mb-8 text-xs font-normal text-white md:text-sm">
            Graduate B.Arch work at Virginia Tech shaped around architecture, narrative, visual systems, and speculative form.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1760545517/Chicago_Studio_vr1pa4.jpg"
              alt="Behind The Curtain project"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738289072/Circus_kaz4or.jpg"
              alt="Corporate Circus project"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <p className="mb-8 text-xs font-normal text-white md:text-sm">
            Competitions, studies, and academic projects that pushed form, rendering, geometry, and architectural storytelling.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738343812/Bike_Hub_uxsk4l.jpg"
              alt="Bike Hub project"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1738337829/Statue_Haus_nsmoxh.jpg"
              alt="Sculpture of Home project"
              className="h-32 w-full rounded-lg object-cover md:h-48 lg:h-60"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pb-16 pt-28 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-start"
        >
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] overflow-hidden border border-white/10 bg-zinc-900"
          >
            <img
              src="https://res.cloudinary.com/dtxqagii0/image/upload/v1740596263/Facetune_26-02-2025-12-56-48_adljiy.jpg"
              alt="Portrait of Ethan Fryer"
              className="h-full w-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-2xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">About</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Ethan Fryer builds architecture, images, and design worlds from the same underlying instinct.
            </h1>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-white/72 md:text-lg">
              <p>
                Architect at heart, Ethan approaches design as both spatial practice and visual authorship. His work moves between
                architecture, speculative studies, competitions, graphics, and objects — all connected by a desire to make ideas feel lived in.
              </p>
              <p>
                This site is not meant to be a static portfolio. It is a living body of work that is gradually becoming a studio: a place
                where projects act as proof, publications add depth, and the shop becomes a collection of artifacts translated from the same worldview.
              </p>
              <p>
                The through-line is clarity, atmosphere, and structure — work that feels considered, cinematic, and built from a strong internal logic.
              </p>
            </div>

            <div className="mt-10 grid gap-4 text-sm uppercase tracking-[0.2em] text-white/50 md:grid-cols-3">
              <div className="border border-white/10 p-4">
                <p>Architecture</p>
              </div>
              <div className="border border-white/10 p-4">
                <p>Editorial Thinking</p>
              </div>
              <div className="border border-white/10 p-4">
                <p>Studio in Progress</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <section id="contact" className="scroll-mt-24 bg-white px-6 py-16 text-black md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border border-black/10 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/45">Contact</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                Reach out if you want to build something thoughtful.
              </h2>
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
                <a href="mailto:Epfryer@me.com" onClick={() => trackEvent("contact_clicked", { method: "email" })} className="mt-3 inline-block text-2xl font-medium tracking-[-0.02em] hover:opacity-70">
                  Epfryer@me.com
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/45">Phone</p>
                <a href="tel:+18135050290" onClick={() => trackEvent("contact_clicked", { method: "phone" })} className="mt-3 inline-block text-xl font-medium hover:opacity-70">
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
        </div>
      </section>

      <Timeline data={timelineData} />
    </div>
  );
}
