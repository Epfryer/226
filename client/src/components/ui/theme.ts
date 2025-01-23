import { type ThemeConfig } from "@/types/theme"

export const theme: ThemeConfig = {
  // General
  "--background": "0 0% 100%",
  "--foreground": "0 0% 3.9%",

  // Card
  "--card": "0 0% 100%",
  "--card-foreground": "0 0% 3.9%",

  // Popover
  "--popover": "0 0% 100%",
  "--popover-foreground": "0 0% 3.9%",

  // Primary
  "--primary": "0 0% 0%",
  "--primary-foreground": "0 0% 98%",

  // Secondary 
  "--secondary": "0 0% 96.1%",
  "--secondary-foreground": "0 0% 9%",

  // Muted
  "--muted": "0 0% 96.1%",
  "--muted-foreground": "0 0% 45.1%",

  // Accent
  "--accent": "0 0% 96.1%",
  "--accent-foreground": "0 0% 9%",

  // Destructive
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "0 0% 98%",

  // Border, input and ring colors
  "--border": "0 0% 89.8%",
  "--input": "0 0% 89.8%",
  "--ring": "0 0% 3.9%",

  // Chart colors (monochromatic)
  "--chart-1": "0 0% 0%",
  "--chart-2": "0 0% 20%",
  "--chart-3": "0 0% 40%",
  "--chart-4": "0 0% 60%",
  "--chart-5": "0 0% 80%",

  // Sidebar theme (matching main theme)
  "--sidebar-background": "0 0% 100%",
  "--sidebar-foreground": "0 0% 3.9%",
  "--sidebar-primary": "0 0% 0%",
  "--sidebar-primary-foreground": "0 0% 98%",
  "--sidebar-accent": "0 0% 96.1%",
  "--sidebar-accent-foreground": "0 0% 9%",
  "--sidebar-border": "0 0% 89.8%",
  "--sidebar-ring": "0 0% 3.9%",

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
