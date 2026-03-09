import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/projects";

const featuredProjects = [
  projects.find((project) => project.id === "thesis"),
  projects.find((project) => project.id === "Behind The Curtain"),
  projects.find((project) => project.id === "AIA Comp"),
].filter(Boolean);

const studioPillars = [
  {
    title: "Practice",
    body: "Architecture, spatial thinking, and visual systems shaped with an editorial eye and a builder's discipline.",
  },
  {
    title: "Portfolio",
    body: "A living record of speculative, academic, and competition work that documents how ideas turn into form.",
  },
  {
    title: "Objects",
    body: "Prints, garments, and design artifacts that let the work move beyond the wall and into daily life.",
  },
];

const shopPreview = [
  {
    title: "Graphic Studies",
    description: "Print-led pieces translated from architectural language, diagrams, and speculative imagery.",
  },
  {
    title: "Garments",
    description: "Wearable design with a studio sensibility — not merch, but artifacts from the practice.",
  },
  {
    title: "Objects",
    description: "Functional pieces and small-format products that carry the world of the studio forward.",
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <section className="relative overflow-hidden border-b border-black/10 px-6 pb-16 pt-32 md:px-10 md:pb-24 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.08),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.05),transparent_35%)]"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
          <div className="space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs uppercase tracking-[0.3em] text-black/60"
            >
              Ethan Fryer · Architectural Editorial · Studio in Progress
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl space-y-6"
            >
              <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-7xl lg:text-[6.5rem]">
                Architecture as practice. Design as world-building.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-black/70 md:text-xl">
                Ethan Fryer is building a living portfolio that grows into a studio brand — a place for architectural work,
                speculative studies, and purchasable design objects shaped by the same point of view.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link href="/studio">
                <a className="inline-flex items-center justify-center gap-2 border border-black bg-black px-6 py-3 text-sm uppercase tracking-[0.2em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-black">
                  Enter the Studio
                  <ArrowRight size={16} />
                </a>
              </Link>
              <Link href="/publications">
                <a className="inline-flex items-center justify-center gap-2 border border-black/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-black transition duration-300 hover:-translate-y-0.5 hover:border-black">
                  View Publications
                  <ArrowUpRight size={16} />
                </a>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border border-black/10 bg-[#f4f1ea] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] md:p-8"
          >
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">Studio note</p>
              <p className="text-2xl font-medium leading-tight md:text-3xl">
                Architect at heart. Building a studio where work, writing, and objects can live in the same ecosystem.
              </p>
              <p className="text-sm leading-relaxed text-black/65">
                The goal is not a portfolio with a shop bolted on. It is a designed system: selected work as proof,
                the studio as practice, and the shop as a collection of artifacts emerging from the work.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="border-b border-black/10 px-6 py-16 md:px-10 md:py-20 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">Selected work</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Projects that set the tone.</h2>
            </div>
            <Link href="/projects">
              <a className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-black/70 transition hover:text-black">
                Browse the archive
                <ArrowRight size={15} />
              </a>
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {featuredProjects.map((project, index) => (
              <motion.article
                key={project!.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
              >
                <div className="aspect-[4/5] overflow-hidden bg-black/5">
                  <img
                    src={project!.image}
                    alt={project!.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-black/45">
                        {project!.year} · {project!.category}
                      </p>
                      <h3 className="mt-2 text-2xl font-medium tracking-[-0.02em]">{project!.title}</h3>
                    </div>
                    <span className="text-sm text-black/40">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-black/65">{project!.description}</p>
                  <p className="mt-auto text-sm uppercase tracking-[0.18em] text-black/55">{project!.location}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="border-b border-black/10 px-6 py-16 md:px-10 md:py-20 lg:px-16"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">The framework</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              A studio system built from practice, proof, and products.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {studioPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.08 * index }}
                className="border border-black/10 p-6 transition duration-300 hover:border-black/20 hover:bg-black/[0.02]"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-black/45">{pillar.title}</p>
                <p className="mt-4 text-base leading-relaxed text-black/70">{pillar.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="border-b border-black/10 bg-[#111111] px-6 py-16 text-white md:px-10 md:py-20 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Shop preview</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              The shop should feel like collected works, not random merch.
            </h2>
            <p className="text-base leading-relaxed text-white/65 md:text-lg">
              A curated set of garments, prints, and objects translated from the visual language of the studio.
              The first drop should be small, intentional, and architecturally sharp.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {shopPreview.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: 0.08 * index }}
                className="border border-white/10 p-6 transition duration-300 hover:border-white/20 hover:bg-white/[0.03]"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-white/45">{item.title}</p>
                <p className="mt-4 text-base leading-relaxed text-white/72">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/studio">
              <a className="inline-flex items-center gap-2 border border-white bg-white px-6 py-3 text-sm uppercase tracking-[0.2em] text-black transition duration-300 hover:-translate-y-0.5 hover:bg-transparent hover:text-white">
                Preview the studio shop
                <ArrowRight size={16} />
              </a>
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="px-6 py-16 md:px-10 md:py-20 lg:px-16"
      >
        <div className="mx-auto grid max-w-7xl gap-8 border border-black/10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Next</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Building the world in public.</h2>
            <p className="max-w-2xl text-base leading-relaxed text-black/70 md:text-lg">
              Explore selected work, read the research, step into the studio, or reach out about collaboration,
              commissions, and opportunities to build something meaningful.
            </p>
          </div>
          <div className="flex flex-col gap-4 self-end">
            <Link href="/about">
              <a className="inline-flex items-center justify-between border border-black/15 px-5 py-4 text-sm uppercase tracking-[0.2em] transition duration-300 hover:border-black hover:bg-black/[0.02]">
                About the practice
                <ArrowUpRight size={16} />
              </a>
            </Link>
            <Link href="/contact">
              <a className="inline-flex items-center justify-between border border-black/15 px-5 py-4 text-sm uppercase tracking-[0.2em] transition duration-300 hover:border-black hover:bg-black/[0.02]">
                Contact / collaborate
                <ArrowUpRight size={16} />
              </a>
            </Link>
            <Link href="/studio">
              <a className="inline-flex items-center justify-between border border-black/15 px-5 py-4 text-sm uppercase tracking-[0.2em] transition duration-300 hover:border-black hover:bg-black/[0.02]">
                Enter studio + shop
                <ArrowUpRight size={16} />
              </a>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
