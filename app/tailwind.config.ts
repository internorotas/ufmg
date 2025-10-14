import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        card: 'var(--card-background)',
        'card-hover': 'var(--card-background)',
        'card-border': 'var(--card-border)',
        sidebar: 'var(--sidebar-background)',
        modal: 'var(--modal-background)',
        input: 'var(--input-background)',
        'internoRotas-azul-eletrico': 'var(--color-internoRotas-azul-eletrico)',
        'internoRotas-bege-areia': 'var(--color-internoRotas-bege-areia)',
        'internoRotas-laranja-ambar': 'var(--color-internoRotas-laranja-ambar)',
        'internoRotas-preto-carvao': 'var(--color-internoRotas-preto-carvao)',
        'internoRotas-cinza-grafite': 'var(--color-internoRotas-cinza-grafite)',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
