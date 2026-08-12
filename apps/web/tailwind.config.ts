import type { Config } from 'tailwindcss';
import preset from '@loquia/config/tailwind-preset';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  presets: [preset as Partial<Config>],
  content: [
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
