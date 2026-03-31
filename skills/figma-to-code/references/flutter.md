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

### Navigation
- Use `GoRouter` or `Navigator 2.0`
- Named routes, typed params

### Lists
- `ListView.builder` for variable-length lists — never `ListView` with mapped children
- `GridView.builder` for grids
- `const` constructors wherever possible

### Performance
- `const` widget constructors wherever nothing changes at runtime
- `RepaintBoundary` around expensive animated widgets
- `ListView.builder` + `AutomaticKeepAliveClientMixin` for tabs
