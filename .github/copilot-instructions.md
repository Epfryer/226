# Copilot Instructions for D.EF Portfolio

## Architecture Overview

This is a full-stack TypeScript portfolio website for Ethan Fryer showcasing architecture projects. The application has two main components:

- **Frontend**: React 18 + Vite + shadcn/ui components in `client/`
- **Backend**: Express.js API server with PDF handling in `server/`

### Key Technologies

- **Frontend**: React + TypeScript, Wouter (routing), TanStack Query, Framer Motion, shadcn/ui + Tailwind CSS
- **Backend**: Express.js + TypeScript, Replit Object Storage for PDFs, Drizzle ORM + PostgreSQL
- **PDF Viewer**: Custom PDF.js implementation with iOS optimizations in `FlipbookViewer.tsx`

## Critical iOS PDF Viewer Architecture

The most complex part of this codebase is the PDF viewer with extensive iOS optimizations. Key files:

- `client/src/components/FlipbookViewer.tsx` - Main PDF renderer with iOS-specific optimizations
- `client/src/utils/viewport.ts` - iOS detection and DPR clamping utilities
- `server/pdf-routes.ts` - Handles Range requests and mobile PDF variants

### iOS Optimization Patterns

**DPR Clamping**: Device pixel ratio is clamped to ≤2 on iOS to prevent memory crashes
```typescript
const dpr = isIOSDevice() ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
```

**Page Virtualization**: Only renders current page ±1 on iOS (±2 on desktop) to manage memory
```typescript
const visibleRange = isIOSDevice() ? 1 : 2;
```

**Canvas Memory Management**: Aggressive cleanup of canvases outside visible range
```typescript
// Cancel render tasks and clear canvases for pages outside range
controller.abort();
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

**Navigation Debouncing**: 150ms debounce on iOS to prevent overlapping renders
```typescript
if (isIOSDevice()) {
  setTimeout(() => flipNext(), 150);
}
```

## Essential Development Workflows

### Local Development
```bash
npm run dev        # Starts Express server with Vite middleware
npm run db:push    # Push schema changes to database
npm run prepare    # Copy PDF.js files to client/public/pdfjs/
```

### PDF Management Scripts
```bash
npm run upload-pdf    # Upload PDFs to Replit Object Storage
npm run list-pdfs     # List all PDFs in storage
```

### Debug Mode
Add `?debug=1` to any URL to see debug overlay with:
- iOS detection status
- Current DPR and pixel budget
- Active canvas count
- Viewport dimensions

## Project-Specific Conventions

### File Organization
- **Client assets**: `client/public/` (including PDF.js files)
- **Server routes**: `server/` with separate concerns (routes.ts, pdf-routes.ts, storage.ts)
- **Database schema**: `db/schema.ts` (Drizzle ORM)
- **Component library**: `client/src/components/ui/` (shadcn/ui)

### API Route Patterns
All API routes use `/api/` prefix and are mounted before static file serving:
```typescript
app.use("/api/publications", pdfRoutes);  // Mount before static files
```

### Vite Configuration
Uses custom path aliases:
```typescript
"@": "client/src"
"@db": "db"
```

## Critical Integration Points

### PDF Serving with Range Support
`server/pdf-routes.ts` handles HTTP Range requests for PDF.js compatibility:
```typescript
// Supports partial content requests for large PDFs
res.setHeader('Accept-Ranges', 'bytes');
res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
```

### Mobile PDF Variants
Server automatically serves `_mobile_flat.pdf` variants to iOS devices when available:
```typescript
const isMobileRequest = /iPad|iPhone|iPod/i.test(userAgent);
// Serves optimized version with flattened transparency
```

### Database Schema
Simple schema with `users` and `projects` tables. Use Drizzle ORM patterns:
```typescript
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // ...
});
```

## Common Development Patterns

### State Management
- Use React Context (`ProjectProvider`) for UI state
- TanStack Query for server state with custom query client
- Local state for component-specific needs

### Styling Approach
- Tailwind CSS with custom theme from `theme.json`
- shadcn/ui components with "new-york" variant
- CSS custom properties for theming

### Error Handling
- Global error boundary in Express with structured JSON responses
- React error boundaries for component failures
- Comprehensive logging for PDF operations

## Performance Considerations

### PDF Memory Management
- Never render all pages simultaneously (causes iOS crashes around page 26-28)
- Use `AbortController` to cancel pending render tasks
- Implement proper canvas cleanup with `clearRect` and `page.cleanup()`

### Build Optimization
- Vite builds client to `dist/public/`
- Express server bundles to `dist/index.js`
- PDF.js files copied via `prepare` script

When working on this codebase, always consider iOS constraints first, especially for PDF-related features. The extensive iOS optimizations are critical for the application's stability on mobile devices.