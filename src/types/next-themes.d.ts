declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    disableTransitionOnChange?: boolean;
    themes?: string[];
    attribute?: string | boolean;
    value?: { [key: string]: string };
    nonce?: string;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
  };
}
