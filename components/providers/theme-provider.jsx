"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Wraps the app so light/dark mode is toggled via the `.dark` class. */
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
