# PDF Deployment Checklist

## Current Status
✅ PDF files exist in `client/public/publications/`
✅ PDFs are included in build output (`dist/public/publications/`)
✅ Production server configured correctly
❌ Published site returns 500 error for PDFs

## The Issue
Your published site at ethanfryer.com is returning 500 errors for the PDF files. The PDFs work locally but fail in production.

## Steps to Fix

### 1. Verify Build Includes PDFs
```bash
npm run build
ls -lh dist/public/publications/
```

You should see:
- hybrid-urbanism.pdf (~91MB)
- EthanFryer_5thYear_SelectedWorks.pdf (~84MB)

### 2. Check File Sizes
Your PDFs are quite large:
- hybrid-urbanism.pdf: 91MB
- EthanFryer_5thYear_SelectedWorks.pdf: 84MB

**Note:** Replit deployments have a size limit. If your total deployment size is too large, consider:
- Compressing the PDFs
- Hosting PDFs on a CDN (like Cloudinary, which you already use)
- Reducing PDF file sizes

### 3. Republish Your App
1. Click the "Publish" button in Replit
2. Wait for the full deployment to complete
3. Test the PDFs on your published site

### 4. Alternative: Use Cloudinary for PDFs
If deployment size is an issue, you can:
1. Upload PDFs to Cloudinary (you already have it configured)
2. Update `publications.ts` with Cloudinary URLs
3. This will make your deployment much smaller

## Testing
After republishing, test these URLs:
- https://ethanfryer.com/publications/hybrid-urbanism.pdf
- https://ethanfryer.com/publications/EthanFryer_5thYear_SelectedWorks.pdf

Both should return 200 (not 500) and download/display the PDF.
