# Flashcards AI Agent Guidelines

## Architecture & Data Flow
- **Offline-First Data Layer**: This app operates offline-first using **PowerSync** and **Supabase**. 
  - Data mutations MUST be performed locally against the PowerSync SQLite database (via `system.powerSync.execute()`). 
  - PowerSync automatically syncs these changes to Supabase via the `SupabaseConnector` (`lib/powersync/SupabaseConnector.ts`). **Do not mutate data directly using the Supabase JS client** except for authentication or edge-case RPCs.
  - The local database schema is defined in `lib/powersync/Schema.ts`. Update this file when adding new tables.
- **Dynamic SQL Adapters**: The app dynamically switches between `@powersync/adapter-sql-js` for Expo Go compatibility and `@powersync/op-sqlite` for performance in native builds (`lib/powersync/system.ts`). Be mindful of adapter constraints when interacting with SQLite.

## Routing & Auth Controls
- **File-Based Routing via Expo Router**: The app lives in the `app/` directory.
- **Auth Guards**: Authentication routing state is managed at the root (`app/_layout.tsx`) using the custom `Stack.Protected` component. 
  - When creating a new route flow, assess whether it belongs inside the authenticated guard (`guard={!!session}`) or unauthenticated guard (`guard={!session}`). 
  - The `@/hooks/use-auth-context.tsx` orchestrates connection syncing alongside user session.

## UI, Styling & React
- **Tailwind CSS v4 Integration**: Styling relies heavily on Tailwind CSS v4, initialized through `global.css` and applied via standard classes with `uniwind` and `tailwind-merge`. Avoid `StyleSheet.create` unless addressing a highly specific edge case.
- **React Compiler**: The project has the React Compiler enabled in `app.json`. Focus on building idiomatic React 19 components without prematurely applying `useMemo` or `useCallback`.
- **Theme Support**: Handled via `ThemeSyncProvider`. Ensure your UI uses standard utility classes that respond well to native appearance changes.

## Developer Workflows & Commands
- **Testing Constraints**: Since the app relies heavily on native SQLite in higher environments, changes affecting data shapes must be verified on an actual simulator via a development build.
- **Key CLI Commands**:
  - `npm run start` - Standard Expo start.
  - `npm run development-builds` - Invokes EAS CLI to trigger custom development build workflows (`create-development-builds.yml`).
  - `npm run draft` / `npm run deploy` - Triggers EAS previews and production releases.
- **Error Tracking**: Global errors track to Sentry (`@sentry/react-native` setup in `app/_layout.tsx`). Use `ErrorBoundary` (`components/error-boundary.tsx`) around new standalone workflows.

