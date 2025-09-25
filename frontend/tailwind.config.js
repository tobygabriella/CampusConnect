/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./src/Components/**/*.{js,ts,jsx,tsx}",
      "./src/SignUp/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        screens: {
          'lg-custom': '850px',
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)'
        },
        colors: {
          // Updated Aro color scheme based on screenshots
          'aro-navy': '#010a4f',       // Dark blue/navy text
          'aro-blue': '#1e3a8a',       // Main blue
          'aro-light-blue': '#e8f1ff', // Light blue background
          'aro-bg': '#f8faff',         // Very light blue background
          'aro-accent': '#5a67d8',     // Purple accent
          'aro-gray': '#64748b',       // Text gray
          'aro-light-gray': '#e2e8f0', // Light gray for borders
          
          // Existing shadcn/ui theme
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))'
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))'
          },
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))'
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))'
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))'
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))'
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))'
          },
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          chart: {
            '1': 'hsl(var(--chart-1))',
            '2': 'hsl(var(--chart-2))',
            '3': 'hsl(var(--chart-3))',
            '4': 'hsl(var(--chart-4))',
            '5': 'hsl(var(--chart-5))'
          }
        },
        keyframes: {
          'fade-in-up': {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' }
          },
          'fade-in': {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          },
          'scale-in': {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' }
          },
          'slide-in-right': {
            '0%': { transform: 'translateX(100%)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' }
          },
          'slide-in-left': {
            '0%': { transform: 'translateX(-100%)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' }
          },
          'float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' }
          },
        },
        animation: {
          'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
          'fade-in': 'fade-in 0.5s ease-out forwards',
          'scale-in': 'scale-in 0.3s ease-out forwards',
          'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
          'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
          'float': 'float 4s ease-in-out infinite',
        }
      }
    },
    plugins: [require("tailwindcss-animate")],
  };
  
  