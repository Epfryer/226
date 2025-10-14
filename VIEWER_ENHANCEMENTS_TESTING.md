# PDF Viewer Enhancements - Testing Guide

## Overview
This guide helps you test all the new PDF viewer enhancements implemented in this PR.

## Prerequisites
- Publications must be available in the system (uploaded via object storage)
- Test on both desktop and mobile devices
- Test on Safari, Chrome, and Firefox browsers

## Feature Testing

### 1. Desktop Native Flipper ✅

**What Changed:**
- Restored click-to-flip functionality that was previously broken/removed
- Click left 40% of viewer → Previous page
- Click right 60% of viewer → Next page
- Only works when at fit scale (scale ≤ fit + 0.05)

**How to Test:**
1. Open any publication on desktop
2. Click on the LEFT side of the PDF viewer (left 40% of width)
   - **Expected**: Goes to previous page
3. Click on the RIGHT side of the PDF viewer (right 60% of width)
   - **Expected**: Goes to next page
4. Zoom in (using Ctrl/⌘ + scroll or zoom buttons)
5. Try clicking left/right again
   - **Expected**: Does NOT flip pages, cursor should pan the zoomed view instead
6. Zoom back to fit scale
7. Try clicking again
   - **Expected**: Should flip pages again

---

### 2. Glass Backdrop Effect ✅

**What Changed:**
- Replaced solid black background with glassmorphism effect
- Translucent dark layer with backdrop blur
- More modern, polished appearance

**How to Test:**
1. Open any publication
2. Observe the background behind the PDF viewer
   - **Expected**: Semi-transparent dark background with blur effect
   - The page content behind should be slightly visible but blurred

---

### 3. Double-Click/Tap Zoom Toggle ✅

**What Changed:**
- Added double-click (desktop) and double-tap (mobile) zoom functionality
- Toggles between fit scale and 2x zoom
- Zoom is centered in the viewport

**How to Test:**
1. Open any publication at fit scale
2. **Desktop**: Double-click anywhere on the PDF
   - **Expected**: Zooms to 2x, centered in viewport
3. Double-click again
   - **Expected**: Returns to fit scale
4. **Mobile**: Double-tap anywhere on the PDF
   - **Expected**: Same behavior as desktop

---

### 4. Mobile Landscape Mode Improvements ✅

**What Changed:**
- In landscape orientation, title bar is hidden
- Only a floating X (close) button is visible
- Button auto-hides after 2.2 seconds
- Button respects safe-area insets

**How to Test:**
1. Open any publication on mobile/tablet
2. **Portrait Mode**:
   - **Expected**: Full title bar at top with close button, title text, and download button
3. **Rotate to Landscape**:
   - **Expected**: Title bar disappears completely
   - **Expected**: Only a floating X button in top-right corner
4. Touch the screen or interact
   - **Expected**: X button becomes visible
5. Wait 2.2 seconds without interaction
   - **Expected**: X button fades out

---

### 5. Boundless Zoom/Pan ✅

**What Changed:**
- Content can now extend beyond screen edges when zoomed
- No artificial clamping to viewport
- More natural panning experience

**How to Test:**
1. Open any publication
2. Zoom in to 2x or higher
3. Pan the content in any direction
   - **Expected**: Content can move beyond screen edges
   - You should be able to see areas outside the initial viewport

---

### 6. Safari Touch Gesture Improvements ✅

**What Changed:**
- Added `touch-action: none` to viewer root
- Ensures Safari properly captures touch/pointer events
- Better pinch zoom and pan on iOS

**How to Test (iOS Safari):**
1. Open any publication on iPhone/iPad
2. Try pinch-to-zoom gesture
   - **Expected**: Smooth zoom that doesn't trigger Safari's native zoom
3. While zoomed, try panning with one finger
   - **Expected**: Smooth pan, no page scrolling
4. Double-tap to toggle zoom
   - **Expected**: Instant toggle between fit and 2x

---

## Summary

All features have been implemented according to the specification:
- ✅ Desktop native flipper (left 40% / right 60%)
- ✅ Glass backdrop with blur effect
- ✅ Double-click/tap zoom toggle (fit ↔ 2x)
- ✅ Landscape mode title hiding
- ✅ Boundless zoom/pan
- ✅ Safari touch gesture improvements
