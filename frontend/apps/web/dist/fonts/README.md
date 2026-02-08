# Local Fonts Setup

This directory contains local font files for offline use. The application uses the **Inter** font family with system font fallbacks.

## Current Status

The application is configured to use local Inter fonts if they are available in this directory. If the fonts are not present, the application will automatically fall back to excellent system fonts that work offline:

- **macOS/iOS**: San Francisco (SF Pro)
- **Windows**: Segoe UI
- **Android**: Roboto
- **Linux**: System default sans-serif

## Optional: Adding Inter Fonts Locally

If you want to use Inter fonts offline, download the font files and place them in this directory:

### Required Font Files:
- `Inter-Light.woff2` (weight: 300)
- `Inter-Regular.woff2` (weight: 400)
- `Inter-Medium.woff2` (weight: 500)
- `Inter-SemiBold.woff2` (weight: 600)
- `Inter-Bold.woff2` (weight: 700)

### How to Download:

1. **From Google Fonts:**
   - Visit: https://fonts.google.com/specimen/Inter
   - Click "Download family"
   - Extract the files
   - Convert TTF files to WOFF2 format (recommended) or use WOFF format

2. **Using npm package:**
   ```bash
   npm install --save-dev @fontsource/inter
   ```
   Then copy the font files from `node_modules/@fontsource/inter/files/` to this directory.

3. **Using fonttools (Python):**
   ```bash
   pip install fonttools brotli
   # Convert TTF to WOFF2
   pyftsubset Inter-Regular.ttf --output-file=Inter-Regular.woff2 --flavor=woff2
   ```

### Font File Naming:
The CSS expects these exact filenames:
- `Inter-Light.woff2` or `Inter-Light.woff`
- `Inter-Regular.woff2` or `Inter-Regular.woff`
- `Inter-Medium.woff2` or `Inter-Medium.woff`
- `Inter-SemiBold.woff2` or `Inter-SemiBold.woff`
- `Inter-Bold.woff2` or `Inter-Bold.woff`

## Benefits of Local Fonts

- ✅ Works completely offline
- ✅ Faster page loads (no external requests)
- ✅ Consistent appearance across all devices
- ✅ Better privacy (no external font requests)

## Current Behavior

The application works perfectly offline **right now** using system fonts. Adding Inter fonts locally is optional and will provide a more consistent look across different operating systems.

