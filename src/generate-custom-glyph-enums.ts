import { loadSync } from 'opentype.js';
import { webfont } from 'webfont';
import { writeFile } from './helpers.js';
import { infoLog } from './log.js';
import svg2ttf from 'svg2ttf';
import ttf2woff2 from 'ttf2woff2';
import ttf2woff from 'ttf2woff';
import fse from 'fs-extra';

const { writeFileSync, unlinkSync } = fse;
const acc: Record<string, number> = {};
const TAG = 'CUSTOM-GLYPHS';
const options = {
  ts: 0,
  description: 'generated by d2ai for Destiny Item Manager',
  url: 'http://www.destinyitemmanager.com',
};

const svgFont = await webfont({
  files: './DIM-custom-font/SVGs/',
  dest: './DIM-custom-font/',
  fontName: 'DIM-Symbols',
  prependUnicode: true,
  startUnicode: 0xf0000,
  centerHorizontally: true,
  fontHeight: '960',
  descent: '150',
});

const woffFile = './DIM-custom-font/DIM-Symbols.woff';
const woff2File = './output/DIMSymbols.woff2';
// loadSync requires .otf or .woff filetype for enumeration
const ttf = Buffer.from(svg2ttf(String(svgFont.svg), options).buffer);
writeFileSync(woffFile, ttf2woff(ttf));
infoLog(TAG, `TEMP: ${woffFile} saved.`);
// Generate font format to be used by DIM
writeFileSync(woff2File, ttf2woff2(ttf));
infoLog(TAG, `${woff2File} saved.`);

const font = loadSync(woffFile);

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);
  if (glyph.name && glyph.unicode) {
    acc[glyph.name] = glyph.unicode;
  }
}

const outputEnum = `export const enum DimCustomSymbols {${Object.entries(acc)
  .filter(([, value]) => typeof value === 'number')
  .sort(([, num1], [, num2]) => num1 - num2)
  .map(([label, value]) => `${label.replace(/[^\w]/g, '_')} = ${value},`)
  .join('\n')}}`;

writeFile('./output/dim-custom-symbols.ts', outputEnum);
writeFile('./data/dim-custom-symbols.ts', outputEnum);
// no need to keep this temp file
unlinkSync(woffFile);
infoLog(TAG, `TEMP: ${woffFile} removed.`);
