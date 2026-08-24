# Dolaby themes

Dolaby keeps its visual palettes as named themes. The active production theme is selected in [`config/theme.ts`](config/theme.ts):

```ts
export const ACTIVE_THEME: ThemeName = "boutique";
```

Available themes:

- `boutique` — the current café-lookbook palette, using espresso, walnut, oat, muted brass, and olive with clear editorial slab typography.
- `green-lime` — the archived original palette, using forest green, sage, lime, and the original soft accent colors.

To switch themes, change only `ACTIVE_THEME`, then rebuild the app. The document theme, browser theme color, and hanger favicon all follow that setting.

Palette and semantic UI tokens live in [`app/themes.css`](app/themes.css). Shared component layout and styling remain in [`app/globals.css`](app/globals.css). When adding a UI color, add a semantic token to both theme blocks instead of hardcoding it in a component rule.
