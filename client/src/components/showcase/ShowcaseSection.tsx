import { ArrowUpRight, Box, Layers3, Sparkles } from "lucide-react";

interface ShowcaseItem {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  icon: typeof Box;
}

const showcaseItems: ShowcaseItem[] = [
  {
    eyebrow: "Spatial interface",
    title: "Orbit workspace",
    description: "A calm command center for navigating complex product systems.",
    accent: "from-fuchsia-500/30 via-violet-500/10 to-transparent",
    icon: Box,
  },
  {
    eyebrow: "Creative tooling",
    title: "Layer studio",
    description: "Shape ideas in three dimensions with a canvas that stays out of the way.",
    accent: "from-cyan-400/25 via-blue-500/10 to-transparent",
    icon: Layers3,
  },
  {
    eyebrow: "Signal / 03",
    title: "Pulse dashboard",
    description: "Turn live product signals into a focused view of what matters next.",
    accent: "from-amber-300/25 via-orange-500/10 to-transparent",
    icon: Sparkles,
  },
];

export function ShowcaseSection() {
  return (
    <section className="relative mt-32 overflow-hidden bg-zinc-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
              Beyond the screen
            </p>
            <h2 className="text-4xl font-medium tracking-tight text-zinc-100 md:text-6xl">
              Built to be explored.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-zinc-400">
            A glimpse at the spatial tools and expressive digital environments we make.
          </p>
        </div>

        <div
          className="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 md:-mx-10 md:px-10"
          aria-label="App showcase"
        >
          {showcaseItems.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group min-w-[82vw] snap-start overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 md:min-w-[430px] lg:min-w-[480px]"
              >
                <div className={`relative h-72 overflow-hidden bg-gradient-to-br ${item.accent}`}>
                  <div className="absolute inset-8 rounded-xl border border-white/15 bg-black/30 p-5 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-[1.03]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-white/80" aria-hidden="true" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{item.eyebrow}</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                    </div>
                    <div className="mt-8 grid grid-cols-[1.2fr_0.8fr] gap-3">
                      <div className="h-24 rounded-lg bg-white/10" />
                      <div className="space-y-3">
                        <div className="h-3 rounded-full bg-white/15" />
                        <div className="h-3 w-2/3 rounded-full bg-white/10" />
                        <div className="h-12 rounded-lg border border-white/10 bg-white/5" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-6 p-6">
                  <div>
                    <h3 className="text-xl font-medium text-zinc-100">{item.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
