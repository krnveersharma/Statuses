export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",   // if you have components folder
    "./node_modules/@shadcn/ui/**/*.{js,ts,jsx,tsx}", // 👈 this is CRITICAL
  ],
  
  theme: {
    extend: {},
  },
  plugins: [  require("tailwindcss-animate"),
  ],
}
