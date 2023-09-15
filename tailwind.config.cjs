/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
      fontFamily: {
        "inclusive": ["Inclusive Sans"]
      }
    },
	},
  daisyui: {
    themes: ["retro"]
  },
	plugins: [require("@tailwindcss/typography"), require("daisyui")],
}
