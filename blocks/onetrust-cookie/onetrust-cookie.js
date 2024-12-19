import { readExactBlockConfig } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const blockConfig = readExactBlockConfig(block.cloneNode(true));
  block.innerHTML = '';
  const initializeOneTrust = async () => {
    await OneTrust.NoticeApi.Initialized.then(async () => { // eslint-disable-line
      await OneTrust.NoticeApi.LoadNotices([ // eslint-disable-line
        'https://privacyportalde-cdn.onetrust.com/c579c0d0-360f-49c0-bccc-f7b7cded31cd/privacy-notices/8b719598-1655-4d2d-879b-9b2e633813ac.json',
      ], false);
    }).catch((error) => {
      console.error("Error initializing OneTrust: ", error); // eslint-disable-line
    });
  };

  const removeVersionElements = () => {
    const versionElements = document.getElementsByClassName('otnotice-version');
    Array.from(versionElements).forEach((el) => el.remove());
  };

  function updateOpCoDetails(opCoDetails) {
    const versionNumber = document.getElementsByClassName('otnotice-public-version')[0].innerHTML;
    const versionNum = document.getElementsByClassName('VersionNumber');
    if (opCoDetails.OpCoName) {
      const opcoNameElements = document.getElementsByClassName('OpCoName');
      Array.from(opcoNameElements).forEach((el) => {
        el.innerHTML = opCoDetails.OpCoName;
      });
    }

    if (opCoDetails.OpCoAddressMultiLine) {
      const opcoAddrElements = document.getElementsByClassName('OpCoAddressMultiLine');
      Array.from(opcoAddrElements).forEach((el) => {
        el.innerHTML = opCoDetails.OpCoAddressMultiLine;
      });
    }

    if (opCoDetails.OpCoEntity) {
      const opcoEntityElements = document.getElementsByClassName('OpCoEntity');
      Array.from(opcoEntityElements).forEach((el) => {
        el.innerHTML = opCoDetails.OpCoEntity;
      });
    }

    if (opCoDetails.OpCoEmail) {
      const opcoEmailElements = document.getElementsByClassName('OpCoEmail');
      Array.from(opcoEmailElements).forEach((el) => {
        el.innerHTML = opCoDetails.OpCoEmail;
        el.href = `mailto:${opCoDetails.OpCoEmail}`;
      });
    }

    // Update the href for OpCoCookiePolicy, OpCoCCPAPolicy, OpCoPrivacyPolicy
    if (opCoDetails.OpCoCookiePolicy) {
      const opcoCookiePolicyElements = document.getElementsByClassName('OpCoCookiePolicy');
      Array.from(opcoCookiePolicyElements).forEach((el) => {
        el.href = opCoDetails.OpCoCookiePolicy;
      });
    }

    if (opCoDetails.OpCoCCPAPolicy) {
      const opcoCCPAPolicyElements = document.getElementsByClassName('OpCoCCPAPolicy');
      Array.from(opcoCCPAPolicyElements).forEach((el) => {
        el.href = opCoDetails.OpCoCCPAPolicy;
      });
    }

    if (opCoDetails.OpCoPrivacyPolicy) {
      const opcoPrivacyPolicyElements = document.getElementsByClassName('OpCoPrivacyPolicy');
      Array.from(opcoPrivacyPolicyElements).forEach((el) => {
        el.href = opCoDetails.OpCoPrivacyPolicy;
      });
    }

    for (let i = 0; i < versionNum.length; i += 1) {
      versionNum[i].innerHTML = versionNumber;
    }

    const versionElements = document.getElementsByClassName('otnotice-version');
    Array.from(versionElements).forEach((el) => {
      el.remove();
    });
  }

  const createAndAppendDiv = () => {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'container';

    const innerDiv = document.createElement('div');
    innerDiv.id = 'otnotice-8b719598-1655-4d2d-879b-9b2e633813ac';
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
      await updateOpCoDetails(blockConfig);
      await removeVersionElements();
    })
    .catch((error) => {
      console.error('Error loading OneTrust script: ', error);  // eslint-disable-line
    });
}
