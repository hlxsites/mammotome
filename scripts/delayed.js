// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
fetchPlaceholders(`/${window.location.pathname.split('/')[1]}`);
