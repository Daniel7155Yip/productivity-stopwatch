# `Nav.tsx` Walkthrough

This file mirrors the logic in [`app/components/Nav.tsx`](/C:/Users/danie/productivity-stopwatch/app/components/Nav.tsx:1) and tags what each part is doing.

Use it side by side with the real file.

## Quick Key

- `Next.js`: framework-specific feature
- `React/JSX`: UI component or markup syntax
- `TypeScript`: types, variables, functions, logic
- `Tailwind`: utility classes inside `className`
- `CSS`: inline style object
- `SVG`: icon markup
- `Logic`: condition, comparison, loop, or event behavior

## The File, Tagged

### 1. Client directive

```tsx
"use client";
```

- Tag: `Next.js`
- Meaning: tells Next this file must run on the client/browser side.
- Why it matters: hooks like `usePathname()` need a client component.

### 2. Imports

```tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
```

- `Link`
  - Tag: `Next.js`
  - Meaning: special navigation component for moving between routes.
- `usePathname`
  - Tag: `Next.js`
  - Meaning: hook that tells the component the current URL path.
- `supabase`
  - Tag: `TypeScript import`
  - Meaning: imports the Supabase client.
  - Note: in the current `Nav.tsx`, this import is not being used.

### 3. Static data

```tsx
const links = [
  { href: "/stats", label: "Stats" },
  { href: "/history", label: "History" },
];
```

- Tag: `TypeScript` + `Logic`
- Meaning: an array of navigation items.
- Why it matters: instead of hardcoding each link separately, the component can loop over this array.

Plain-English version:

```text
Create a list of pages the nav should show.
Each page has a URL and a visible label.
```

### 4. `Nav` component signature

```tsx
export function Nav({ onLockIn }: { onLockIn?: () => void }) {
```

- Tag: `TypeScript` + `React`
- Meaning: defines a React component named `Nav`.
- `export`: makes it available to other files.
- `{ onLockIn }`: receives a prop.
- `: { onLockIn?: () => void }`
  - Tag: `TypeScript`
  - Meaning: the prop is optional and, if provided, must be a function.

Plain-English version:

```text
Create a component called Nav.
It may receive a function called onLockIn.
```

### 5. Read current route

```tsx
const pathname = usePathname();
```

- Tag: `Next.js` + `Logic`
- Meaning: ask Next which page the user is currently on.
- Example result: `"/"`, `"/stats"`, or `"/history"`.

### 6. Render the nav wrapper

```tsx
return (
  <nav className="flex items-center gap-4">
```

- Tag: `React/JSX`
- Meaning: begin rendering the `<nav>` element.
- `className="flex items-center gap-4"`
  - Tag: `Tailwind`
  - Meaning:
    - `flex` = use flexbox layout
    - `items-center` = vertically align items
    - `gap-4` = space between links

### 7. Loop through links

```tsx
{links.map(l => (
```

- Tag: `TypeScript/JavaScript` + `Logic` + `React`
- Meaning: loop through every item in the `links` array and render one UI element for each one.

Plain-English version:

```text
For each link in the list, create a navigation link on screen.
```

### 8. Render each link

```tsx
<Link
  key={l.href}
  href={l.href}
```

- Tag: `Next.js` + `React/JSX`
- `key={l.href}`
  - Tag: `React`
  - Meaning: gives React a stable identifier for each rendered item in the list.
- `href={l.href}`
  - Tag: `Next.js`
  - Meaning: sets the destination URL.

### 9. Conditional styling

```tsx
className={`text-xs transition-colors ${
  pathname === l.href
    ? "text-stone-700 font-semibold"
    : "text-stone-400 hover:text-stone-600"
}`}
```

- Tag: `Logic` + `Tailwind`
- Meaning: choose different styles depending on whether this link matches the current page.

Breakdown:

- `pathname === l.href`
  - Tag: `Logic`
  - Meaning: compare current URL with this link's URL.
- `? ... : ...`
  - Tag: `Logic`
  - Meaning: ternary operator, a compact `if/else`.
- Active link styles:
  - `text-stone-700 font-semibold`
- Inactive link styles:
  - `text-stone-400 hover:text-stone-600`

Plain-English version:

```text
If this link points to the current page, make it darker and bolder.
Otherwise, make it lighter and darken it on hover.
```

### 10. Visible link label

```tsx
>
  {l.label}
</Link>
```

- Tag: `React/JSX`
- Meaning: show the label text from the current link object.
- Example: `"Stats"` or `"History"`.

### 11. Close the component

```tsx
))}
</nav>
);
}
```

- Tag: `React/JSX`
- Meaning: finish the loop, close the `<nav>`, return the UI, and end the function.

## `LockInButton` Component

### 12. Component definition

```tsx
export function LockInButton({ onLockIn }: { onLockIn?: () => void }) {
```

- Tag: `React` + `TypeScript`
- Meaning: define another component that may receive an `onLockIn` function.

### 13. Current page and condition

```tsx
const pathname = usePathname();
const isHome = pathname === "/";
```

- Tag: `Next.js` + `Logic`
- Meaning:
  - get the current route
  - create a boolean called `isHome`

Plain-English version:

```text
Check whether the user is on the home page.
```

### 14. Shared style object

```tsx
const style = {
  backgroundColor: "#C4A484",
  color: "#fff",
};
```

- Tag: `TypeScript` + `CSS`
- Meaning: define an inline style object that can be reused.
- Why it matters: both the button and the link use the same colors.

### 15. Conditional rendering

```tsx
if (isHome) {
  return (
    <button
      onClick={onLockIn}
      style={style}
      className="text-xs px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
    >
      Lock In
    </button>
  );
}
```

- Tag: `Logic` + `React/JSX` + `Tailwind` + `CSS`
- Meaning: if the user is already on the home page, render a real button.
- `onClick={onLockIn}`
  - Tag: `Logic`
  - Meaning: when clicked, call the function passed in as a prop.
- `style={style}`
  - Tag: `CSS`
  - Meaning: apply the reusable inline styles.
- `className="..."`
  - Tag: `Tailwind`
  - Meaning: apply spacing, shape, font, and hover styles.

Plain-English version:

```text
If the user is on the home page, clicking should perform an action here,
so render a button.
```

### 16. Otherwise render a link

```tsx
return (
  <Link
    href="/"
    style={style}
    className="text-xs px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
  >
    Lock In
  </Link>
);
```

- Tag: `Next.js` + `React/JSX` + `Tailwind` + `CSS`
- Meaning: if the user is not on the home page, render a link that takes them there.

Plain-English version:

```text
If the user is somewhere else, clicking should navigate home,
so render a link instead of a button.
```

## `SettingsGear` Component

### 17. Component and route check

```tsx
export function SettingsGear() {
  const pathname = usePathname();
```

- Tag: `React` + `Next.js`
- Meaning: define the settings icon component and read the current path.
- Note: in the current file, `pathname` is not used after this.

### 18. Settings link

```tsx
return (
  <Link
    href="/settings"
    title="Settings"
    className="fixed top-5 right-6 transition-opacity hover:opacity-70"
    style={{ color: "rgba(120, 113, 108, 0.6)" }}
  >
```

- Tag: `Next.js` + `React/JSX` + `Tailwind` + `CSS`
- Meaning: render a link to the settings page and position it at the top-right of the screen.

### 19. SVG icon

```tsx
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="26"
  height="26"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.5"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <circle cx="12" cy="12" r="3"/>
  <path d="..." />
</svg>
```

- Tag: `SVG`
- Meaning: draw the gear icon.
- `circle` draws the center circle.
- `path` draws the gear shape.

## How To Read Files Like This

When you open a front-end file, read it in this order:

1. Imports: what tools does this file rely on?
2. Data/constants: what static values exist?
3. Component signature: what props come in?
4. Derived values: what gets calculated each render?
5. Conditions: what `if`, ternary, or comparisons control behavior?
6. Render output: what gets shown on screen?
7. Styling: which parts are appearance only?

## The Core Logic In Plain English

`Nav`

- ask which page the user is on
- loop through nav items
- render one link per item
- highlight the active one

`LockInButton`

- ask which page the user is on
- if home, show a clickable button
- otherwise, show a link back home

`SettingsGear`

- render a fixed-position link to settings
- display it as an inline SVG gear icon

## One Important Distinction

You do not need to memorize "which language" for every symbol before you can read the file.

The better question is:

```text
What job is this line doing?
```

Examples:

- import line -> bringing in a tool
- `const ...` -> storing data
- `usePathname()` -> reading current route
- `map(...)` -> looping
- `if (...)` -> conditional logic
- `<Link>` -> rendering UI
- `className="..."` -> styling
- `<svg>` -> drawing an icon
