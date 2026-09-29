/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        panel: "#131a2a",
        panel2: "#1a2336",
        edge: "#2a3550",
        accent: "#f5b301",
        go: "#34d399",
        stop: "#f87171"
      }
    }
  },
  plugins: []
};
