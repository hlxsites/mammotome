// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

// eslint-disable-next-line import/prefer-default-export
export function getCookieConsentID(hostname) {
  if (hostname === undefined) {
    return undefined;
  }

  // The cookie ID
  let csID = '65cf64d7-d2d8-4632-92ad-35ad2676f463';
  if (!hostname.endsWith('.mammotome.com')) {
    // The OneTrust documentation specifies to suffix the ID with -test when running in
    // a dev or stage testing domain
    // https://about.gitlab.com/handbook/marketing/digital-experience/onetrust-cookie-consent/
    csID += '-test';
  }
  return csID;
}

export function loadCookieConsent(doc, hostname) {
  const csID = getCookieConsentID(hostname);

  const cookieScript = doc.createElement('script');
  cookieScript.setAttribute('src', 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js');
  cookieScript.setAttribute('data-document-language', 'true');
  cookieScript.setAttribute('type', 'text/javascript');
  cookieScript.setAttribute('charset', 'UTF-8');
  cookieScript.setAttribute('data-domain-script', csID);
  doc.head.appendChild(cookieScript);
}

loadCookieConsent(document, window.location.hostname);

// The OneTrust website says to define this function like this.
// eslint-disable-next-line no-unused-vars
function OptanonWrapper() { }
