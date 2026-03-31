# Flutter Implementation Rules

## File Structure
```
lib/
  features/<feature_name>/
    presentation/
      screens/
        <feature>_screen.dart
      widgets/
        <component>_widget.dart
  shared/
    widgets/         ← reusable widgets
    theme/
      app_colors.dart
      app_text_styles.dart
      app_spacing.dart
  assets/            ← exported from Figma (SVG via flutter_svg, PNG fallback)
pubspec.yaml         ← declare all assets here
```

## Code Standards

### Dart — strict, explicit types
- No `dynamic` — use proper types or generics
- All functions have explicit return types: `Widget build(BuildContext context)`
- Use `final` everywhere possible
- Named parameters for clarity on multi-param widgets

### Styling — Theme + AppColors, never hardcoded

```dart
// ✅ correct
import 'package:myapp/shared/theme/app_colors.dart';
Container(color: AppColors.background)
Text("Hello", style: AppTextStyles.body1)

// ❌ never
Container(color: Color(0xFFFFFFFF))
Text("Hello", style: TextStyle(fontSize: 14, color: Color(0xFF1A1A1A)))
```

### AppColors — mirrors Figma color styles
```dart
// lib/shared/theme/app_colors.dart
class AppColors {
  static const Color background = Color(0xFFF8F8F8);
  static const Color grey800 = Color(0xFF1A1A1A);
  static const Color primary = Color(0xFF0066FF);
  static const Color surface = Color(0xFFFFFFFF);
  // one entry per Figma color style
}
```

### AppTextStyles — mirrors Figma text styles
```dart
// lib/shared/theme/app_text_styles.dart
class AppTextStyles {
  static const TextStyle body1 = TextStyle(
    fontSize: 14, height: 1.43, // lineHeight 20 / fontSize 14
    fontWeight: FontWeight.w400,
    letterSpacing: 0.2,
  );
  static const TextStyle heading2 = TextStyle(
    fontSize: 20, height: 1.4,
    fontWeight: FontWeight.w600,
  );
}
```

### AppSpacing — spacing constants
```dart
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
}
```

### Icons and Images — never hand-drawn
```dart
// SVG icons (preferred) — use flutter_svg
import 'package:flutter_svg/flutter_svg.dart';
SvgPicture.asset("assets/icons/arrow_right.svg", width: 16, height: 16)

// PNG images
Image.asset("assets/images/illustration.png", width: 200)

// Network images with caching
CachedNetworkImage(imageUrl: url, width: 48, height: 48)
```
Export from Figma using `download_figma_images`.
Declare every asset in `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/icons/
    - assets/images/
```

### Pixel-Perfect Tips for Flutter

#### Figma px → Flutter logical pixels
Flutter uses logical pixels matching @1x. Figma at @1x → use directly.
If Figma frame is 375px wide, values map 1:1 to Flutter logical pixels.

#### Figma Auto Layout → Flutter Layout

| Figma | Flutter |
|-------|---------|
| Horizontal auto layout | `Row(children: [...])` |
| Vertical auto layout | `Column(children: [...])` |
| Gap between items | `SizedBox(width/height: gap)` or `mainAxisSpacing` |
| Align items: Center | `crossAxisAlignment: CrossAxisAlignment.center` |
| Justify: Space between | `mainAxisAlignment: MainAxisAlignment.spaceBetween` |
| Fill container width | `width: double.infinity` or `Expanded` |
| Hug content | no size constraint |
| Fixed size | `SizedBox(width: 200, height: 48)` |
| Padding | `Padding(padding: EdgeInsets.all(16))` |

#### Figma Shadows → Flutter BoxDecoration
```dart
BoxDecoration(
  boxShadow: [
    BoxShadow(
      color: Color(0x14000000), // Figma opacity as hex alpha
      offset: Offset(0, 2),    // Figma x, y
      blurRadius: 8,            // Figma blur
      spreadRadius: 0,          // Figma spread
    ),
  ],
)
```

#### Border Radius
```dart
// Uniform
borderRadius: BorderRadius.circular(12)
// Asymmetric
borderRadius: BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12))
```

#### Typography — `height` is a multiplier in Flutter
`height = lineHeight / fontSize` (e.g., lineHeight 20 / fontSize 14 = 1.43)

#### Gradients
```dart
BoxDecoration(
  gradient: LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.gradientStart, AppColors.gradientEnd],
  ),
)
```

### State Management
- Use `flutter_bloc` (BLoC/Cubit) or `riverpod` — whichever the project uses
- No business logic in widgets
- Separate `Event → Bloc → State` or `Notifier → Provider`
- All API calls go through Repository classes
- Widget accepts data via constructor — never fetch inside `build()`
- Generate loading/error/empty state variants for every screen

```dart
// Pattern: stateless widget accepts model, stateful wrapper connects to state
class CoinRow extends StatelessWidget {
  final CoinListItem coin;  // data model, not hardcoded
  const CoinRow({super.key, required this.coin});
  // ...
}

// Screen connects to BLoC/Provider
class WatchlistScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<WatchlistBloc, WatchlistState>(
      builder: (context, state) {
        if (state is WatchlistLoading) return const ShimmerList();
        if (state is WatchlistError) return ErrorRetry(onRetry: () => ...);
        if (state is WatchlistEmpty) return const EmptyState(message: 'No coins');
        return ListView.builder(...);
      },
    );
  }
}
```

### Navigation
- Use `GoRouter` or `Navigator 2.0`
- Named routes, typed params
- Bottom navigation: `StatefulShellRoute` in GoRouter or `IndexedStack` for persistence
- Deep links: configure route paths for shareable screens
- Hero transitions: add `Hero(tag: 'coin-${id}')` for shared elements between screens
- Back navigation: test Android back gesture + iOS swipe-back

### Lists
- `ListView.builder` for variable-length lists — never `ListView` with mapped children
- `GridView.builder` for grids
- `const` constructors wherever possible
- `FlatList` with `itemExtent` for fixed-height rows (skips measurement)
- Always handle: 0 items (empty state), 1 item, many items
- `SliverList` + `CustomScrollView` for heterogeneous scrollable pages

### Responsive Layout
```dart
// Use LayoutBuilder for adaptive widths — never hardcode screen width
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) return TabletLayout();
    return MobileLayout();
  },
)

// Use Expanded/Flexible instead of fixed widths for content
Row(children: [
  Expanded(child: Text('Name')),        // ✅ fills available space
  SizedBox(width: 200, child: price),   // ❌ breaks on small screens
])

// EdgeInsetsDirectional for RTL support
padding: EdgeInsetsDirectional.only(start: 16, end: 8) // ✅
padding: EdgeInsets.only(left: 16, right: 8)            // ❌ breaks in RTL
```

### Accessibility
```dart
// Every interactive element: InkWell with minimum 48x48 tap target
InkWell(
  onTap: () {},
  child: Padding(
    padding: EdgeInsets.all(12), // ensures 48x48 minimum
    child: Icon(Icons.star, size: 24, semanticLabel: 'Add to watchlist'),
  ),
)

// Every icon: semanticLabel
SvgPicture.asset('icon.svg', semanticsLabel: 'Navigate forward')

// Compound widgets: merge semantics
MergeSemantics(
  child: Row(children: [icon, Text('Settings')]),
)

// Decorative images: exclude from semantics
ExcludeSemantics(child: Image.asset('decorative_bg.png'))
```

### Platform Concerns
```dart
// SafeArea — wrap content or verify Scaffold handles it
SafeArea(child: content)

// Status bar style — match design header
SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
  statusBarColor: Colors.transparent,
  statusBarIconBrightness: Brightness.light, // for dark headers
))

// Keyboard avoidance for input screens
Scaffold(resizeToAvoidBottomInset: true)

// Pull-to-refresh for list screens
RefreshIndicator(onRefresh: () async { ... }, child: listView)
```

### Theme Integration
```dart
// Wire colors through ThemeData, not static class
// AppColors can exist as TOKEN MAPPING but access via Theme.of(context)
final theme = ThemeData(
  colorScheme: ColorScheme.dark(
    surface: Color(0xFF121319),
    onSurface: Color(0xFFEDF2F7),
    primary: Color(0xFF0ECB81),
    error: Color(0xFFF14366),
  ),
  extensions: [AppTokens(gold: Color(0xFFCDA954), grey01: Color(0xFFA4A5AB))],
);

// In widgets:
Theme.of(context).colorScheme.surface  // ✅
AppColors.background                    // ❌ not theme-aware
```

### Data Models
```dart
// Generate from visible design data shapes
class CoinListItem {
  final String symbol;
  final String pair;
  final double price;
  final double changePercent;
  final String iconUrl;
  const CoinListItem({...});
}

// Repository stub
abstract class CoinRepository {
  Future<List<CoinListItem>> getCoins();
  Future<CoinListItem> getCoin(String symbol);
}
```

### Edge Case Handling
```dart
// Every dynamic text: maxLines + overflow
Text(coin.name, maxLines: 1, overflow: TextOverflow.ellipsis)

// Every network image: error + placeholder
CachedNetworkImage(
  imageUrl: coin.iconUrl,
  width: 32, height: 32,
  placeholder: (_, __) => ShimmerCircle(size: 32),
  errorWidget: (_, __, ___) => Icon(Icons.error, size: 32),
)

// Image sizing: don't load 4K into 48x48
Image.asset('large.png', cacheWidth: 96) // 2x for retina
```

### Animation & Interaction
```dart
// Tap feedback: always InkWell, never raw GestureDetector
InkWell(onTap: () {}, borderRadius: BorderRadius.circular(8), child: ...)

// Hero transitions for shared elements
Hero(tag: 'coin-${coin.symbol}', child: coinIcon)

// Page transitions matching Figma prototype
GoRoute(
  pageBuilder: (_, state) => CustomTransitionPage(
    child: screen,
    transitionsBuilder: (_, animation, __, child) =>
      SlideTransition(position: Tween(begin: Offset(1, 0), end: Offset.zero).animate(animation), child: child),
  ),
)
```

### Performance
- `const` widget constructors wherever nothing changes at runtime
- `RepaintBoundary` around expensive animated widgets
- `ListView.builder` + `AutomaticKeepAliveClientMixin` for tabs
- `CachedNetworkImage` for all network images with `cacheWidth`/`cacheHeight`
- Avoid `Opacity` widget — use `color.withOpacity()` or `AnimatedOpacity` instead
- Widget tree depth: refactor if >15 levels — extract sub-widgets
- No `setState` in assembled screens — use state management
