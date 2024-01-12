// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders, loadScript } from './lib-franklin.js';

document.dispatchEvent(new Event('franklin.delayed_begin'));

// Fathom Analytics Code
const attrsFa = JSON.parse('{"data-site": "MTMDHVUG"}');
loadScript('https://cdn.usefathom.com/script.js', attrsFa);

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
try {
  await fetchPlaceholders();
} catch (error) { /* empty */ }

document.dispatchEvent(new Event('franklin.delayed_completed'));
