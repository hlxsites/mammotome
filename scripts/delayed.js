// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders } from './lib-franklin.js';

document.dispatchEvent(new Event('franklin.delayed_begin'));

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
try {
  await fetchPlaceholders();
} catch (error) { /* empty */ }

console.log('delayed.js loaded');
document.dispatchEvent(new Event('franklin.delayed_completed'));
