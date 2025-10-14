# PDF Loading Fix - Testing Guide

## Quick Summary
Fixed the "white page on initial PDF load" issue by:
1. Adding canvas readiness checks to prevent race conditions
2. Implementing eager preloading of first 5 pages
3. Adding comprehensive logging for debugging

## How to Test

### 1. Deploy the Changes
```bash
# Build the project
npm run build

# Deploy to your staging/production environment
npm start
```

### 2. Open Browser DevTools
1. Open your browser (Chrome, Firefox, Safari, etc.)
2. Press F12 or right-click → "Inspect" to open DevTools
3. Go to the "Console" tab
4. Clear any existing logs

### 3. Open a PDF
1. Navigate to the Publications page (or wherever PDFs are displayed)
2. Click on a publication to open the PDF viewer
3. **Watch the console for the initialization sequence**

### 4. Verify the Fix Works

#### Expected Console Output
You should see this sequence within 1-2 seconds:

```
[PDF Load] PDF loaded successfully: 50 pages
[PDF Load] Detected aspect ratio: 1.33 (1920x1440)
[PDF Load] Container size detected: 1200x800
[PDF Dimensions] Calculated page size: 1020x765 (zoom: 1)
[PDF Flipbook] Flipbook initialized
[PDF Flipbook] Current state: { currentPage: 1, totalPages: 50, pageWidth: 1020, pageHeight: 765, canvasRefsCount: 0 }
[PDF Init] Checking canvas refs... found 5 canvases, current page 1 canvas: ✓
[PDF Init] Canvas refs are ready (including current page), triggering render
[PDF Render] Initial load optimization: extending range to first 5 pages
[PDF Render] Rendering pages 1-5 (current: 1)
[PDF Render] Starting render for page 1
[PDF Render] Completed render for page 1
[PDF Render] Starting render for page 2
[PDF Render] Completed render for page 2
[PDF Render] Starting render for page 3
[PDF Render] Completed render for page 3
[PDF Render] Starting render for page 4
[PDF Render] Completed render for page 4
[PDF Render] Starting render for page 5
[PDF Render] Completed render for page 5
```

#### Visual Verification
✅ **SUCCESS**: 
- PDF pages appear immediately
- No white/blank pages
- First 5 pages are visible and navigable
- Smooth page flipping

❌ **FAILURE**:
- White pages on initial load
- Long delay before pages appear
- Console shows "No canvas refs found yet" messages repeatedly
- Pages only appear after interaction

### 5. Test Navigation

#### Test First 5 Pages
1. Click the right arrow or swipe to go to page 2
2. Pages should flip instantly (already rendered)
3. Navigate to pages 3, 4, 5 - should all be instant

#### Test Later Pages
1. Navigate to page 6, 7, 8
2. Should render with minimal delay (on-demand)
3. Navigate back to pages 1-5
4. Should still be instant (cached)

### 6. Test Different Scenarios

#### Small PDF (< 10 pages)
- All pages within render range
- Should be very fast

#### Large PDF (50+ pages)
- First 5 pages render immediately
- Later pages render on-demand
- Memory usage should stay reasonable

#### Mobile Device
- Test on iOS Safari
- Test on Android Chrome
- Verify touch/swipe works smoothly
- Check that rotation works properly

### 7. Performance Testing

#### Memory Usage
1. Open DevTools → Performance Monitor
2. Watch "JS Heap Size" while navigating
3. Should stay under 100MB typically
4. Should not grow continuously

#### Timing
1. Use DevTools → Performance tab
2. Record while opening a PDF
3. Look for:
   - Document load time
   - Canvas creation time
   - First render time
4. Total initialization should be < 2 seconds

### 8. Debug Mode

For detailed debugging, add `?debug=1` to the URL:
```
https://your-site.com/publications?doc=thesis&debug=1
```

This shows an overlay with:
- Current page number
- DPR (device pixel ratio)
- Viewport size
- Canvas size
- Number of active canvases
- iOS detection status

## Common Issues and Solutions

### Issue: Canvas refs never become ready
**Symptoms**: Console shows repeated "No canvas refs found yet" messages

**Solution**: 
- Check that the flipbook is rendering (verify DOM elements exist)
- Ensure `pageWidth` and `pageHeight` are set
- Try increasing the polling interval in code

### Issue: Only some pages render
**Symptoms**: Some pages show "Page X" placeholder

**Solution**:
- Check visible range logic in console
- Verify pages are within render range (±2 from current)
- Check for errors in individual page renders

### Issue: Memory usage grows
**Symptoms**: Browser slows down after navigating many pages

**Solution**:
- Verify cleanup logic is running (check console for cleanup messages)
- Check that old canvases are being cleared
- Monitor active canvas count in debug mode

### Issue: iOS crashes on large PDFs
**Symptoms**: Browser crashes on iOS when navigating

**Solution**:
- Verify DPR is clamped to ≤2 on iOS
- Check pixel budget is not exceeded
- Consider using mobile PDF variant (see MOBILE_PDF_GUIDE.md)

## Reporting Issues

If you encounter problems, please provide:

1. **Console logs**: Copy the entire console output
2. **Browser info**: Chrome 120, Safari 17, etc.
3. **Device info**: Desktop, iPhone 14, etc.
4. **PDF info**: Number of pages, file size
5. **Steps to reproduce**: Exact steps that caused the issue

## Success Criteria

The fix is successful if:

✅ PDF pages appear immediately on load (no white page)
✅ First 5 pages navigate smoothly without delays
✅ Console shows clean initialization sequence
✅ Memory usage stays reasonable
✅ No crashes or errors in console
✅ Works on desktop and mobile devices

## Rollback Plan

If critical issues occur:

1. Revert the changes:
```bash
git revert HEAD~5..HEAD
git push
```

2. Or selectively disable features:
- Remove eager preloading (revert to ±2 range only)
- Remove canvas readiness check (revert to original timing)

## Next Steps After Testing

1. Monitor production logs for any issues
2. Gather user feedback on PDF loading experience
3. Consider additional optimizations if needed
4. Update documentation based on real-world usage
