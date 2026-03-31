# React Native / Expo Implementation Rules

## File Structure
```
src/
  components/<ComponentName>/
    index.tsx
    styles.ts           ← StyleSheet.create()
  screens/<ScreenName>/
    index.tsx
    styles.ts
  assets/               ← exported from Figma (PNG/WebP for RN)
  theme/
    colors.ts           ← all color tokens
    typography.ts       ← all text style tokens
    spacing.ts          ← spacing scale
```

## Code Standards

### TypeScript — strict
- No `any`, explicit return types: `(): React.JSX.Element`
- Props interfaces defined above the component
- Navigation types via React Navigation's typed params

### Styling — StyleSheet.create only
```tsx
// ✅ correct
import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

// ❌ never
<View style={{ flex: 1, backgroundColor: "#fff" }} />
```

### Colors — always from theme tokens
```ts
// theme/colors.ts
export const colors = {
  background: "#FFFFFF",
  grey800: "#1A1A1A",
  primary: "#0066FF",
  // ...
};

// usage
import { colors } from "@/theme/colors";
backgroundColor: colors.background
```
Never hardcode hex/rgb values inline.

### Icons and Images — no hand-coded SVGs
```tsx
// For SVGs: use react-native-svg + expo-asset or inline via react-native-svg
// For exported PNGs:
import { Image } from "react-native";
import arrowIcon from "@/assets/arrow_right.png";
<Image source={arrowIcon} style={{ width: 16, height: 16 }} />

// For expo:
import { Image } from "expo-image";
<Image source={require("@/assets/arrow_right.png")} style={{ width: 16, height: 16 }} />
```
Export assets from Figma as PNG @1x, @2x, @3x (or WebP).
Never hand-draw vectors — use the exported asset.

### Pixel-Perfect Tips for React Native

#### Figma px → React Native dp
Figma designs are typically at @1x or @2x.
- If Figma is @1x: use values as-is (Figma 16px → RN 16)
- If Figma is @2x: divide by 2 (Figma 32px → RN 16)
Confirm with designer or check frame width (375 = @1x iPhone base).

#### Figma Auto Layout → React Native Flexbox
| Figma | React Native |
|-------|-------------|
| Horizontal auto layout | `flexDirection: "row"` |
| Vertical auto layout | `flexDirection: "column"` (default) |
| Align items: Center | `alignItems: "center"` |
| Justify: Space between | `justifyContent: "space-between"` |
| Gap: 12 | `gap: 12` (RN 0.71+) or `margin` on children |
| Fill container | `flex: 1` |
| Hug contents | no explicit size |
| Fixed width | `width: 200` |

#### Typography
```ts
// theme/typography.ts
export const typography = {
  body1: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  heading2: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
};
```
Apply as spread: `<Text style={[typography.body1, styles.label]}`

#### Shadows (iOS vs Android)
```ts
// iOS
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 8,
// Android
elevation: 4,
```
Always include both — check Figma shadow values for iOS params.

#### Border Radius
Figma corner radius 12 → `borderRadius: 12`
Asymmetric: `borderTopLeftRadius: 12, borderTopRightRadius: 12`

#### Safe Areas
Always wrap screens with `<SafeAreaView>` or use `useSafeAreaInsets()`.
Never hardcode top/bottom padding to compensate for notch/home indicator.

### Navigation
Use React Navigation typed navigation:
```tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "ScreenName"> };
```

### State Management
- Zustand or Redux Toolkit — use whichever the project already uses
- Never call API inside component body
- Use custom hooks (`useAddressBook`, `useUserProfile`) to encapsulate data fetching

### Performance
- `FlatList` for any scrollable list — never `ScrollView` with mapped children
- `React.memo` on heavy list item components
- `useCallback` on handlers passed to list items
- Avoid anonymous functions in JSX (`onPress={() => fn()}` → `onPress={handlePress}`)
