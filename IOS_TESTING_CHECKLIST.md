# iOS PDF Viewer Testing Checklist

Use this checklist to verify all iOS PDF viewer fixes are working correctly.

## Prerequisites

- iOS device (iPhone or iPad) with Safari and Chrome
- Access to the deployed application
- PDF publication with 26+ pages for crash testing

## Test Scenarios

### 1. Basic Functionality

- [ ] **Load PDF on iOS Safari**
  - Open a publication
  - Verify PDF loads without errors
  - Check loading progress bar appears and completes

- [ ] **Load PDF on iOS Chrome**
  - Repeat above in Chrome for iOS
  - Verify consistent behavior

### 2. Aspect Ratio & Layout

- [ ] **Portrait Orientation**
  - Rotate device to portrait
  - Verify no vertical squishing
  - Check that text layer aligns with canvas
  - Ensure page fits properly in viewport

- [ ] **Landscape Orientation**
  - Rotate device to landscape
  - Verify page re-renders at correct size
  - No distortion or stretching

- [ ] **Address Bar Collapse**
  - Scroll down to hide Safari address bar
  - Verify PDF doesn't get compressed
  - Scroll up to show address bar
  - Check PDF maintains correct aspect ratio

### 3. Navigation & Memory

- [ ] **Page Flipping**
  - Navigate through pages 1-10
  - Use both swipe and button controls
  - Verify smooth transitions
  - No lag or stuttering

- [ ] **Late Pages (26-28+)**
  - Navigate to pages 24-32
  - Flip back and forth multiple times
  - **CRITICAL**: Verify no crashes or forced reloads
  - Check memory remains stable

- [ ] **Rapid Navigation**
  - Quickly tap "next" button 20+ times
  - Should navigate smoothly with 150ms debounce
  - No crashes or rendering errors
  - Verify only 3 canvases active (check debug mode)

### 4. Transparency & Visual Quality

- [ ] **Transparency Rendering**
  - View pages with semi-transparent elements
  - No darkening or "halo" artifacts
  - Colors look natural, not premultiplied

- [ ] **Zoom Levels**
  - Test zoom in (up to 3x)
  - Test zoom out (down to 0.5x)
  - Verify text remains sharp
  - No blur or transparency issues

- [ ] **Pinch to Zoom**
  - Use pinch gesture to zoom
  - Smooth scaling
  - Page re-renders at new zoom level

### 5. Debug Mode

- [ ] **Access Debug Overlay**
  - Add `?debug=1` to URL
  - Verify debug overlay appears top-left
  - Check displayed information:

- [ ] **Debug Values to Verify**
  ```
  iOS: Yes
  DPR: ≤ 2.0
  Active Canvases: ≤ 3
  Max Pixels: 8.0MP
  ```

### 6. Mobile PDF Variant (Optional)

If `ENABLE_MOBILE_PDF_VARIANT=true`:

- [ ] **Upload Mobile Variant**
  - Create `document_mobile_flat.pdf`
  - Upload alongside `document.pdf`

- [ ] **iOS Auto-Detection**
  - Access on iOS device
  - Verify mobile variant is served
  - Check server logs for confirmation

- [ ] **Manual Override**
  - Add `?mobile=1` to URL on desktop
  - Verify mobile variant loads
  - Remove flag, verify original loads

### 7. Performance

- [ ] **Memory Footprint**
  - Use debug mode to monitor active canvases
  - Navigate through entire document
  - Active canvases should never exceed 3
  - No memory warnings in console

- [ ] **Rendering Speed**
  - Page transitions complete in < 1 second
  - No blank pages during navigation
  - Text layer renders quickly

- [ ] **Low Memory Simulation**
  - Use iOS Safari Developer tools if available
  - Or test on older device (iPhone 8, iPad 6th gen)
  - Verify stable performance

### 8. Edge Cases

- [ ] **Rotation During Render**
  - Start loading a large PDF
  - Rotate device mid-load
  - Verify render completes correctly

- [ ] **Background/Foreground**
  - Navigate to page 10
  - Switch to another app
  - Return to PDF viewer
  - Verify page state preserved

- [ ] **Multiple Publications**
  - Open one publication
  - Close and open another
  - Verify proper cleanup
  - No memory leaks

## Issue Reporting

If you encounter issues, capture:

1. **Debug Overlay Screenshot** (`?debug=1`)
2. **iOS Version** (Settings > General > About)
3. **Device Model** (e.g., iPhone 14 Pro, iPad Air 5)
4. **Browser & Version** (Safari/Chrome version)
5. **Page Number** where issue occurs
6. **Steps to Reproduce**

## Expected Results Summary

✅ **Working Correctly:**
- No crashes on pages 26-28 or beyond
- Aspect ratio maintained during rotation
- Smooth navigation with debouncing
- Maximum 3 canvases in memory
- Text layer aligned with canvas
- No transparency artifacts
- DPR clamped to 2.0 on iOS

❌ **Not Working / Needs Fix:**
- (Document any failures here)

## Device Test Matrix

| Device | iOS Version | Safari | Chrome | Status |
|--------|-------------|--------|--------|--------|
| iPhone 15 Pro | 17.x | ⏳ | ⏳ | Pending |
| iPhone 14 | 17.x | ⏳ | ⏳ | Pending |
| iPhone 12 | 16.x | ⏳ | ⏳ | Pending |
| iPad Pro | 17.x | ⏳ | ⏳ | Pending |
| iPad Air | 16.x | ⏳ | ⏳ | Pending |

**Legend:** ✅ Pass | ❌ Fail | ⏳ Not Tested

## Notes

- Desktop browsers (macOS, Windows, Linux) should behave as before - no regressions
- All changes are iOS-specific or backwards compatible
- Debug mode (`?debug=1`) can be used on any device for diagnostics
