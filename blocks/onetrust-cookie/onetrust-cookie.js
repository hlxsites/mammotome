import { readExactBlockConfig, getInfo } from '../../scripts/lib-franklin.js';
import { mergeOpCoBlockConfig, applyOpCoDetailsToNotice } from '../onetrust-shared/opco-notice-helpers.js';

export default function decorate(block) {
  const blockConfig = readExactBlockConfig(block.cloneNode(true));
  const opCoDetails = mergeOpCoBlockConfig(blockConfig);
  block.innerHTML = '';

  // Get the current page's language and country
  const { country, language } = getInfo();

  // Construct the notice URL based on language
  const baseNoticeId = '8b719598-1655-4d2d-879b-9b2e633813ac';
  const baseUrl = 'https://privacyportalde-cdn.onetrust.com/c579c0d0-360f-49c0-bccc-f7b7cded31cd/privacy-notices';

  // Build locale suffix (e.g., 'pl-pl' for Polish Poland)
  // For default English, no suffix is needed
  const locale = (language && country && language !== 'en') ? `-${language}-${country}` : '';
  const localizedNoticeUrl = `${baseUrl}/${baseNoticeId}${locale}.json`;
  const englishNoticeUrl = `${baseUrl}/${baseNoticeId}.json`;

  const initializeOneTrust = async () => {
    await OneTrust.NoticeApi.Initialized.then(async () => { // eslint-disable-line
      // Try loading the localized version first
      const noticeUrl = locale ? localizedNoticeUrl : englishNoticeUrl;
      // eslint-disable-next-line no-console
      console.log('OneTrust Cookie Notice URL (attempting):', noticeUrl);

      try {
        await OneTrust.NoticeApi.LoadNotices([noticeUrl], false); // eslint-disable-line
        // eslint-disable-next-line no-console
        console.log('OneTrust Cookie Notice loaded successfully');
      } catch (error) {
        // If localized version fails and we have a locale, try English fallback
        if (locale) {
          // eslint-disable-next-line no-console
          console.log('Localized notice not found, falling back to English:', englishNoticeUrl);
          try {
            await OneTrust.NoticeApi.LoadNotices([englishNoticeUrl], false); // eslint-disable-line
            // eslint-disable-next-line no-console
            console.log('OneTrust Cookie Notice loaded successfully (English fallback)');
          } catch (fallbackError) {
            console.error("Error loading English fallback: ", fallbackError); // eslint-disable-line
          }
        } else {
          console.error("Error initializing OneTrust: ", error); // eslint-disable-line
        }
      }
    }).catch((error) => {
      console.error("Error initializing OneTrust API: ", error); // eslint-disable-line
    });
  };

  const removeVersionElements = () => {
    const versionElements = document.getElementsByClassName('otnotice-version');
    Array.from(versionElements).forEach((el) => el.remove());
  };

  const createAndAppendDiv = () => {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'container';

    const innerDiv = document.createElement('div');
    innerDiv.id = `otnotice-${baseNoticeId}`;
    innerDiv.className = 'otnotice';

    containerDiv.appendChild(innerDiv);
    block.appendChild(containerDiv);
  };

  const addOneTrustScript = () => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://privacyportal-uatde-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js';
      script.type = 'text/javascript';
      script.charset = 'UTF-8';
      script.id = 'otprivacy-notice-script';

      script.onload = () => resolve(script);
      script.onerror = (error) => reject(error);

      document.head.appendChild(script);
    });
  };

  addOneTrustScript()
    .then(async () => {
      await createAndAppendDiv();
      await initializeOneTrust();
      applyOpCoDetailsToNotice(opCoDetails);
      await removeVersionElements();
    })
    .catch((error) => {
      console.error('Error loading OneTrust script: ', error);  // eslint-disable-line
    });
}
