// Soft Premium design tokens — centralized for the Lekhoni Kahini redesign.
// Home surfaces use cream/white; reader keeps its own themes.
export const SP = {
  color: {
    wine: '#7B1E2B',
    wineDeep: '#4A1220',
    cream: '#FAF6F1',
    surface: '#FFFFFF',
    wineSoft: '#F5EAED',
    ink: '#29242A',
    inkSoft: '#777078',
    gold: '#C9972B',
    goldSoft: '#F3D48A',
    success: '#34775D',
    line: '#E8E0E3',
    danger: '#B3261E',
  },
  // 4px spacing grid
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
  radius: { sm: 12, md: 14, lg: 18, xl: 22 },
  // Minimum practical touch target
  touch: 44,
  font: { bn: 'TiroBangla-Regular', en: 'IMFellEnglish' },
} as const;

export type SpColor = keyof typeof SP.color;
