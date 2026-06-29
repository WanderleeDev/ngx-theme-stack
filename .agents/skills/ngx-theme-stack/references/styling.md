# Styling: CSS Variables, Tailwind, and Pure CSS

Define CSS variables in `src/themes.css`. You can use them with either Tailwind CSS or Pure CSS.

## 1. Define CSS Variables (src/themes.css)

For `mode: 'class'` (default) use CSS class selectors:

```css
/* src/themes.css — class mode */
:root,
.light {
  --background: #fff;
  --foreground: #1a1a1a;
}
.dark {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
}
.sunset {
  --background: #ff5f6d;
  --foreground: #fff;
}
```

For `mode: 'attribute'` use `data-theme` attribute selectors instead:

```css
/* src/themes.css — attribute mode */
:root,
[data-theme="light"] {
  --background: #fff;
  --foreground: #1a1a1a;
}
[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
}
[data-theme="sunset"] {
  --background: #ff5f6d;
  --foreground: #fff;
}
```

## 2. Choose Styling Integration (src/styles.css)

Before choosing, check if Tailwind is installed in `package.json`.

### Option A: Using Pure CSS (No Tailwind)
If Tailwind is not used or installed in the project, apply the variables directly to your elements:

```css
/* src/styles.css */
body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### Option B: Using Tailwind CSS v4
If Tailwind is installed, map the variables inside the `@theme` directive (use semantic classes, not `dark:`):

```css
/* src/styles.css */
@import 'tailwindcss';
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```
