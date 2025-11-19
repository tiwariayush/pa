# Theme System Guide

## Overview

The app now supports customizable themes with multiple font and background options. Users can change their preferences in the Settings screen.

## Font Suggestions

Here are the recommended fonts that are already configured in the theme system:

### 1. **Space Grotesk** (Currently Active)
- **Style**: Geometric sans-serif, modern and technical
- **Best for**: Dashboard/data-heavy interfaces
- **Download**: [Google Fonts](https://fonts.google.com/specimen/Space+Grotesk)
- **Status**: ✅ Already added to project

### 2. **Inter**
- **Style**: Clean, highly legible sans-serif
- **Best for**: General UI, excellent readability
- **Download**: [Google Fonts](https://fonts.google.com/specimen/Inter)
- **Status**: ⚠️ Need to add font files

### 3. **DM Sans**
- **Style**: Versatile sans-serif, great for UI
- **Best for**: Modern apps, clean design
- **Download**: [Google Fonts](https://fonts.google.com/specimen/DM+Sans)
- **Status**: ⚠️ Need to add font files

### 4. **Manrope**
- **Style**: Open-source sans-serif, friendly and readable
- **Best for**: Friendly, approachable interfaces
- **Download**: [Google Fonts](https://fonts.google.com/specimen/Manrope)
- **Status**: ⚠️ Need to add font files

### 5. **Work Sans**
- **Style**: Designed for screens, excellent readability
- **Best for**: Professional, readable interfaces
- **Download**: [Google Fonts](https://fonts.google.com/specimen/Work+Sans)
- **Status**: ⚠️ Need to add font files

### 6. **Plus Jakarta Sans**
- **Style**: Modern sans-serif with geometric influences
- **Best for**: Contemporary, fresh look
- **Download**: [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Status**: ⚠️ Need to add font files

## Background Themes

### 1. **Light Chalk** (Default)
- Very light, neutral chalk color
- Color: `#FAFAF9`

### 2. **Warm Beige**
- Soft, warm paper-like background
- Color: `#F5F1E6`

### 3. **Cool Gray**
- Modern, cool-toned neutral
- Color: `#F8F9FA`

### 4. **Paper White**
- Pure white with subtle warmth
- Color: `#FEFEFE`

### 5. **Cream**
- Soft, warm cream tone
- Color: `#FFFEF7`

### 6. **Sage**
- Subtle green-gray, calming
- Color: `#F7F8F6`

## Adding New Fonts

To add a new font:

1. **Download font files** (TTF format) from Google Fonts or another source
   - You'll need: Regular, Light, Medium, SemiBold, Bold (or equivalent weights)

2. **Add font files** to `mobile/assets/fonts/`
   - Name them consistently (e.g., `Inter-Regular.ttf`, `Inter-Bold.ttf`)

3. **Update `App.tsx`** to load the fonts:
   ```typescript
   const [fontsLoaded] = useFonts({
     // Existing fonts...
     'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
     'Inter-Light': require('./assets/fonts/Inter-Light.ttf'),
     'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
     'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
     'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
   });
   ```

4. **Add font configuration** to `src/theme/themes.ts`:
   ```typescript
   'inter': {
     name: 'Inter',
     description: 'Clean, highly legible sans-serif',
     fontFamily: {
       regular: 'Inter-Regular',
       light: 'Inter-Light',
       medium: 'Inter-Medium',
       semibold: 'Inter-SemiBold',
       bold: 'Inter-Bold',
     },
   },
   ```

5. **Update `ThemeStore.tsx`** to include the new font in the `FontTheme` type if needed

## How It Works

1. **Theme Store** (`src/stores/ThemeStore.tsx`)
   - Manages theme selection
   - Persists preferences to AsyncStorage
   - Provides `currentTheme` with selected font and background

2. **Theme Definitions** (`src/theme/themes.ts`)
   - Defines all available fonts and backgrounds
   - Each theme includes colors and font family names

3. **Dynamic Theme Hook** (`src/theme/theme.ts`)
   - `useTheme()` hook returns current theme based on user selection
   - Components can use this hook to get dynamic colors and fonts

4. **Settings Screen** (`src/screens/settings/SettingsScreen.tsx`)
   - UI for selecting fonts and backgrounds
   - Shows previews and current selection

## Usage in Components

### Using Dynamic Theme

```typescript
import { useTheme } from '../theme/theme';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ fontFamily: theme.typography.fontFamily.regular }}>
        Hello
      </Text>
    </View>
  );
};
```

### Using Static Theme (for non-reactive components)

```typescript
import { theme, typography } from '../theme/theme';

// Use theme.colors, typography.fontFamily, etc.
```

## Notes

- **Font changes require app restart** - The app needs to reload to apply new fonts
- **Background changes apply immediately** - No restart needed
- **Current limitation**: Only Space Grotesk fonts are loaded. Add other fonts to `App.tsx` when ready to use them.

