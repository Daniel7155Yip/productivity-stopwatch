# TypeScript vs React vs JSX vs Next.js

Use this as a quick reference while reading the app.

| Term | What It Is | What It Does | Example In This App |
| --- | --- | --- | --- |
| TypeScript | A programming language | Handles variables, functions, conditions, arrays, objects, and types | `const pathname = usePathname();` or `({ onLockIn }: { onLockIn?: () => void })` |
| React | A UI library | Lets you build the interface out of components and render/update them | `export function Nav() { ... }` |
| JSX | A syntax extension used inside TypeScript/JavaScript | Lets you write UI in an HTML-like form inside code | `<nav>...</nav>`, `<Link href="/stats">Stats</Link>` |
| Next.js | A React framework | Handles routing, app structure, client/server behavior, navigation, and build/runtime tooling | `"use client"`, `Link` from `next/link`, `usePathname` from `next/navigation` |

## Short Version

- `TypeScript` = the language
- `React` = the UI library
- `JSX` = the readable UI syntax
- `Next.js` = the framework around React

## One Combined Example

```tsx
"use client";

import Link from "next/link";

export function Example() {
  const label: string = "Stats";

  return <Link href="/stats">{label}</Link>;
}
```

What each part is:

- `"use client";`
  - `Next.js`
- `import Link from "next/link";`
  - `Next.js`
- `export function Example() {`
  - `TypeScript/JavaScript` function
  - used by `React` as a component
- `const label: string = "Stats";`
  - `TypeScript`
- `return <Link href="/stats">{label}</Link>;`
  - `JSX`
  - rendered through `React`
  - using a `Next.js` component

## Mental Model

When reading a `.tsx` file, think:

1. `TypeScript` writes the logic.
2. `React` treats functions as UI components.
3. `JSX` describes what those components should show.
4. `Next.js` provides framework features around the app.
