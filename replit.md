# D.EF Portfolio

## Overview

This is an architectural portfolio website for Ethan Fryer (D.EF - Designs by Ethan Fryer), showcasing academic and professional architecture projects. The application is built as a full-stack web application with a React frontend and Express backend, designed to display project work through an interactive, visually-focused interface with expandable project cards, image carousels, and timeline views.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18+ with TypeScript for type safety
- Wouter for lightweight client-side routing (routes: Home `/`, About `/about`, Publications `/publications`, Studio `/studio`)
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

**Studio/Shop Integration:**
- `/studio` page implements a gallery-style shop interface
- 3-column layout: category sidebar, product grid, detail panel
- Integrated with Printful API for product data (`/api/shop/products`)
- Features staggered animations, hover effects, and crossfade transitions
- Mobile responsive with horizontal category pills and bottom sheet for product details
- SSR-safe media query hook for responsive behavior

**Missing/Incomplete Integrations:**
- API routes for CRUD operations on projects
- Database migration workflow (Drizzle Kit configured but not utilized)
- Form submissions for contact page
- Cart functionality for Studio page (Add to Cart button is placeholder)

## Password accounts and owner setup

Accounts use the existing Express session stack and PostgreSQL, with Node's salted
scrypt password hashes. No hosted identity provider, email verification, social
sign-in, or self-service recovery is configured. Visitors do not need accounts to
browse, inquire, read publications, or check out. Orders retain their separate
anonymous browser ownership token; signing in does not link orders to accounts.

### Configuration and non-destructive setup

- Configure `DATABASE_URL` and a randomly generated `SESSION_SECRET` of at least
  32 characters in workspace Secrets, and configure them separately for the
  production environment when appropriate. Never put their values in source.
  Keep the signing secret stable across restarts and instances.
- Run `npm run auth:setup` against the intended database before enabling accounts.
  This is additive/idempotent, uses a transaction and lock, audits only aggregate
  counts of recognized password hashes, and stops on case/whitespace-normalized
  username collisions rather than renaming or deleting users.
- Existing passwords are never assumed to be secure. Legacy values cannot sign
  in; use the trusted reset procedure below. Existing accounts default to visitor.
  No first-user owner or default password is created.
- Do not use a destructive schema reset or blindly accept `db:push` changes.
  The auth setup command preserves users, orders and content. Apply the same
  reviewed setup to the production database through your trusted operations
  process; development setup does not migrate production.
- HTTPS origins for the canonical website and Replit-provided domains are
  trusted explicitly. Additional website aliases go in `AUTH_TRUSTED_ORIGINS`
  as comma-separated exact origins; production permits HTTPS only. For local
  development, explicitly add the local HTTP origin. Arbitrary request Host
  or Origin headers do not grant trust.
- Cookies are HttpOnly, SameSite=Lax, and Secure in production (behind the
  existing one-hop trusted proxy). Sessions expire after seven days, are stored
  in PostgreSQL, rotate at sign-in/registration, and are destroyed on sign-out.
  Expired session and limiter records are cleaned periodically.
- Authentication fails closed with a non-sensitive 503 when configuration,
  tables or database access are unavailable; public browsing is not gated.
  Auth and account responses are no-store and noindex. Credentials/tokens are
  excluded from API logs.

### Provision an owner (trusted terminal only)

First register the intended account through `/register`. With trusted database
access, target that **explicit existing username**:

```sh
npm run auth:admin -- owner EXISTING_USERNAME
```

This grants owner permissions and invalidates all earlier sessions. Sign in
again through `/login`. Public registration cannot accept a role. Only the
owner can upload/delete publications; these requests need the session cookie,
a trusted Origin, and the `X-CSRF-Token` from `/api/auth/me`, even for multipart
uploads. Authorization runs before upload parsing. Attribution uses the
authenticated owner's account ID, never a supplied `uploadedBy`.
Attribution is saved in a separate `.publication-metadata/` App Storage object;
it is not part of the public publication catalog. If recording attribution
fails after the PDF is stored, upload reports that partial failure explicitly.

### Trusted password recovery (no public reset endpoint)

Verify the account holder's identity outside the application. From a trusted
Bash terminal, read the new password without echo or command-line history:

```sh
read -r -s -p 'New password: ' AUTH_PASSWORD; printf '\n'
printf '%s' "$AUTH_PASSWORD" | npm run auth:admin -- reset-password EXISTING_USERNAME
unset AUTH_PASSWORD
```

Use 12–128 characters. The command hashes the password, increments the account's
session version, and deletes existing sessions in one transaction. It neither
changes the role nor prints the password. Never put passwords in arguments,
chat, committed files, or shell history. Legacy usernames must meet the sign-in
policy (3–32 ASCII letters/numbers/underscore/hyphen); resolve exceptions manually
with verified account ownership rather than silently rewriting them.

### Verification

`npm run test:auth` uses the development database and removes its own temporary
accounts/sessions. It must never target the production database. The auth
browser test likewise creates temporary visitor accounts; it does not place
orders or mutate real publications. Use `npm run test:auth:browser` with
Playwright's Chromium available. Database failures must fail tests, not skip them.