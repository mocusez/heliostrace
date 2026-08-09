// HeliosTrace brand palette, shared between TS (vega chart configs, app context)
// and Tailwind (registered as brand-* colors in globals.css @theme).
export const brandColors = {
    primary: '#f5f3bb',
    secondary: '#d4733e',
    tertiary: '#919191',
    accentBlack: '#040404',
    accentDarkGreen: '#379634',
    accentDarkBlue: '#454E9E',
} as const;

export const hoverOpacity = 0.5;

// ---------------------------------------------------------------------------
// Light/dark theme management. The `dark` class on <html> drives the shadcn
// CSS variables (globals.css); TS consumers (vega specs, monaco) read the
// helpers below and re-render on the THEME_CHANGE_EVENT.
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'heliostrace-theme';
export const THEME_CHANGE_EVENT = 'helios-theme-change';

export function isDarkTheme(): boolean {
    return document.documentElement.classList.contains('dark');
}

export function applyTheme(mode: ThemeMode): void {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }));
}

export function toggleTheme(): ThemeMode {
    const next: ThemeMode = isDarkTheme() ? 'light' : 'dark';
    applyTheme(next);
    return next;
}

// Called once at startup, before React renders, to avoid a light flash.
export function initTheme(): void {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const mode: ThemeMode = stored === 'dark' || stored === 'light'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mode === 'dark');
}

// Theme-aware ink colors for canvas/SVG renderers (vega) that cannot use CSS
// variables. Read at spec-build time; charts remount on THEME_CHANGE_EVENT.
export function chartInk() {
    const dark = isDarkTheme();
    return {
        // primary text: chart titles, value labels, emphasized marks
        text: dark ? '#e8e8e8' : brandColors.accentBlack,
        // secondary text: axis/legend labels and titles
        label: dark ? '#a3a3a3' : '#6f6f6f',
        // hairlines: axis domain, ticks, grid
        line: dark ? '#404040' : '#d4d4d4',
        // card/canvas surface behind custom-drawn nodes (react-flow chips)
        surface: dark ? '#262626' : '#ffffff',
    };
}

// Vega global config applied to every spec so text stays legible in both themes.
export function vegaThemeConfig() {
    const ink = chartInk();
    return {
        background: 'transparent',
        title: { color: ink.text, subtitleColor: ink.label },
        axis: {
            labelColor: ink.label,
            titleColor: ink.label,
            domainColor: ink.line,
            tickColor: ink.line,
            gridColor: ink.line,
        },
        legend: {
            labelColor: ink.label,
            titleColor: ink.label,
        },
        text: { fill: ink.text },
    };
}
