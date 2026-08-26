/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-dim": "#ccdbf4",
        "primary": "#1D3A46", // Official Midwest Spine Deep Slate Navy (--ast-global-color-0 / Button Color)
        "primary-hover": "#162E38",
        "primary-container": "#CDE4E8", // Official Soft Light Ice Teal Tint (--ast-global-color-7)
        "secondary": "#045CB4", // Official Electric Blue Link Accent (--ast-global-color-1)
        "secondary-container": "#99CAD9", // Soft Sky Blue (--ast-global-color-4)
        "accent-sky": "#99CAD9",
        "surface-variant": "#d5e3fd",
        "on-secondary-container": "#1D3A46",
        "primary-fixed": "#c1e9fa",
        "surface-container": "#DCECF0", // Light Ice Teal Container
        "on-error": "#ffffff",
        "surface-container-low": "#EAF4F7",
        "inverse-surface": "#1D3A46",
        "surface-bright": "#F4F9FA",
        "surface-container-high": "#CDE4E8",
        "status-error": "#EF4444",
        "on-error-container": "#93000a",
        "surface": "#F4F9FA",
        "status-success": "#10B981",
        "on-surface-variant": "#335360", // Official Slate Body Text (--ast-global-color-3)
        "outline": "#71787b",
        "status-warning": "#F59E0B",
        "surface-muted": "#E6F0F3", // Official Midwest Spine Soft Ice Teal Canvas Background
        "background": "#E6F0F3",
        "on-primary-container": "#1D3A46",
        "surface-container-lowest": "#ffffff",
        "error": "#ba1a1a",
        "on-surface": "#1D3A46", // Official Dark Slate Deep Teal Headings (--ast-global-color-2)
        "on-secondary": "#ffffff",
        "border-subtle": "#BACED6", // Clean Ice Teal Border
        "on-background": "#1D3A46",
        "surface-container-highest": "#CDE4E8",
        "on-primary": "#ffffff",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "base": "8px",
        "container-max": "1440px",
        "margin-md": "24px",
        "margin-sm": "16px",
        "margin-lg": "48px",
        "gutter": "20px"
      },
      fontFamily: {
        "headline-lg": ["Hanken Grotesk", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "headline-sm": ["Hanken Grotesk", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "data-mono": ["Inter", "monospace"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "headline-md": ["Hanken Grotesk", "sans-serif"],
        "display-lg": ["Hanken Grotesk", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "data-mono": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      }
    },
  },
  plugins: [],
}
