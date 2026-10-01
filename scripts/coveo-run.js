// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders } from './lib-franklin.js';

document.dispatchEvent(new Event('franklin.delayed_begin'));

// Fathom Analytics Code
async function loadScriptFa(src, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Script load error'));
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

const attrsFa = { 'data-site': 'MTMDHVUG' };
loadScriptFa('https://cdn.usefathom.com/script.js', attrsFa);

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
try {
  await fetchPlaceholders();
} catch (error) { /* empty */ }

document.dispatchEvent(new Event('franklin.delayed_completed'));
