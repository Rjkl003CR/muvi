"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { createContext, useState, useEffect } from "react";

export const ColorThemeContext = createContext({
  colorTheme: "theme-coral",
  setColorTheme: (theme: string) => {},
});

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [colorTheme, setColorTheme] = useState("theme-coral");

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem("muvi-color-theme");
    if (saved) {
      setColorTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem("muvi-color-theme", colorTheme);
    document.documentElement.setAttribute("data-theme", colorTheme);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ColorThemeContext.Provider>
  );
}
