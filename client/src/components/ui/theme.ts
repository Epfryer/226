import { type ThemeConfig } from "@/types/theme"

export const theme: ThemeConfig = {
  // General
  "--background": "0 0% 6%",
  "--foreground": "0 0% 96%",

  // Card
  "--card": "0 0% 10%",
  "--card-foreground": "0 0% 96%",

  // Popover
  "--popover": "0 0% 10%",
  "--popover-foreground": "0 0% 96%",

  // Primary
  "--primary": "350 25% 55%",
  "--primary-foreground": "0 0% 100%",

  // Secondary 
  "--secondary": "0 0% 15%",
  "--secondary-foreground": "0 0% 85%",

  // Muted
  "--muted": "0 0% 15%",
  "--muted-foreground": "0 0% 55%",

  // Accent
  "--accent": "170 40% 55%",
  "--accent-foreground": "0 0% 100%",

  // Destructive
  "--destructive": "0 62% 50%",
  "--destructive-foreground": "0 0% 100%",

  // Border, input and ring colors
  "--border": "0 0% 20%",
  "--input": "0 0% 20%",
  "--ring": "350 25% 55%",

  // Chart colors (Dusty Rose / Pale Teal / Mustard / Timber / Warm gray)
  "--chart-1": "350 25% 55%",
  "--chart-2": "170 40% 55%",
  "--chart-3": "45 80% 50%",
  "--chart-4": "30 50% 40%",
  "--chart-5": "0 0% 70%",

  // Sidebar theme (matching main theme)
  "--sidebar-background": "0 0% 6%",
  "--sidebar-foreground": "0 0% 96%",
  "--sidebar-primary": "350 25% 55%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-accent": "170 40% 55%",
  "--sidebar-accent-foreground": "0 0% 100%",
  "--sidebar-border": "0 0% 20%",
  "--sidebar-ring": "350 25% 55%",

  // Additional custom properties for BIG.dk styling
  "--big-transition": "all 0.3s ease-in-out",
  "--big-hover-opacity": "0.7",
  "--big-grid-gap": "2rem",
  "--big-header-height": "4rem",
  
  // Typography 
  "--big-font-heading": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "--big-font-body": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "--big-font-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",

  // Spacing
  "--big-spacing-unit": "0.25rem",
  "--big-spacing-horizontal": "1.5rem",
  "--big-spacing-vertical": "2rem",

  // Breakpoints (px)
  "--big-breakpoint-sm": "640",
  "--big-breakpoint-md": "768",
  "--big-breakpoint-lg": "1024",
  "--big-breakpoint-xl": "1280",
  "--big-breakpoint-2xl": "1536"
} as const;

// Export individual sections for targeted usage
export const colors = {
  background: `hsl(var(--background))`,
  foreground: `hsl(var(--foreground))`,
  primary: {
    DEFAULT: `hsl(var(--primary))`,
    foreground: `hsl(var(--primary-foreground))`,
  },
  secondary: {
    DEFAULT: `hsl(var(--secondary))`,
    foreground: `hsl(var(--secondary-foreground))`,
  },
  muted: {
    DEFAULT: `hsl(var(--muted))`,
    foreground: `hsl(var(--muted-foreground))`,
  },
  accent: {
    DEFAULT: `hsl(var(--accent))`,
    foreground: `hsl(var(--accent-foreground))`,
  },
} as const;

export const typography = {
  fontFamily: {
    heading: `var(--big-font-heading)`,
    body: `var(--big-font-body)`,
    mono: `var(--big-font-mono)`,
  },
} as const;

export const spacing = {
  unit: `var(--big-spacing-unit)`,
  horizontal: `var(--big-spacing-horizontal)`,
  vertical: `var(--big-spacing-vertical)`,
} as const;

export const breakpoints = {
  sm: `${theme["--big-breakpoint-sm"]}px`,
  md: `${theme["--big-breakpoint-md"]}px`,
  lg: `${theme["--big-breakpoint-lg"]}px`,
  xl: `${theme["--big-breakpoint-xl"]}px`,
  "2xl": `${theme["--big-breakpoint-2xl"]}px`,
} as const;

export const transitions = {
  default: `var(--big-transition)`,
  hover: {
    opacity: `var(--big-hover-opacity)`,
  },
} as const;

export const layout = {
  gridGap: `var(--big-grid-gap)`,
  headerHeight: `var(--big-header-height)`,
} as const;
