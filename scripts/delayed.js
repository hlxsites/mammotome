// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders } from './lib-franklin.js';

// google tag manager
function loadGTM() {
  const scriptTag = document.createElement('script');
  scriptTag.innerHTML = `
  // googleTagManager
  (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({
          'gtm.start':
              new Date().getTime(), event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src =
          'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-KNBZTHP');
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('set', {
      'cookie_flags': 'SameSite=None;Secure'
  });
  `;
  document.head.prepend(scriptTag);
}

document.dispatchEvent(new Event('franklin.delayed_begin'));

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
try {
  await fetchPlaceholders();

  if (!window.location.hostname.includes('localhost') && !document.location.hostname.includes('.hlx.page')) {
    loadGTM();
  }
} catch (error) { /* empty */ }

document.dispatchEvent(new Event('franklin.delayed_completed'));
