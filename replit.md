# D.EF Portfolio

## Overview

This is an architectural portfolio website for Ethan Fryer (D.EF - Designs by Ethan Fryer), showcasing academic and professional architecture projects. The application is built as a full-stack web application with a React frontend and Express backend, designed to display project work through an interactive, visually-focused interface with expandable project cards, image carousels, and timeline views.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18+ with TypeScript for type safety
- Wouter for lightweight client-side routing (routes: Home `/`, About `/about`, Contact `/contact`)
- Vite as the build tool and development server

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom theme configuration
- "new-york" style variant with neutral base color and minimal border radius
- Custom CSS variables for theming stored in `theme.json`

**State Management:**
- React Context API (`ProjectContext`) for global UI state management
- Manages project expansion state and header visibility
- TanStack Query (React Query) for server state management
- Custom query client with credentials-based fetching

**Animation & Interactions:**
- Framer Motion for complex animations and transitions
- Swiper.js for project image carousels with custom controls
- Custom typing animation component for header text
- Scroll-based animations for timeline component

**Key Design Patterns:**
- Component composition with shadcn/ui patterns
- Custom hooks (`use-mobile`, `use-toast`) for reusable logic
- Layout animations with AnimatePresence for route transitions
- Responsive design with mobile-first approach

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Node.js runtime with ES modules
- HTTP server creation via `createServer`
- **Reverse proxy configuration:** `app.set('trust proxy', 1)` enables proxy header trust for Cloud Run deployments

**Development Environment:**
- Vite middleware integration for HMR in development
- Custom logging middleware for API request tracking
- Error handling middleware with status code normalization
- Production build serves static assets from `dist/public`

**API Structure:**
- RESTful API prefix convention (`/api/*`)
- Routes registered through `registerRoutes` function
- `/api/publications/:filename` - Streams PDF files from App Storage

### Data Storage

**Database:**
- PostgreSQL database with Neon serverless driver
- WebSocket support for real-time capabilities
- Connection via `DATABASE_URL` environment variable

**ORM & Schema:**
- Drizzle ORM for type-safe database queries
- Schema definition in `db/schema.ts` with two main tables:
  - `users`: Authentication (id, username, password)
  - `projects`: Portfolio items (id, title, description, category, year, location, timestamps)
- Drizzle-Zod integration for runtime validation
- TypeScript inference for insert/select types
- Migration files stored in `./migrations` directory

**Current Implementation:**
- Projects are currently stored in static TypeScript file (`client/src/lib/projects.ts`)
- Database schema exists but not yet integrated with UI
- Ready for migration from static to database-driven content

### External Dependencies

**Media Management:**
- Cloudinary for image hosting and CDN delivery
- Configuration includes cloud name, API key, and API secret
- Helper functions for upload and delete operations in `client/src/lib/cloudinary.ts`
- All project images served via Cloudinary URLs

**File Storage:**
- Replit App Storage (formerly Object Storage) for hosting large PDF files
- Bucket ID: `replit-objstore-a538e3dd-048a-46be-b441-abad6fd99c02` (configured in `.replit`)
- `@replit/object-storage` SDK for programmatic access
- Publications PDFs (84MB and 91MB) stored in `publications/` folder in bucket
- Served via API endpoint `/api/publications/:filename` with HTTP range support (206 responses)

**PDF Viewing System:**
- PDF.js for rendering large PDF files (80-90MB)
- React-PageFlip for interactive flipbook experience
- Hybrid streaming: full file streaming for desktop, range requests with caching for mobile
- **Critical configuration:** PDF.js configured WITHOUT `withCredentials: true` to prevent CORS errors on late range requests
- Mobile optimizations: pinch-to-zoom, rotation toast, zoom controls (0.5×-3×)
- Session storage for page position persistence across navigation
- Manual retry mechanism (auto-retry removed to prevent crash loops)

**UI Component Libraries:**
- Radix UI for accessible, unstyled component primitives
- Heroicons for SVG icon set
- Lucide React for additional icons
- cmdk for command palette functionality

**Form & Validation:**
- React Hook Form for form state management
- Hookform Resolvers for validation schema integration
- Zod (via drizzle-zod) for schema validation

**Utility Libraries:**
- clsx and tailwind-merge for conditional className composition
- date-fns for date manipulation
- class-variance-authority for variant-based styling
- nanoid for unique ID generation

**Development Tools:**
- tsx for TypeScript execution in development
- esbuild for production server bundling
- Replit-specific Vite plugins for theme and error handling

**Missing/Incomplete Integrations:**
- Authentication system (schema exists but no implementation)
- API routes for CRUD operations on projects
- Database migration workflow (Drizzle Kit configured but not utilized)
- Form submissions for contact page