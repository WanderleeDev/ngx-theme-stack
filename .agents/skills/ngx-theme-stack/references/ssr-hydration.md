# SSR Hydration & Layout Stability

Wrap theme-dependent elements (like logos, theme status indicators, or custom switchers) in `@if (theme.isHydrated())` to prevent layout shift and SSR mismatches.

Fallback placeholders in the `@else` block should match the exact hydrated dimensions.

## Example: Hydrated Image with Placeholder

### Option A: Using Tailwind CSS Skeletons
If using Tailwind CSS, use utility classes like `animate-pulse` for the placeholder:

```html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" class="w-16 h-16" />
} @else {
  <!-- Tailwind Skeletons matching image dimensions -->
  <div class="w-16 h-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
}
```

### Option B: Using Pure CSS Skeletons (Inline styles or plain classes)
If using pure CSS, match dimensions using inline styles or CSS classes:

```html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" class="logo-dimensions" />
} @else {
  <!-- Pure CSS Skeleton matching image dimensions -->
  <div class="logo-skeleton"></div>
}
```

```css
/* Styling in styles.css */
.logo-dimensions {
  width: 64px;
  height: 64px;
}
.logo-skeleton {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  background-color: #e2e8f0;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
```
