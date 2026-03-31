# React / Next.js Implementation Rules

## File Structure
```
src/
  components/<ComponentName>/
    index.tsx
    <componentName>.module.css
  layout/Dashboard/<Feature>/
    components/   ← leaf components
    containers/   ← data-connected wrappers
    views/        ← full-page views
    <feature>.module.css
  assets/         ← all icons/images (exported from Figma)
```

## Code Standards

### Every client component must start with:
```tsx
"use client";
```

### TypeScript — strict, no exceptions
- No `any` — use proper types or `unknown`
- Explicit return types on all functions: `(): React.JSX.Element`
- Typed Redux payloads — no implicit `any` in slices
- Props interfaces defined above the component

### Styling — CSS Modules only
```tsx
// ✅ correct
import styles from "./feature.module.css";
<div className={styles.container}>

// ❌ never
<div style={{ color: "#fff" }}>
<div className="flex items-center">   // no Tailwind
```

### Colors — always CSS variables
```css
/* ✅ correct */
.title { color: var(--theme-grey-800); }
.surface { background: var(--theme-grey-background); }

/* ❌ never */
.title { color: #1a1a1a; }
```

Check `src/theme/theme.css` for all available tokens before picking one.
If no token matches, find the nearest one — do not hardcode.

### Icons and Images — Next.js Image only
```tsx
import Image from "next/image";
import arrowIcon from "@/assets/arrow_right.svg";

<Image src={arrowIcon} alt="navigate" width={16} height={16} />
```
Never `<svg>`, never `<img>` for icons.

### State Management
- Redux Toolkit for all cross-component / page-level state
- `useAppSelector` / `useAppDispatch` (typed hooks) — never raw `useSelector`
- Reducers replace data — no business logic, no calculations
- Local UI state (`useState`) fine for toggle/open/close within one component

### API Calls
- Axios only, via `src/core/api/` — never `fetch`, never inside a component
- All API functions live in `*Api.ts` files in `src/core/api/`
- Use `useEffect` + dispatch or a custom hook to trigger them

### Component Reuse
Always check these before creating new:
`Search, Filters, Tooltip, CopiedToast, CoinIcon, Dropdown, Modal, Spinner,
StatusBadge, AddressItem, EmptyState, Toast/useToast`

### Toast / Notifications
- One toast visible at a time — no stacking
- Use `addToast` dispatch from `uiSlice`
- User-facing message must be safe copy — no raw API error strings

## Pixel-Perfect Tips for React

### Spacing
Copy px values directly from Figma Dev panel into CSS.
If Figma shows `padding: 16px 24px`, that is exactly what goes in the module.

### Figma Auto Layout → CSS Flexbox mapping
| Figma | CSS |
|-------|-----|
| Horizontal auto layout | `display: flex; flex-direction: row;` |
| Vertical auto layout | `display: flex; flex-direction: column;` |
| Align items: Center | `align-items: center;` |
| Justify: Space between | `justify-content: space-between;` |
| Gap: 12 | `gap: 12px;` |

### Figma Fill → CSS Background
| Figma | CSS |
|-------|-----|
| Solid fill #F5F5F5 | `background-color: var(--theme-grey-50);` |
| Linear gradient | `background: linear-gradient(...)` |
| Opacity 50% on layer | `opacity: 0.5` |

### Border Radius
Figma "corner radius 8" → `border-radius: 8px`.
Asymmetric corners: `border-radius: 8px 0 8px 0`.

### Auto Layout table — continued
| Figma | CSS |
|-------|-----|
| Padding: 16 24 | `padding: 16px 24px;` |
| Fill container | `flex: 1;` or `width: 100%;` |
| Hug contents | `width: fit-content;` or no explicit width |
| Fixed size 200 | `width: 200px; height: 200px;` |

### Shadows
```css
/* Figma: x=0, y=2, blur=8, spread=0, color=#00000014 */
box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
/* Inner shadow → inset */
box-shadow: inset 0px 1px 4px rgba(0, 0, 0, 0.12);
```

### Gradients
```css
/* Figma linear gradient with angle + stops */
background: linear-gradient(180deg, #087A4D 0%, #121319 70%);
/* Figma radial gradient */
background: radial-gradient(circle at center, #fff 0%, #000 100%);
```

### Text Styles
Figma typography panel → map directly:
- Font size 14 → `font-size: 14px`
- Line height 20 → `line-height: 20px`
- Letter spacing 0.2 → `letter-spacing: 0.2px`
- Weight Medium → `font-weight: 500`
- Text case UPPER → `text-transform: uppercase`
- Decoration underline → `text-decoration: underline`

### Spacing Token System
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
}
```

### Typography Tokens
```css
:root {
  --font-heading: 'Manrope', sans-serif;
  --font-body: 'Manrope', sans-serif;
}
.text-body-sm { font-size: 12px; line-height: 16px; font-weight: 400; }
.text-body-md { font-size: 14px; line-height: 20px; font-weight: 400; }
.text-heading-sm { font-size: 16px; line-height: 22px; font-weight: 700; }
.text-heading-lg { font-size: 24px; line-height: 32px; font-weight: 700; }
```

## Production Patterns

### Server vs Client Components (Next.js App Router)
- Default to Server Components (no `"use client"`) for static UI
- Add `"use client"` only when needed: `useState`, `useEffect`, event handlers, browser APIs
- Use Server Components for data fetching, Client Components for interactivity
- `next/dynamic` with `{ ssr: false }` for heavy client-only components

### Navigation (Next.js App Router)
```tsx
// app/(main)/layout.tsx — shared layout with bottom nav
import Link from "next/link";
<Link href="/market" prefetch>Market</Link>

// Route groups for layout sharing: (auth), (main), (settings)
// Typed params via generateStaticParams or route segment config
```

### Error Boundaries
```tsx
// app/error.tsx — automatic error boundary per route
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div><p>Something went wrong</p><button onClick={reset}>Retry</button></div>;
}
```

### Loading States (Suspense)
```tsx
// app/loading.tsx — automatic loading UI per route
export default function Loading() {
  return <SkeletonScreen />;
}

// Component-level: React.lazy + Suspense
const Chart = React.lazy(() => import("./Chart"));
<Suspense fallback={<ChartSkeleton />}><Chart /></Suspense>
```

### Lists & Virtualization
- For long lists (>50 items): use `react-virtuoso` or `@tanstack/react-virtual`
- Never `.map()` over large arrays directly in JSX
- Paginate API calls, infinite scroll with intersection observer

### Responsive Layout
```css
/* Mobile-first breakpoints */
.container { padding: 16px; }
@media (min-width: 768px) { .container { padding: 24px; max-width: 720px; } }
@media (min-width: 1024px) { .container { max-width: 960px; } }
```

### Accessibility
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` (not `<div onClick>`)
- Every `<Image>` has meaningful `alt` text (or `alt=""` for decorative)
- Every interactive element is keyboard focusable + has visible focus ring
- `aria-label` on icon-only buttons
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- `role`, `aria-expanded`, `aria-controls` for custom dropdowns/modals

### Data Layer
```tsx
// Types from visible design data
interface CoinListItem {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  iconUrl: string;
}

// API function in src/core/api/
export const coinApi = {
  getCoins: () => axios.get<CoinListItem[]>("/api/coins"),
};

// Widget accepts data via props, not hardcoded
function CoinRow({ coin }: { coin: CoinListItem }) { ... }
```

### Edge Cases
- Every dynamic text: `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` or `-webkit-line-clamp`
- Every network image: `onError` fallback
- Every list: empty state component
- Input fields: validation, error display, disabled state
