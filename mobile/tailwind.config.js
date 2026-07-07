/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        amber: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
        },
        success: "#10B981",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};
