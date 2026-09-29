/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // 关闭 preflight：项目有完整的自定义暗色主题，仅使用 Tailwind 的工具类层
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#0e1210",
          panel: "#161d19",
          line: "#2a352e",
          accent: "#d39b46",
          accentLight: "#e8c07a"
        }
      }
    }
  },
  plugins: []
};
