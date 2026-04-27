# Flashcards AI Agent Guidelines

## Data Layer (PowerSync + Supabase)

- **Write to local SQLite only**: Use `system.powerSync.execute()` for all data mutations. Do NOT use the Supabase JS client directly (except auth).
- **Schema**: Defined in `lib/powersync/Schema.ts` — update here when adding tables.
- **Adapter switching** (`lib/powersync/system.ts`):
  - Expo Go → `@powersync/adapter-sql-js` (SQL.js)
  - Native builds → `@powersync/op-sqlite`
- **Sync**: `SupabaseConnector` in `lib/powersync/SupabaseConnector.ts` handles upstream sync automatically.

## Routing & Auth

- File-based routing via `app/` directory (Expo Router).
- Auth guard at root: `Stack.Protected guard={!!session}` (authenticated) vs `guard={!session}` (unauthenticated).
- `hooks/use-auth-context.tsx` — manages session + sync enable/disable state.

## UI & Styling

- **Tailwind CSS v4 via `uniwind`**: Components need `withUniwind()` wrapper to use `className`.
- **Components requiring `withUniwind`**: View, Text, SafeAreaView, FlatList, List.Item, etc.
- Path alias: `@/*` → `./` (root).
- Theme via `ThemeSyncProvider` — use standard utility classes.

## UI Components

- **SwipeableListItem** (`components/ui/swipeable-list-item.tsx`): Reusable swipeable list item with delete action.
- **ConfirmDialog** (`components/ui/confirm-dialog.tsx`): Modal for delete confirmations.
- **useConfirmDialog** (`components/ui/use-confirm-dialog.ts`): Hook providing `confirmDialogRef`, `showConfirm`, and `showDeleteConfirm`.

## Imports

- Named exports preferred: `import { Component } from '...'` (except react-native-safe-area-context which requires `import { SafeAreaView }` named import).

## Developer Commands

```bash
npm run start          # Expo dev server
npm run lint           # ESLint + TypeScript checking (expo lint)
npm run development-builds   # EAS workflow: create development build
npm run draft          # EAS workflow: publish preview update
npm run deploy         # EAS workflow: production deployment
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/powersync/Schema.ts` | Local SQLite schema |
| `lib/powersync/system.ts` | PowerSync init + adapter selection |
| `app/_layout.tsx` | Root layout, auth guards, Sentry init |
| `global.css` | Theme variables, Tailwind v4 setup |

## Gotchas

- **No unit tests**: This repo has no test runner. SQLite data-shape changes require verification on a real device/simulator via a development build.
- **React Compiler enabled**: `app.json` has `reactCompiler: true` — avoid manual `useMemo`/`useCallback` unless needed.
- **Sentry wraps root layout**: `Sentry.wrap(function RootLayout() {...})` in `app/_layout.tsx:58`.