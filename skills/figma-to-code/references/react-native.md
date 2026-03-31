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

### Spacing Tokens
```ts
// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
// Usage: padding: spacing.lg
```

### Gradients
```tsx
import { LinearGradient } from "expo-linear-gradient";
// Figma: linear-gradient(180deg, #087A4D 0%, #121319 70%)
<LinearGradient
  colors={["#087A4D", "#121319"]}
  locations={[0, 0.7]}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={styles.gradientBg}
/>
```

### Responsive Layout
```tsx
import { useWindowDimensions } from "react-native";
const { width } = useWindowDimensions();
// Adapt layout based on screen width
const columns = width > 600 ? 3 : 2;

// Use percentage-based widths or flex for adaptive layouts
{ width: "100%" }  // ✅ fills container
{ width: 375 }     // ❌ breaks on small/large screens

// EdgeInsets: use start/end for RTL
{ paddingStart: 16, paddingEnd: 8 }  // ✅ RTL-safe
{ paddingLeft: 16, paddingRight: 8 } // ❌ breaks in RTL
```

### Accessibility
```tsx
// Every interactive element
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Add to watchlist"
  accessibilityState={{ selected: isWatchlisted }}
  hitSlop={12} // ensure 48x48 minimum tap target
  onPress={handlePress}
/>

// Every image
<Image source={coinIcon} accessibilityLabel="Bitcoin logo" />

// Decorative images
<Image source={bgPattern} accessible={false} />

// Headings for screen reader navigation
<Text accessibilityRole="header">Announcements</Text>
```

### Data Models & State Integration
```tsx
// Generate from visible design data
interface CoinListItem {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  iconUrl: string;
}

// Widget accepts data via props
const CoinRow = React.memo(({ coin }: { coin: CoinListItem }) => { ... });

// Screen connects to state
function WatchlistScreen() {
  const { data, isLoading, error } = useCoinList();
  if (isLoading) return <SkeletonList />;
  if (error) return <ErrorRetry onRetry={refetch} />;
  if (!data?.length) return <EmptyState message="No coins" />;
  return <FlatList data={data} renderItem={({ item }) => <CoinRow coin={item} />} />;
}
```

### Animation & Gestures
```tsx
// Tap feedback: always Pressable, never TouchableOpacity (deprecated pattern)
import { Pressable } from "react-native";
<Pressable
  onPress={handlePress}
  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
/>

// Gesture handler for swipe-to-dismiss, pull-to-refresh
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
<Animated.View entering={FadeIn.duration(200)}>
```

### FlatList Advanced Optimization
```tsx
<FlatList
  data={coins}
  renderItem={renderCoinRow}
  keyExtractor={(item) => item.symbol}
  getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })} // fixed height rows
  windowSize={10}
  maxToRenderPerBatch={15}
  removeClippedSubviews={true}
  ItemSeparatorComponent={Divider}
  ListEmptyComponent={<EmptyState />}
  ListHeaderComponent={<ListHeader />}
/>
```

### Platform-Specific Code
```tsx
import { Platform } from "react-native";
// Conditional styles
{ paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight }

// Platform-specific files
// Button.ios.tsx, Button.android.tsx → imported as Button
```

### Edge Cases
```tsx
// Every dynamic text: numberOfLines + ellipsizeMode
<Text numberOfLines={1} ellipsizeMode="tail">{coin.name}</Text>

// Every network image: fallback
<Image source={{ uri: coin.iconUrl }} defaultSource={require("@/assets/placeholder.png")} />

// Every list: empty state
ListEmptyComponent={<EmptyState message="No items found" />}
```

### Navigation (React Navigation)
```tsx
// Typed navigation with deep links
const Stack = createNativeStackNavigator<RootStackParamList>();
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="CoinDetail" component={CoinDetailScreen} />
</Stack.Navigator>

// Bottom tabs with persistence
const Tab = createBottomTabNavigator();
<Tab.Navigator>
  <Tab.Screen name="Market" component={MarketScreen} />
  <Tab.Screen name="Positions" component={PositionsScreen} />
</Tab.Navigator>

// Deep linking
const linking = {
  prefixes: ["myapp://"],
  config: { screens: { CoinDetail: "coin/:symbol" } },
};
```

### Error Boundaries
```tsx
// Wrap feature screens to prevent full-app crashes
class ErrorBoundary extends React.Component<PropsWithChildren, { hasError: boolean }> {
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

### Performance
- `FlatList` for any scrollable list — never `ScrollView` with mapped children
- `React.memo` on heavy list item components
- `useCallback` on handlers passed to list items
- Avoid anonymous functions in JSX (`onPress={() => fn()}` → `onPress={handlePress}`)
- `expo-image` over `Image` for better caching and performance
- `FlashList` from Shopify for highest-performance lists (drop-in FlatList replacement)
