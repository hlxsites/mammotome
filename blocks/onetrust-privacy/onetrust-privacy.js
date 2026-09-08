import { readExactBlockConfig, getInfo } from '../../scripts/lib-franklin.js';
import { mergeOpCoBlockConfig, applyOpCoDetailsToNotice } from '../onetrust-shared/opco-notice-helpers.js';

export default function decorate(block) {
  const blockConfig = readExactBlockConfig(block.cloneNode(true));
  const opCoDetails = mergeOpCoBlockConfig(blockConfig);
  block.innerHTML = '';

  const { country, language } = getInfo();

  const baseNoticeId = 'afca6a13-75db-4fd7-b522-74a5a9d459de';
  const baseUrl = 'https://privacyportalde-cdn.onetrust.com/c579c0d0-360f-49c0-bccc-f7b7cded31cd/privacy-notices';

  const locale = (language && country && language !== 'en') ? `-${language}-${country}` : '';
  const localizedNoticeUrl = `${baseUrl}/${baseNoticeId}${locale}.json`;
  const englishNoticeUrl = `${baseUrl}/${baseNoticeId}.json`;

  const initializeOneTrust = async () => {
    await OneTrust.NoticeApi.Initialized.then(async () => { // eslint-disable-line
      // Try loading the localized version first
      const noticeUrl = locale ? localizedNoticeUrl : englishNoticeUrl;
      // eslint-disable-next-line no-console
      console.log('OneTrust Privacy Notice URL (attempting):', noticeUrl);

      try {
        await OneTrust.NoticeApi.LoadNotices([noticeUrl], false); // eslint-disable-line
        // eslint-disable-next-line no-console
        console.log('OneTrust Privacy Notice loaded successfully');
      } catch (error) {
        // If localized version fails and we have a locale, try English fallback
        if (locale) {
          // eslint-disable-next-line no-console
          console.log('Localized notice not found, falling back to English:', englishNoticeUrl);
          try {
            await OneTrust.NoticeApi.LoadNotices([englishNoticeUrl], false); // eslint-disable-line
            // eslint-disable-next-line no-console
            console.log('OneTrust Privacy Notice loaded successfully (English fallback)');
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

  function updateKoreanDetails() {
    const koreanAddr = document.getElementsByClassName('korean_address');
    for (let i = 0; i < koreanAddr.length; i += 1) {
      koreanAddr[i].innerHTML = '02-2138-2878\n9F, 16 Maeheon-ro, Seocho-gu, Seoul, 06771, Korea\nkoreaprivacy@mammotome.com';
    }

    const koreanTitles = document.getElementsByClassName('korean-title');
    for (let i = 0; i < koreanTitles.length; i += 1) {
      koreanTitles[i].innerHTML = 'Eunyoung (Shirley) Chung\nCountry Manager\nMMT Korea';
    }
  }

  function updateJapanDetails() {
    const japanAddr = document.getElementsByClassName('japan_address');
    for (let i = 0; i < japanAddr.length; i += 1) {
      japanAddr[i].innerHTML = 'Devicor Medical Japan K.K.\n1-29-9 Takadanobaba\nShinjuku-ku, Tokyo 169-0075';
    }
  }

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
      script.src = 'https://privacyportalde-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js';
      script.type = 'text/javascript';
      script.charset = 'UTF-8';
      script.setAttribute('settings', 'eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vcHJpdmFjeXBvcnRhbC1kZS5vbmV0cnVzdC5jb20vcmVxdWVzdC92MS9wcml2YWN5Tm90aWNlcy9zdGF0cy92aWV3cyJ9');
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
      await updateKoreanDetails();
      await updateJapanDetails();
    })
    .catch((error) => {
      console.error('Error loading OneTrust script: ', error);  // eslint-disable-line
    });
}
