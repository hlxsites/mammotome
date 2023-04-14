// eslint-disable-next-line import/no-cycle
import { sampleRUM, fetchPlaceholders, getConfigValue } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
try {
  await fetchPlaceholders();
} catch (error) { /* empty */ }

// eslint-disable-next-line import/prefer-default-export
export async function getCookieConsentID(hostname) {
  if (hostname === undefined) {
    return undefined;
  }
  // The domains we want to use the id for - otherwise, we will append '-test'
  const domains = [].concat(await getConfigValue('otDomain', '.mammotome.com'));
  // The cookie ID
  let csID = await getConfigValue('otID', '65cf64d7-d2d8-4632-92ad-35ad2676f463');
  if (!domains.some((domain) => hostname.endsWith(domain))) {
    // The OneTrust documentation specifies to suffix the ID with -test when running in
    // a dev or stage testing domain
    // https://about.gitlab.com/handbook/marketing/digital-experience/onetrust-cookie-consent/
    csID += '-test';
  }
  return csID;
}

export async function loadCookieConsent(doc, hostname) {
  const csID = await getCookieConsentID(hostname);

  const cookieScript = doc.createElement('script');
  cookieScript.setAttribute('src', 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js');
  cookieScript.setAttribute('data-document-language', 'true');
  cookieScript.setAttribute('type', 'text/javascript');
  cookieScript.setAttribute('charset', 'UTF-8');
  cookieScript.setAttribute('data-domain-script', csID);
  doc.head.appendChild(cookieScript);
}

await loadCookieConsent(document, window.location.hostname);

// The OneTrust website says to define this function like this.
// eslint-disable-next-line no-unused-vars
function OptanonWrapper() { }
