# Fonts Download List

## Required Font Files for Each Font Family

For each font, you need to download these weights:
- **Regular** (400)
- **Light** (300) - if available
- **Medium** (500)
- **SemiBold** (600)
- **Bold** (700)

---

## 1. Space Grotesk ✅ (Already Added)

**Status**: Already in your project

**Files you have**:
- SpaceGrotesk-Regular.ttf
- SpaceGrotesk-Light.ttf
- SpaceGrotesk-Medium.ttf
- SpaceGrotesk-SemiBold.ttf
- SpaceGrotesk-Bold.ttf

**Download**: [Google Fonts - Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)

---

## 2. Inter

**Download Link**: https://fonts.google.com/specimen/Inter

**Direct Download**: 
- Go to: https://fonts.google.com/specimen/Inter
- Click "Download family" button
- Or download individual weights:
  - [Inter Regular](https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf)
  - [Inter Light](https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Light.ttf)
  - [Inter Medium](https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.ttf)
  - [Inter SemiBold](https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf)
  - [Inter Bold](https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf)

**Files needed**:
- `Inter-Regular.ttf`
- `Inter-Light.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

---

## 3. DM Sans

**Download Link**: https://fonts.google.com/specimen/DM+Sans

**Direct Download**:
- Go to: https://fonts.google.com/specimen/DM+Sans
- Click "Download family" button
- Or use: https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans-Regular.ttf (and other weights)

**Files needed**:
- `DMSans-Regular.ttf`
- `DMSans-Light.ttf`
- `DMSans-Medium.ttf`
- `DMSans-SemiBold.ttf`
- `DMSans-Bold.ttf`

**Note**: DM Sans might not have a Light weight. Use Regular as fallback.

---

## 4. Manrope

**Download Link**: https://fonts.google.com/specimen/Manrope

**Direct Download**:
- Go to: https://fonts.google.com/specimen/Manrope
- Click "Download family" button
- Or use: https://github.com/google/fonts/raw/main/ofl/manrope/Manrope-Regular.ttf (and other weights)

**Files needed**:
- `Manrope-Regular.ttf`
- `Manrope-Light.ttf`
- `Manrope-Medium.ttf`
- `Manrope-SemiBold.ttf`
- `Manrope-Bold.ttf`

---

## 5. Work Sans

**Download Link**: https://fonts.google.com/specimen/Work+Sans

**Direct Download**:
- Go to: https://fonts.google.com/specimen/Work+Sans
- Click "Download family" button
- Or use: https://github.com/google/fonts/raw/main/ofl/worksans/WorkSans-Regular.ttf (and other weights)

**Files needed**:
- `WorkSans-Regular.ttf`
- `WorkSans-Light.ttf`
- `WorkSans-Medium.ttf`
- `WorkSans-SemiBold.ttf`
- `WorkSans-Bold.ttf`

---

## 6. Plus Jakarta Sans

**Download Link**: https://fonts.google.com/specimen/Plus+Jakarta+Sans

**Direct Download**:
- Go to: https://fonts.google.com/specimen/Plus+Jakarta+Sans
- Click "Download family" button
- Or use: https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans-Regular.ttf (and other weights)

**Files needed**:
- `PlusJakartaSans-Regular.ttf`
- `PlusJakartaSans-Light.ttf`
- `PlusJakartaSans-Medium.ttf`
- `PlusJakartaSans-SemiBold.ttf`
- `PlusJakartaSans-Bold.ttf`

---

## Quick Download Guide

### Option 1: Google Fonts Website (Easiest)

1. Visit each font's Google Fonts page (links above)
2. Click the **"Download family"** button (top right)
3. Extract the ZIP file
4. Copy the `.ttf` files to `mobile/assets/fonts/`
5. Rename files to match the expected names (see "Files needed" above)

### Option 2: Direct GitHub Links

Some fonts are available directly from GitHub:
- **Inter**: https://github.com/rsms/inter/releases
- **Others**: Check Google Fonts GitHub: https://github.com/google/fonts

### Option 3: Using Google Fonts Helper

1. Visit: https://google-webfonts-helper.herokuapp.com/
2. Search for each font
3. Select weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
4. Download and extract

---

## File Naming Convention

Make sure files are named exactly as shown in "Files needed" above. The app expects these exact names.

**Example for Inter**:
- ✅ `Inter-Regular.ttf`
- ✅ `Inter-Bold.ttf`
- ❌ `inter-regular.ttf` (wrong case)
- ❌ `InterRegular.ttf` (missing hyphen)

---

## After Downloading

1. Place all `.ttf` files in: `mobile/assets/fonts/`
2. Update `App.tsx` to load the fonts (see `THEME_GUIDE.md`)
3. Restart the app
4. Select the font in Settings screen

---

## Recommended Order to Add

If you want to add fonts gradually, I recommend this order:

1. ✅ **Space Grotesk** - Already done
2. **Inter** - Most versatile, excellent readability
3. **DM Sans** - Great for UI, modern look
4. **Manrope** - Friendly, good for general use
5. **Work Sans** - Professional, screen-optimized
6. **Plus Jakarta Sans** - Modern, geometric

---

## Notes

- **Light weight**: Some fonts might not have a Light (300) weight. If missing, the app will fall back to Regular.
- **File size**: Each font family is typically 200-500KB total
- **Format**: Use `.ttf` (TrueType Font) format, not `.otf` or `.woff`

