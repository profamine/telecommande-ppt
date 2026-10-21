import { loadFont } from '@remotion/google-fonts/Cairo';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '900'],
  subsets: ['arabic', 'latin'],
});

export const FONT = fontFamily;

// Couleurs de l'application
export const C = {
  bg: '#111318',
  panel: '#1b1e26',
  panel2: '#252a35',
  text: '#eef0f5',
  muted: '#8b93a7',
  accent: '#e8643c',
  accent2: '#ff8a5c',
  ok: '#3ccf7a',
  danger: '#3a2226',
};

export const AUTHOR = 'AMINE AMAHAN';
