#!/usr/bin/env node
// Applique 3 palettes "premium" sur les 3 copies de template-4-avis.
// Modifie UNIQUEMENT css/style.css de chaque palette.

const fs = require('fs');
const path = require('path');

const palettes = {
  'palette-1-anthracite-or': {
    label: 'Maison de Maître — Anthracite + Champagne',
    primary:        '#1F1F23',
    primaryDark:    '#0F0F12',
    primaryLight:   '#3A3A42',
    bg:             '#F5F2EC',
    surface:        '#FFFFFF',
    bgAlt:          '#EBE6DC',
    border:         '#D8D1C2',
    text:           '#15151A',
    textMuted:      '#6B6760',
    textInverse:    '#F5F2EC',
    accent:         '#B89968',  // champagne / vieil or
    accentDark:     '#9C7E50',
    success:        '#2D7A4F',
    error:          '#C5384B',
    star:           '#C9A876',
    // RGB pour les rgba() hardcodés
    accentRgb:      '184, 153, 104',
    primaryDarkRgb: '15, 15, 18',
  },
  'palette-2-vert-cuivre': {
    label: 'Héritage anglais — Vert sapin + Cuivre brûlé',
    primary:        '#1F3D2E',
    primaryDark:    '#15291F',
    primaryLight:   '#2E5642',
    bg:             '#F4F1E8',
    surface:        '#FFFFFF',
    bgAlt:          '#E9E4D5',
    border:         '#D5CFBE',
    text:           '#161A18',
    textMuted:      '#5E6660',
    textInverse:    '#F4F1E8',
    accent:         '#A8632A',  // cuivre brûlé
    accentDark:     '#874C1C',
    success:        '#2D7A4F',
    error:          '#C5384B',
    star:           '#C9985A',
    accentRgb:      '168, 99, 42',
    primaryDarkRgb: '21, 41, 31',
  },
  'palette-3-encre-laiton': {
    label: 'Atelier contemporain — Bleu encre + Laiton brossé',
    primary:        '#1A2233',
    primaryDark:    '#10162A',
    primaryLight:   '#2D3A52',
    bg:             '#EFEAE0',
    surface:        '#FFFFFF',
    bgAlt:          '#E2DBCC',
    border:         '#CFC7B5',
    text:           '#11141B',
    textMuted:      '#5A6271',
    textInverse:    '#EFEAE0',
    accent:         '#A88838',  // laiton brossé
    accentDark:     '#896D27',
    success:        '#2D7A4F',
    error:          '#C5384B',
    star:           '#C9A858',
    accentRgb:      '168, 136, 56',
    primaryDarkRgb: '16, 22, 42',
  },
};

const ROOT = '/Users/clement/Documents/Claude/Templates/peintres/tests-couleurs';

for (const [folder, p] of Object.entries(palettes)) {
  const cssPath = path.join(ROOT, folder, 'css', 'style.css');
  let css = fs.readFileSync(cssPath, 'utf8');

  // 1. Remplace les tokens :root
  const tokenMap = {
    '--color-primary:        #1E3A5F': `--color-primary:        ${p.primary}`,
    '--color-primary-dark:   #142948': `--color-primary-dark:   ${p.primaryDark}`,
    '--color-primary-light:  #2F5588': `--color-primary-light:  ${p.primaryLight}`,
    '--color-bg:             #FAF7F1': `--color-bg:             ${p.bg}`,
    '--color-surface:        #FFFFFF': `--color-surface:        ${p.surface}`,
    '--color-bg-alt:         #F1ECE0': `--color-bg-alt:         ${p.bgAlt}`,
    '--color-border:         #E5DDD0': `--color-border:         ${p.border}`,
    '--color-text:           #1A1F26': `--color-text:           ${p.text}`,
    '--color-text-muted:     #5C6470': `--color-text-muted:     ${p.textMuted}`,
    '--color-text-inverse:   #FAF7F1': `--color-text-inverse:   ${p.textInverse}`,
    '--color-accent:         #E8753A': `--color-accent:         ${p.accent}`,
    '--color-accent-dark:    #C95C24': `--color-accent-dark:    ${p.accentDark}`,
    '--color-success:        #2D7A4F': `--color-success:        ${p.success}`,
    '--color-error:          #C5384B': `--color-error:          ${p.error}`,
    '--color-star:           #D4A24C': `--color-star:           ${p.star}`,
  };
  for (const [k, v] of Object.entries(tokenMap)) {
    if (!css.includes(k)) {
      console.warn(`[${folder}] token introuvable : ${k}`);
    }
    css = css.split(k).join(v);
  }

  // 2. Remplace les rgba(232, 117, 58, X) hardcodés (accent terracotta)
  css = css.replace(/rgba\(232,\s*117,\s*58,\s*([\d.]+)\)/g,
    (_, a) => `rgba(${p.accentRgb}, ${a})`);

  // 3. Remplace les rgba(20, 41, 72, X) hardcodés (primary-dark navy)
  css = css.replace(/rgba\(20,\s*41,\s*72,\s*([\d.]+)\)/g,
    (_, a) => `rgba(${p.primaryDarkRgb}, ${a})`);

  fs.writeFileSync(cssPath, css);
  console.log(`✓ ${folder} — ${p.label}`);
}

console.log('\nDone.');
