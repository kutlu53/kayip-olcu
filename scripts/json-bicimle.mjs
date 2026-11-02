// Icerik JSON dosyalarini okunur tutar: kisa nesne/diziler tek satirda, uzunlar alt alta.
// Metinlerin icine dokunmaz. Kullanim: node scripts/json-bicimle.mjs src/data/scenes.json ...
import fs from 'fs';

const SINIR = 110;

function tekSatir(d) {
  if (d === null || typeof d !== 'object') return JSON.stringify(d);
  if (Array.isArray(d)) return `[${d.map(tekSatir).join(', ')}]`;
  return `{${Object.entries(d).map(([k, v]) => `${JSON.stringify(k)}: ${tekSatir(v)}`).join(', ')}}`;
}

function bicimle(d, girinti = '') {
  const tek = tekSatir(d);
  if (d === null || typeof d !== 'object' || girinti.length + tek.length <= SINIR) return tek;
  const ic = girinti + '  ';
  if (Array.isArray(d)) return `[\n${d.map((x) => ic + bicimle(x, ic)).join(',\n')}\n${girinti}]`;
  return `{\n${Object.entries(d).map(([k, v]) => `${ic}${JSON.stringify(k)}: ${bicimle(v, ic)}`).join(',\n')}\n${girinti}}`;
}

for (const dosya of process.argv.slice(2)) {
  const veri = JSON.parse(fs.readFileSync(dosya, 'utf8'));
  fs.writeFileSync(dosya, bicimle(veri) + '\n');
  console.log(dosya, fs.readFileSync(dosya, 'utf8').split('\n').length, 'satır');
}
