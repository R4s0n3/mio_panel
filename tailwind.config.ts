import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#1a1a1a',
        },
        secondary: {
          900: '#111827',
          800: '#1f2937',
        },
        surface: {
          DEFAULT: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
        },
        headings: '#f8fafc',
        body: '#e4e4e7',
        accent: '#8b5cf6',
        highlight: {
          green: '#32CD32', // Lime Green
          cyan: '#00CED1',  // Dark Turquoise
          magenta: '#FF1493', // Deep Pink
        }
      },
      fontFamily: {
        headline: ["var(--font-jersey-mono)", ...fontFamily.sans],
        subhead: ["var(--font-russo-sans)", ...fontFamily.sans],
        text: ["var(--font-roboto-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;
