// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { type PaletteMode } from "@mui/material";

// WSO2 brand palette
const wso2 = {
  orange: {
    50: "#FFF7F0",
    100: "#FFEDD5",
    200: "#FED7AA",
    400: "#FB923C",
    500: "#FF7300",
    600: "#EA6A00",
    700: "#C2570A",
    800: "#9A4408",
    900: "#7C3A0A",
  },
};

// Extend MUI theme types
declare module "@mui/material/styles" {
  interface Palette {
    neutral: Record<string | number, string | undefined>;
    customNavigation: {
      text: string;
      textClicked: string;
      hover: string;
      hoverBg: string;
      clicked: string;
      clickedBg: string;
      border: string;
    };
    surface: {
      primary: Record<string, string>;
      secondary: Record<string, string>;
      territory: Record<string, string>;
    };
    customText: {
      primary: {
        p1: { active: string; hover: string };
        p2: { active: string; hover: string };
        p3: { active: string; hover: string };
        p4: { active: string; hover: string };
      };
      brand: {
        p1: { active: string; hover: string; disabled?: string };
      };
    };
    customBorder: {
      primary: { active: string; hover: string; clicked: string; disabled: string };
      secondary: { active: string; hover: string; clicked: string; disabled: string };
      territory: { active: string; hover: string; clicked: string; disabled: string };
    };
  }

  interface PaletteOptions {
    neutral?: Record<string | number, string | undefined>;
    customNavigation?: {
      text?: string;
      textClicked?: string;
      hover?: string;
      hoverBg?: string;
      clicked?: string;
      clickedBg?: string;
      border: string;
    };
    surface?: {
      primary?: Record<string, string>;
      secondary?: Record<string, string>;
      territory?: Record<string, string>;
    };
    customText?: {
      primary?: {
        p1?: { active: string; hover: string };
        p2?: { active: string; hover: string };
        p3?: { active: string; hover: string };
        p4?: { active: string; hover: string };
      };
      brand?: {
        p1?: { active: string; hover: string; disabled?: string };
      };
    };
    customBorder?: {
      primary?: { active: string; hover: string; clicked: string; disabled: string };
      secondary?: { active: string; hover: string; clicked: string; disabled: string };
      territory?: { active: string; hover: string; clicked: string; disabled: string };
    };
  }
}

export const themeSettings = (mode: PaletteMode) => {
  const isDark = mode === "dark";

  return {
    palette: {
      mode,
      primary: {
        main: wso2.orange[500],
        light: wso2.orange[400],
        dark: wso2.orange[700],
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#0EA5E9",
        light: "#38BDF8",
        dark: "#0284C7",
        contrastText: "#ffffff",
      },
      error: { main: "#EF4444", light: "#F87171", dark: "#DC2626" },
      warning: { main: "#F59E0B", light: "#FCD34D", dark: "#D97706" },
      info: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
      success: { main: "#10B981", light: "#34D399", dark: "#059669" },
      background: {
        default: isDark ? "#0f0f0f" : "#F8F9FA",
        paper: isDark ? "#1a1a1a" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F9FAFB" : "#111827",
        secondary: isDark ? "#9CA3AF" : "#6B7280",
        disabled: isDark ? "#4B5563" : "#9CA3AF",
      },

      // Custom tokens
      neutral: {
        white: "#FFFFFF",
        black: "#000000",
        50: "#F9FAFB",
        100: "#F3F4F6",
        200: "#E5E7EB",
        300: "#D1D5DB",
        400: "#9CA3AF",
        500: "#6B7280",
        600: "#4B5563",
        700: "#374151",
        800: "#1F2937",
        900: "#111827",
        1700: isDark ? "#1F2937" : "#374151",
      },

      customNavigation: {
        text: isDark ? "#9CA3AF" : "#6B7280",
        textClicked: isDark ? "#FFFFFF" : "#111827",
        hover: isDark ? "#F9FAFB" : "#111827",
        hoverBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        clicked: isDark ? "#FFFFFF" : "#111827",
        clickedBg: isDark ? "rgba(255,115,0,0.15)" : "rgba(255,115,0,0.1)",
        border: isDark ? "#374151" : "#E5E7EB",
      },

      surface: {
        primary: {
          active: isDark ? "#0f0f0f" : "#F8F9FA",
          hover: isDark ? "#1a1a1a" : "#FFFFFF",
        },
        secondary: {
          active: isDark ? "#141414" : "#FFFFFF",
          hover: isDark ? "#1f1f1f" : "#F9FAFB",
        },
        territory: {
          active: isDark ? "#111111" : "#FFFFFF",
        },
      },

      customText: {
        primary: {
          p1: { active: isDark ? "#F9FAFB" : "#111827", hover: "#FF7300" },
          p2: { active: isDark ? "#D1D5DB" : "#374151", hover: "#FF7300" },
          p3: { active: isDark ? "#9CA3AF" : "#6B7280", hover: "#FF7300" },
          p4: { active: isDark ? "#6B7280" : "#9CA3AF", hover: "#FF7300" },
        },
        brand: {
          p1: { active: wso2.orange[500], hover: wso2.orange[600], disabled: "#FFB380" },
        },
      },

      customBorder: {
        primary: { active: isDark ? "#374151" : "#E5E7EB", hover: "#9CA3AF", clicked: "#6B7280", disabled: "#D1D5DB" },
        secondary: { active: isDark ? "#1F2937" : "#F3F4F6", hover: "#E5E7EB", clicked: "#D1D5DB", disabled: "#F3F4F6" },
        territory: { active: isDark ? "#374151" : "#E5E7EB", hover: "#9CA3AF", clicked: "#6B7280", disabled: "#D1D5DB" },
      },
    },

    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSize: 14,
      h1: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.2 },
      h2: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 },
      h3: { fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3 },
      h4: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.35 },
      h5: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.6 },
      caption: { fontSize: "0.75rem", lineHeight: 1.5 },
      overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const },
    },

    shape: { borderRadius: 8 },
    spacing: 8,

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none" as const,
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          contained: {
            backgroundColor: wso2.orange[500],
            "&:hover": { backgroundColor: wso2.orange[600] },
            "&.Mui-disabled": { backgroundColor: "#FFD4A8", color: "#fff" },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": { borderRadius: 8 },
          },
        },
      },
    },

    breakpoints: {
      values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
  };
};

export default themeSettings;
