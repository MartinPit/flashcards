import React, { useMemo } from 'react';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useCSSVariable, useUniwind } from 'uniwind';

const { LightTheme: AdaptedNavLight, DarkTheme: AdaptedNavDark } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
});

export const ThemeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme: activeTheme } = useUniwind();

  const vars = useCSSVariable([
    '--color-primary',
    '--color-on-primary',
    '--color-primary-container',
    '--color-on-primary-container',
    '--color-secondary',
    '--color-on-secondary',
    '--color-secondary-container',
    '--color-on-secondary-container',
    '--color-tertiary',
    '--color-on-tertiary',
    '--color-tertiary-container',
    '--color-on-tertiary-container',
    '--color-background',
    '--color-on-background',
    '--color-surface',
    '--color-on-surface',
    '--color-surface-variant',
    '--color-on-surface-variant',
    '--color-outline',
    '--color-error',
    '--on-error',
    '--error-container',
    '--on-error-container',
    '--color-surface-disabled',
    '--color-on-surface-disabled',
    '--color-inverse-surface',
    '--color-inverse-on-surface',
    '--color-inverse-primary',
    '--color-elevation-1',
    '--color-elevation-2',
    '--color-elevation-3',
    '--color-elevation-4',
    '--color-elevation-5',
  ]);

  const combinedTheme = useMemo(() => {
    const isDark = activeTheme === 'dark';

    const paperBase = isDark ? MD3DarkTheme : MD3LightTheme;
    const navBase = isDark ? AdaptedNavDark : AdaptedNavLight;

    const [
      primary, onPrimary, primaryContainer, onPrimaryContainer,
      secondary, onSecondary, secondaryContainer, onSecondaryContainer,
      tertiary, onTertiary, tertiaryContainer, onTertiaryContainer,
      background, onBackground, surface, onSurface,
      surfaceVariant, onSurfaceVariant, outline,
      error, onError, errorContainer, onErrorContainer,
      surfaceDisabled, onSurfaceDisabled,
      inverseSurface, inverseOnSurface, inversePrimary,
      e1, e2, e3, e4, e5
    ] = vars;

    return {
      ...paperBase,
      ...navBase,
      dark: isDark,
      colors: {
        ...paperBase.colors,
        ...navBase.colors,
        primary: (primary ?? paperBase.colors.primary) as string,
        onPrimary: (onPrimary ?? paperBase.colors.onPrimary) as string,
        primaryContainer: (primaryContainer ?? paperBase.colors.primaryContainer) as string,
        onPrimaryContainer: (onPrimaryContainer ?? paperBase.colors.onPrimaryContainer) as string,

        secondary: (secondary ?? paperBase.colors.secondary) as string,
        onSecondary: (onSecondary ?? paperBase.colors.onSecondary) as string,
        secondaryContainer: (secondaryContainer ?? paperBase.colors.secondaryContainer) as string,
        onSecondaryContainer: (onSecondaryContainer ?? paperBase.colors.onSecondaryContainer) as string,

        tertiary: (tertiary ?? paperBase.colors.tertiary) as string,
        onTertiary: (onTertiary ?? paperBase.colors.onTertiary) as string,
        tertiaryContainer: (tertiaryContainer ?? paperBase.colors.tertiaryContainer) as string,
        onTertiaryContainer: (onTertiaryContainer ?? paperBase.colors.onTertiaryContainer) as string,

        background: (background ?? paperBase.colors.background) as string,
        onBackground: (onBackground ?? paperBase.colors.onBackground) as string,
        surface: (surface ?? paperBase.colors.surface) as string,
        onSurface: (onSurface ?? paperBase.colors.onSurface) as string,
        surfaceVariant: (surfaceVariant ?? paperBase.colors.surfaceVariant) as string,
        onSurfaceVariant: (onSurfaceVariant ?? paperBase.colors.onSurfaceVariant) as string,
        outline: (outline ?? paperBase.colors.outline) as string,

        error: (error ?? paperBase.colors.error) as string,
        onError: (onError ?? paperBase.colors.onError) as string,
        errorContainer: (errorContainer ?? paperBase.colors.errorContainer) as string,
        onErrorContainer: (onErrorContainer ?? paperBase.colors.onErrorContainer) as string,

        surfaceDisabled: (surfaceDisabled ?? paperBase.colors.surfaceDisabled) as string,
        onSurfaceDisabled: (onSurfaceDisabled ?? paperBase.colors.onSurfaceDisabled) as string,
        inverseSurface: (inverseSurface ?? paperBase.colors.inverseSurface) as string,
        inverseOnSurface: (inverseOnSurface ?? paperBase.colors.inverseOnSurface) as string,
        inversePrimary: (inversePrimary ?? paperBase.colors.inversePrimary) as string,

        elevation: {
          level0: 'transparent',
          level1: (e1 ?? paperBase.colors.elevation.level1) as string,
          level2: (e2 ?? paperBase.colors.elevation.level2) as string,
          level3: (e3 ?? paperBase.colors.elevation.level3) as string,
          level4: (e4 ?? paperBase.colors.elevation.level4) as string,
          level5: (e5 ?? paperBase.colors.elevation.level5) as string,
        },
      },
      fonts: paperBase.fonts,
    };
  }, [activeTheme, vars]);

  return (
    <PaperProvider theme={combinedTheme}>
      <ThemeProvider value={combinedTheme as any}>
        {children}
      </ThemeProvider>
    </PaperProvider>
  );
};
