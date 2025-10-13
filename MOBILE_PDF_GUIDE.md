# Mobile PDF Export Guide

This guide explains how to create mobile-optimized PDFs for better performance on iOS devices.

## Why Mobile PDF Variants?

iOS devices have stricter memory limits and can struggle with PDFs containing:
- Complex transparency and blend modes
- High-resolution images
- Multiple layers
- Large page counts (26+ pages)

## Creating a Mobile-Optimized PDF

### Using Adobe Acrobat Pro

1. Open your PDF in Adobe Acrobat Pro
2. Go to **File > Save As Other > Optimized PDF**
3. Configure settings:
   - **Color Images**: Downsample to 150 ppi
   - **Grayscale Images**: Downsample to 150 ppi
   - **Monochrome Images**: Downsample to 300 ppi
4. Under **Transparency**:
   - Check "Flatten Transparency"
   - Set to High Resolution (300 ppi)
5. Under **Color**:
   - Convert to sRGB color space
6. Save with suffix `_mobile_flat.pdf`

### Using Ghostscript (Command Line)

```bash
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output_mobile_flat.pdf \
   input.pdf
```

### Using Preview (macOS)

1. Open PDF in Preview
2. **File > Export as PDF**
3. Check "Reduce File Size"
4. Under **Quartz Filter**, select "Reduce File Size"
5. Save with suffix `_mobile_flat.pdf`

## Naming Convention

Mobile variants must follow this naming pattern:
- Original: `document.pdf`
- Mobile variant: `document_mobile_flat.pdf`

## Server Configuration

Enable automatic mobile PDF serving by setting environment variable:

```bash
ENABLE_MOBILE_PDF_VARIANT=true
```

When enabled:
- iOS devices automatically receive the `_mobile_flat.pdf` variant if it exists
- Desktop browsers receive the original PDF
- Can force mobile variant with `?mobile=1` query parameter

## Testing Mobile PDFs

1. Upload both versions to your storage
2. Test on iOS device or with `?mobile=1` flag
3. Verify in debug mode (`?debug=1`) that DPR is clamped to 2
4. Confirm no crashes when navigating to pages 26-28+

## Transparency Best Practices

For PDFs with transparency that will be viewed on mobile:

1. **Flatten all layers** before export
2. Use **sRGB color space** (not CMYK or Display P3)
3. Avoid **blend modes** like Multiply, Overlay, etc.
4. Keep **page count under 50** if possible
5. Optimize images to **150 dpi** for screen display

## Quality Comparison

| Setting | Original | Mobile Flat |
|---------|----------|-------------|
| File Size | Larger | Smaller |
| Transparency | Preserved | Flattened |
| Color Space | Any | sRGB |
| Max Pages | Unlimited | 50 recommended |
| iOS Compatibility | May crash | Optimized |
| Print Quality | High | Medium-High |

## Troubleshooting

### PDF still crashes on iOS

- Reduce page count to under 30
- Further reduce image resolution to 100 dpi
- Ensure all transparency is flattened
- Check file size is under 20MB

### Colors look different

- Ensure conversion to sRGB color space
- Some CMYK or P3 colors may shift slightly
- Compare side-by-side on desktop first

### Text is blurry

- Keep text as vector (don't rasterize)
- Use 150+ dpi for any rasterized content
- Test zoom levels in mobile browser

## Automation

For batch processing, create a script:

```bash
#!/bin/bash
for file in *.pdf; do
  if [[ ! $file =~ _mobile_flat\.pdf$ ]]; then
    output="${file%.pdf}_mobile_flat.pdf"
    gs -sDEVICE=pdfwrite \
       -dCompatibilityLevel=1.4 \
       -dPDFSETTINGS=/ebook \
       -dNOPAUSE -dQUIET -dBATCH \
       -sOutputFile="$output" \
       "$file"
    echo "Created: $output"
  fi
done
```

## Support

For issues with mobile PDF optimization:
1. Check debug overlay (`?debug=1`) for diagnostics
2. Verify file naming matches convention
3. Confirm environment variable is set
4. Test with both iOS Safari and Chrome
