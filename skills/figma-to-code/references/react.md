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

### Text Styles
Figma typography panel → map directly:
- Font size 14 → `font-size: 14px`
- Line height 20 → `line-height: 20px`
- Letter spacing 0.2 → `letter-spacing: 0.2px`
- Weight Medium → `font-weight: 500`
